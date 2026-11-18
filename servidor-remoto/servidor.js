'use strict';

const path = require('path');
const http = require('http');
const os = require('os');
const express = require('express');
const QRCode = require('qrcode');
const { WebSocketServer } = require('ws');

const PUERTO = process.env.PORT || 3000;
const RAIZ = path.resolve(__dirname, '..');
const PUBLIC = path.join(__dirname, 'public');

const app = express();
app.use(express.static(RAIZ));
app.use('/remote', express.static(path.join(PUBLIC, 'remote.html')));

app.get('/', (req, res) => res.sendFile(path.join(RAIZ, 'index.html')));
app.get('/remote', (req, res) => res.sendFile(path.join(PUBLIC, 'remote.html')));

/* API del repo Reveal-Remote: el QR se genera con la URL que pide el display
   (location.origin + /remote), así funciona aunque haya varias IPs. */
app.get('/api/qr', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'Missing url' });
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 280, margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });
    res.json({ dataUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/connect-info', (req, res) => {
  res.json({ port: PUERTO, ips: ips().map(ip => ip.address) });
});

/* La IP de red que debe usar el celular (nunca localhost, nunca Tailscale):
   preferimos la interfaz Wi-Fi, que es la que comparte el celular. */
app.get('/api/qr-url', (req, res) => {
  const ip = ipPreferida() || req.hostname;
  res.json({ url: `http://${ip}:${PUERTO}/remote` });
});

/* Compatibilidad con la versión anterior */
app.get('/qr', async (req, res) => {
  const url = req.query.url || `http://${ipPreferida() || 'localhost'}:${PUERTO}/remote`;
  try {
    const png = await QRCode.toBuffer(url, { width: 320, margin: 1 });
    res.type('png').send(png);
  } catch (err) {
    res.status(500).send(String(err));
  }
});

const servidor = http.createServer(app);
const wss = new WebSocketServer({ server: servidor });

let display = null;
let controller = null;
let ultimoEstado = { index: 1, total: 6, fragment: 0, totalFragments: 0, lab: false, code: false };

function ips() {
  const redes = os.networkInterfaces();
  const lista = [];
  for (const nombre of Object.keys(redes)) {
    for (const iface of redes[nombre] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        lista.push({ nombre, address: iface.address });
      }
    }
  }
  return lista;
}

/* Wi-Fi primero; si no hay, cualquier IP privada que no sea Tailscale. */
function ipPreferida() {
  const lista = ips();
  const wifi = lista.find(i => /wi-?fi|wireless|wlan|802\.11/i.test(i.nombre));
  if (wifi) return wifi.address;
  const privada = lista.find(i =>
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(i.address) &&
    !/tailscale/i.test(i.nombre)
  );
  return privada ? privada.address : (lista.length ? lista[0].address : null);
}

function enviar(ws, payload) {
  if (ws && ws.readyState === 1) ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
}

function enviarEstado(destino) {
  enviar(destino, Object.assign({ type: 'slideInfo' }, ultimoEstado));
}

wss.on('connection', (ws) => {
  let rol = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch (_) { return; }

    if (msg.type === 'display') {
      if (display && display !== ws) enviar(display, { type: 'replaced' });
      display = ws;
      rol = 'display';
      enviar(controller, { type: 'controller-connected' });
      enviarEstado(controller);
      return;
    }

    if (msg.type === 'controller') {
      if (controller && controller !== ws) enviar(controller, { type: 'replaced' });
      controller = ws;
      rol = 'controller';
      enviar(display, { type: 'controller-connected' });
      enviarEstado(controller);
      return;
    }

    if (msg.type === 'slideInfo' && rol === 'display') {
      ultimoEstado = Object.assign({}, ultimoEstado, {
        index: msg.index, total: msg.total,
        fragment: msg.fragment, totalFragments: msg.totalFragments,
        lab: !!msg.lab, code: !!msg.code
      });
      enviarEstado(controller);
      return;
    }

    if (msg.action && rol === 'controller') {
      enviar(display, { action: msg.action });
      return;
    }

    /* Consulta escrita en el celular → input de la slide interactiva. */
    if (msg.type === 'query' && rol === 'controller') {
      enviar(display, { type: 'query', value: String(msg.value || '').slice(0, 80) });
      return;
    }

    /* Escritura en vivo: cada tecla del celular se replica en la compu. */
    if (msg.type === 'input' && rol === 'controller') {
      enviar(display, { type: 'input', value: String(msg.value || '').slice(0, 80) });
      return;
    }

    /* Estado del laboratorio → celular, para mostrar feedback. */
    if (msg.type === 'labInfo' && rol === 'display') {
      enviar(controller, {
        type: 'labInfo',
        state: String(msg.state || ''),
        result: String(msg.result || ''),
        ok: !!msg.ok,
        bad: !!msg.bad
      });
    }

    /* Parte del código visible → celular, para mostrarlа en el remoto. */
    if (msg.type === 'codeInfo' && rol === 'display') {
      enviar(controller, {
        type: 'codeInfo',
        page: msg.page,
        total: msg.total,
        label: String(msg.label || '')
      });
    }
  });

  ws.on('close', () => {
    if (display === ws) {
      display = null;
      enviar(controller, { type: 'display-disconnected' });
    }
    if (controller === ws) {
      controller = null;
      enviar(display, { type: 'controller-disconnected' });
    }
  });
});

servidor.listen(PUERTO, '0.0.0.0', () => {
  console.log('');
  console.log('============================================');
  console.log('  PRESENTACION CON CONTROL REMOTO');
  console.log('============================================');
  console.log('');
  console.log('  PC (abri en el navegador de la compu):');
  console.log('    http://localhost:' + PUERTO);
  console.log('');
  const lista = ips();
  if (!lista.length) {
    console.log('  CELULAR: no se pudo detectar la IP. Buscala con ipconfig.');
  } else {
    console.log('  CELULAR (la del QR marcada con *):');
    lista.forEach(i => {
      const mark = i.address === ipPreferida() ? ' *' : '  ';
      console.log(`   ${mark} http://${i.address}:${PUERTO}/remote  (${i.nombre})`);
    });
  }
  console.log('');
  console.log('  QR: pasá el mouse al borde superior de la presentación');
  console.log('');
  console.log('============================================');
  console.log('');
});
