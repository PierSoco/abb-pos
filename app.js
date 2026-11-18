/* ============================================================
   ABB × POS — diagramas SVG + motor de búsqueda ABB + init Reveal.js
   ============================================================ */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var TONES = { cyan: '#38BDF8', emerald: '#10B981', amber: '#FBBF24', slate: '#94A3B8', red: '#F87171' };

  /* ---------- utilidades SVG ---------- */
  function svgEl(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      }
    }
    return node;
  }

  function texto(x, y, str, cls) {
    var t = svgEl('text', { x: x, y: y, class: cls, 'text-anchor': 'middle' });
    t.textContent = str;
    return t;
  }

  function anchor(n, side) {
    if (side === 'top') return [n.cx, n.cy - n.h / 2];
    if (side === 'bottom') return [n.cx, n.cy + n.h / 2];
    if (side === 'left') return [n.cx - n.w / 2, n.cy];
    return [n.cx + n.w / 2, n.cy];
  }

  function linkPath(a, b, curve) {
    if (!curve) return 'M ' + a[0] + ' ' + a[1] + ' L ' + b[0] + ' ' + b[1];
    var dir = b[0] >= a[0] ? 1 : -1;
    var k = Math.max(34, Math.abs(b[0] - a[0]) * 0.38);
    return 'M ' + a[0] + ' ' + a[1] +
      ' C ' + (a[0] + dir * k) + ' ' + a[1] + ', ' + (b[0] - dir * k) + ' ' + b[1] + ', ' + b[0] + ' ' + b[1];
  }

  /* marca un elemento como fragmento (solo variantes de opacidad dentro de SVG) */
  function fragify(e, node) {
    if (!e.frag) return;
    node.classList.add('fragment');
    if (e.fragMode) node.classList.add(e.fragMode);
    if (e.fi !== undefined && e.fi !== null) node.setAttribute('data-fragment-index', String(e.fi));
  }

  /* ---------- constructor de diagramas estáticos ---------- */
  function buildDiagram(mount, cfg) {
    if (!mount) return;
    var byId = {};
    cfg.elements.forEach(function (e) { if (e.id) byId[e.id] = e; });

    var svg = svgEl('svg', { viewBox: cfg.viewBox, class: 'dg', 'aria-hidden': 'true' });

    var defs = svgEl('defs');
    Object.keys(TONES).forEach(function (t) {
      var m = svgEl('marker', {
        id: 'arr-' + cfg.id + '-' + t,
        viewBox: '0 0 10 10', refX: 8, refY: 5,
        markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse'
      });
      m.appendChild(svgEl('path', { d: 'M0 1.1 L8.8 5 L0 8.9 Z', fill: TONES[t], opacity: '0.9' }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);

    function layer(cls) {
      var g = svgEl('g', { class: cls });
      svg.appendChild(g);
      return g;
    }
    var gLinks = layer('g-links');
    var gShapes = layer('g-shapes');
    var gText = layer('g-text');

    function txt(x, y, str, cls) {
      var t = svgEl('text', { x: x, y: y, class: cls, 'text-anchor': 'middle' });
      t.textContent = str;
      return t;
    }

    cfg.elements.forEach(function (e) {
      if (e.kind === 'edge' || e.kind === 'beam') {
        var a = byId[e.a], b = byId[e.b];
        if (!a || !b) return;
        var p = svgEl('path', {
          d: linkPath(anchor(a, e.as || 'bottom'), anchor(b, e.bs || 'top'), e.curve),
          class: (e.kind === 'beam' ? 'dbeam ' : 'dedge ') + 'tone-' + e.tone
        });
        if (e.dash) p.setAttribute('stroke-dasharray', e.kind === 'beam' ? '8 7' : '5 5');
        if (e.marker) p.setAttribute('marker-end', 'url(#arr-' + cfg.id + '-' + e.tone + ')');
        if (e.opacity !== undefined && e.opacity !== null) p.setAttribute('opacity', String(e.opacity));
        fragify(e, p);
        gLinks.appendChild(p);
        return;
      }

      if (e.kind === 'halo') {
        var n = byId[e.at];
        if (!n) return;
        var pad = 7;
        var r = svgEl('rect', {
          x: n.cx - (n.w + pad * 2) / 2,
          y: n.cy - (n.h + pad * 2) / 2,
          width: n.w + pad * 2,
          height: n.h + pad * 2,
          rx: 14,
          class: 'dhalo tone-' + e.tone
        });
        if (e.opacity !== undefined && e.opacity !== null) r.setAttribute('opacity', String(e.opacity));
        fragify(e, r);
        gShapes.appendChild(r);
        return;
      }

      if (e.kind === 'node') {
        var g = svgEl('g', { class: 'dnode tone-' + e.tone + (e.sans ? ' dnode--sans' : '') });
        g.appendChild(svgEl('rect', {
          x: e.cx - e.w / 2, y: e.cy - e.h / 2, width: e.w, height: e.h, rx: 13, class: 'dnode-bg'
        }));
        g.appendChild(txt(e.cx, e.cy + (e.sub ? -3 : 4), e.code, 'dnode-code'));
        if (e.sub) g.appendChild(txt(e.cx, e.cy + 15, e.sub, 'dnode-sub'));
        if (e.opacity !== undefined && e.opacity !== null) g.setAttribute('opacity', String(e.opacity));
        fragify(e, g);
        gShapes.appendChild(g);
        return;
      }

      if (e.kind === 'chip') {
        var cg = svgEl('g', { class: 'dchip tone-' + e.tone });
        cg.appendChild(svgEl('rect', {
          x: e.cx - e.w / 2, y: e.cy - 15, width: e.w, height: 30, rx: 15, class: 'dchip-bg'
        }));
        cg.appendChild(txt(e.cx, e.cy + 4, e.text, 'dchip-t'));
        if (e.opacity !== undefined && e.opacity !== null) cg.setAttribute('opacity', String(e.opacity));
        fragify(e, cg);
        gShapes.appendChild(cg);
        return;
      }

      if (e.kind === 'card') {
        var dg = svgEl('g', { class: 'dcard' + (e.dash ? ' dcard--dash' : '') });
        dg.appendChild(svgEl('rect', {
          x: e.cx - e.w / 2, y: e.cy - e.h / 2, width: e.w, height: e.h, rx: 15, class: 'dcard-bg'
        }));
        dg.appendChild(txt(e.cx, e.sub ? e.cy - 6 : e.cy + 5, e.title, 'dcard-title'));
        if (e.sub) dg.appendChild(txt(e.cx, e.cy + 16, e.sub, 'dcard-sub'));
        if (e.dots) {
          dg.appendChild(svgEl('circle', { cx: e.cx - e.w / 2, cy: e.cy, r: 4, class: 'dcard-dot-c' }));
          dg.appendChild(svgEl('circle', { cx: e.cx + e.w / 2, cy: e.cy, r: 4, class: 'dcard-dot-e' }));
        }
        if (e.opacity !== undefined && e.opacity !== null) dg.setAttribute('opacity', String(e.opacity));
        fragify(e, dg);
        gShapes.appendChild(dg);
        return;
      }

      if (e.kind === 'label') {
        var lt = svgEl('text', {
          x: e.x, y: e.y, class: e.cls || ('dlabel tone-' + e.tone), 'text-anchor': 'middle'
        });
        lt.textContent = e.text;
        if (e.opacity !== undefined && e.opacity !== null) lt.setAttribute('opacity', String(e.opacity));
        fragify(e, lt);
        gText.appendChild(lt);
      }
    });

    mount.appendChild(svg);
  }

  /* ============================================================
     CONFIGS ESTÁTICOS
     ============================================================ */

  /* --- mini árbol O(log n) del slide 2 --- */
  var miniCfg = (function () {
    var P = { root: [160, 26], l: [80, 98], r: [240, 98], ll: [35, 170], lr: [125, 170], rl: [195, 170], rr: [285, 170] };
    var codes = {
      root: '7790500', l: '7790100', r: '7790800', ll: '7790040',
      lr: '7790300', rl: '7790700', rr: '7790900'
    };
    var nodes = Object.keys(P).map(function (id) {
      return {
        kind: 'node', id: id, cx: P[id][0], cy: P[id][1], w: 58, h: 28,
        code: codes[id], tone: 'emerald',
        opacity: (id === 'l' || id === 'll' || id === 'lr') ? 0.4 : 1
      };
    });
    var edges = [
      ['root', 'l'], ['root', 'r'], ['l', 'll'], ['l', 'lr'], ['r', 'rl'], ['r', 'rr']
    ].map(function (pr, i) {
      var dim = (pr[0] === 'root' && pr[1] === 'l') || pr[0] === 'l';
      return { kind: 'edge', id: 'e' + i, a: pr[0], b: pr[1], tone: 'emerald', opacity: dim ? 0.35 : 1 };
    });
    return {
      id: 'mini', viewBox: '0 0 320 196',
      elements: edges.concat([
        { kind: 'beam', id: 'bm', a: 'root', b: 'r', tone: 'emerald', opacity: 1 },
        { kind: 'halo', id: 'hl', at: 'r', tone: 'emerald', opacity: 1 }
      ], nodes)
    };
  })();

  /* --- arquitectura de doble índice (slide 3) --- */
  var archCfg = (function () {
    var W = 108, H = 48;
    var left = [
      ['nl0', 235, 70, '7790500', 'Leche'],
      ['nl1', 115, 178, '7790100', 'Arroz'],
      ['nl2', 355, 178, '7790800', 'Yerba'],
      ['nl3', 55, 286, '7790040', 'Alfajor'],
      ['nl4', 175, 286, '7790300', 'Coca-Cola'],
      ['nl5', 295, 286, '7790700', 'Pan'],
      ['nl6', 415, 286, '7790900', 'Zanahoria']
    ];
    var right = [
      ['nr0', 1005, 70, 'Leche', '7790500'],
      ['nr1', 1125, 178, 'Arroz', '7790100'],
      ['nr2', 885, 178, 'Yerba', '7790800'],
      ['nr3', 1185, 286, 'Alfajor', '7790040'],
      ['nr4', 1065, 286, 'Coca-Cola', '7790300'],
      ['nr5', 945, 286, 'Pan', '7790700'],
      ['nr6', 825, 286, 'Zanahoria', '7790900']
    ];
    var els = [];

    els.push({ kind: 'label', id: 'la', x: 235, y: 16, text: 'ABB numérico — código de barras', tone: 'cyan' });
    els.push({ kind: 'label', id: 'lb', x: 620, y: 16, text: 'Objetos Producto — RAM', tone: 'slate' });
    els.push({ kind: 'label', id: 'lc', x: 1005, y: 16, text: 'ABB alfabético — nombre', tone: 'emerald' });

    els.push({ kind: 'card', id: 'c1', cx: 620, cy: 80, w: 150, h: 64, title: '7790500', sub: 'Leche · $1.850', dots: true });
    els.push({ kind: 'card', id: 'c2', cx: 620, cy: 164, w: 150, h: 64, title: '7790800', sub: 'Yerba · $2.400', dots: true });
    els.push({ kind: 'card', id: 'c3', cx: 620, cy: 248, w: 150, h: 64, title: '7790040', sub: 'Alfajor · $0.900', dots: true });

    [['nl0', 'nl1'], ['nl0', 'nl2'], ['nl1', 'nl3'], ['nl1', 'nl4'], ['nl2', 'nl5'], ['nl2', 'nl6']].forEach(function (pr, i) {
      els.push({ kind: 'edge', id: 'el' + i, a: pr[0], b: pr[1], tone: 'cyan' });
    });
    left.forEach(function (n) {
      els.push({ kind: 'node', id: n[0], cx: n[1], cy: n[2], w: W, h: H, code: n[3], sub: n[4], tone: 'cyan' });
    });

    [['nr0', 'nr1'], ['nr0', 'nr2'], ['nr1', 'nr3'], ['nr1', 'nr4'], ['nr2', 'nr5'], ['nr2', 'nr6']].forEach(function (pr, i) {
      els.push({ kind: 'edge', id: 'er' + i, a: pr[0], b: pr[1], tone: 'emerald' });
    });
    right.forEach(function (n) {
      els.push({ kind: 'node', id: n[0], cx: n[1], cy: n[2], w: W, h: H, code: n[3], sub: n[4], tone: 'emerald', sans: true });
    });

    els.push({ kind: 'edge', id: 'rf1', a: 'nl0', as: 'right', b: 'c1', bs: 'left', tone: 'cyan', curve: true, dash: true, marker: true, frag: true, fragMode: 'fade-right', fi: 1 });
    els.push({ kind: 'edge', id: 'rf2', a: 'nl2', as: 'right', b: 'c2', bs: 'left', tone: 'cyan', curve: true, dash: true, marker: true, frag: true, fragMode: 'fade-right', fi: 1 });
    els.push({ kind: 'edge', id: 'rf3', a: 'nl3', as: 'right', b: 'c3', bs: 'left', tone: 'cyan', curve: true, dash: true, marker: true, frag: true, fragMode: 'fade-right', fi: 1 });

    els.push({ kind: 'edge', id: 'rf4', a: 'nr0', as: 'left', b: 'c1', bs: 'right', tone: 'emerald', curve: true, dash: true, marker: true, frag: true, fragMode: 'fade-left', fi: 2 });
    els.push({ kind: 'edge', id: 'rf5', a: 'nr2', as: 'left', b: 'c2', bs: 'right', tone: 'emerald', curve: true, dash: true, marker: true, frag: true, fragMode: 'fade-left', fi: 2 });
    els.push({ kind: 'edge', id: 'rf6', a: 'nr3', as: 'left', b: 'c3', bs: 'right', tone: 'emerald', curve: true, dash: true, marker: true, frag: true, fragMode: 'fade-left', fi: 2 });

    return { id: 'arch', viewBox: '0 0 1240 400', elements: els };
  })();

  /* --- riesgo: balanceado vs degenerado (slide 6) --- */
  var balCfg = (function () {
    var P = {
      root: [180, 66], l: [98, 164], r: [262, 164],
      ll: [57, 262], lr: [139, 262], rl: [221, 262], rr: [303, 262]
    };
    var D = {
      root: '7790500', l: '7790100', r: '7790800', ll: '7790040',
      lr: '7790300', rl: '7790700', rr: '7790900'
    };
    var els = [];
    [['root', 'l'], ['root', 'r'], ['l', 'll'], ['l', 'lr'], ['r', 'rl'], ['r', 'rr']].forEach(function (pr, i) {
      els.push({ kind: 'edge', id: 'e' + i, a: pr[0], b: pr[1], tone: 'emerald' });
    });
    Object.keys(P).forEach(function (id) {
      els.push({ kind: 'node', id: id, cx: P[id][0], cy: P[id][1], w: 68, h: 38, code: D[id], tone: 'emerald' });
    });
    return { id: 'bal', viewBox: '0 0 360 330', elements: els };
  })();

  var degCfg = (function () {
    var pts = [[46, 38], [108, 102], [170, 166], [232, 230], [294, 294]];
    var els = [];
    for (var i = 0; i < pts.length - 1; i++) {
      els.push({ kind: 'edge', id: 'e' + i, a: 'n' + i, b: 'n' + (i + 1), tone: 'amber' });
    }
    for (var j = 0; j < pts.length; j++) {
      els.push({
        kind: 'node', id: 'n' + j, cx: pts[j][0], cy: pts[j][1], w: 86, h: 36,
        code: '779000' + (j + 1), tone: 'amber'
      });
    }
    return { id: 'deg', viewBox: '0 0 360 330', elements: els };
  })();

  /* ============================================================
     CATÁLOGO + MOTOR DE BÚSQUEDA ABB (slide interactivo)
     ============================================================ */

  var CATALOGO = {
    '7790500': { nombre: 'Leche',     precio: 1850, stock: 40 },
    '7790100': { nombre: 'Arroz',     precio: 1200, stock: 18 },
    '7790300': { nombre: 'Coca-Cola', precio: 1500, stock: 30 },
    '7790800': { nombre: 'Yerba',     precio: 2400, stock: 12 },
    '7790700': { nombre: 'Pan',       precio: 700,  stock: 50 },
    '7790040': { nombre: 'Alfajor',   precio: 900,  stock: 25 },
    '7790900': { nombre: 'Zanahoria', precio: 650,  stock: 22 }
  };

  /* Misma forma de árbol para las dos claves: el orden alfabético
     (Alfajor, Arroz, Coca-Cola, Leche, Pan, Yerba, Zanahoria) coincide. */
  var NODOS = [
    { id: 'root', codigo: '7790500', izq: 'l',    der: 'r'   },
    { id: 'l',    codigo: '7790100', izq: 'll',   der: 'lr'  },
    { id: 'r',    codigo: '7790800', izq: 'rl',   der: 'rr'  },
    { id: 'll',   codigo: '7790040' },
    { id: 'lr',   codigo: '7790300' },
    { id: 'rl',   codigo: '7790700' },
    { id: 'rr',   codigo: '7790900' }
  ];
  var NODO_POR_ID = {};
  NODOS.forEach(function (n) { NODO_POR_ID[n.id] = n; });

  var POS = {
    root: [235, 46], l: [120, 132], r: [350, 132],
    ll: [58, 218], lr: [182, 218], rl: [288, 218], rr: [412, 218]
  };
  var HIJOS = [
    ['root', 'l'], ['root', 'r'], ['l', 'll'],
    ['l', 'lr'], ['r', 'rl'], ['r', 'rr']
  ];
  var NW = 104, NH = 42;

  /* --- construye un árbol interactivo (numérico o alfabético) --- */
  function crearVista(mountId, modo) {
    var mount = document.getElementById(mountId);
    if (!mount) return null;

    var svg = svgEl('svg', { viewBox: '0 0 470 296', class: 'dg dg--inter', 'aria-hidden': 'true' });

    var defs = svgEl('defs');
    Object.keys(TONES).forEach(function (t) {
      var m = svgEl('marker', {
        id: 'arr-' + modo + '-' + t, viewBox: '0 0 10 10', refX: 8, refY: 5,
        markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse'
      });
      m.appendChild(svgEl('path', { d: 'M0 1.1 L8.8 5 L0 8.9 Z', fill: TONES[t], opacity: '0.9' }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);

    var gLinks = svgEl('g', { class: 'g-links' });
    var gShapes = svgEl('g', { class: 'g-shapes' });
    svg.appendChild(gLinks);
    svg.appendChild(gShapes);

    var vista = { modo: modo, svg: svg, nodos: {}, aristas: {} };

    HIJOS.forEach(function (pr) {
      var a = { cx: POS[pr[0]][0], cy: POS[pr[0]][1], w: NW, h: NH };
      var b = { cx: POS[pr[1]][0], cy: POS[pr[1]][1], w: NW, h: NH };
      var p = svgEl('path', {
        d: linkPath(anchor(a, 'bottom'), anchor(b, 'top'), false),
        class: 'dedge tone-' + (modo === 'num' ? 'cyan' : 'emerald')
      });
      gLinks.appendChild(p);
      vista.aristas[pr[0] + '>' + pr[1]] = p;
    });

    var beam = svgEl('path', { d: '', class: 'dbeam tone-amber', opacity: '0' });
    gLinks.appendChild(beam);
    vista.beam = beam;

    NODOS.forEach(function (n) {
      var cx = POS[n.id][0], cy = POS[n.id][1];
      var halo = svgEl('rect', {
        x: cx - (NW + 14) / 2, y: cy - (NH + 14) / 2,
        width: NW + 14, height: NH + 14, rx: 15,
        class: 'dhalo tone-amber', opacity: '0'
      });
      gShapes.appendChild(halo);

      var g = svgEl('g', { class: 'dnode tone-' + (modo === 'num' ? 'cyan' : 'emerald') });
      g.appendChild(svgEl('rect', {
        x: cx - NW / 2, y: cy - NH / 2, width: NW, height: NH, rx: 12, class: 'dnode-bg'
      }));
      if (modo === 'num') {
        g.appendChild(texto(cx, cy - 3, n.codigo, 'dnode-code'));
        g.appendChild(texto(cx, cy + 14, CATALOGO[n.codigo].nombre, 'dnode-sub'));
      } else {
        g.appendChild(texto(cx, cy - 3, CATALOGO[n.codigo].nombre, 'dnode-code'));
        g.appendChild(texto(cx, cy + 14, n.codigo, 'dnode-sub'));
      }
      gShapes.appendChild(g);

      vista.nodos[n.id] = { g: g, halo: halo, nodo: n };
    });

    var chip = svgEl('g', { class: 'dchip tone-slate' });
    chip.appendChild(svgEl('rect', { x: 65, y: 255, width: 340, height: 30, rx: 15, class: 'dchip-bg' }));
    var chipT = texto(235, 274, 'esperando consulta', 'dchip-t');
    chip.appendChild(chipT);
    gShapes.appendChild(chip);
    vista.chip = chip;
    vista.chipT = chipT;

    mount.appendChild(svg);
    return vista;
  }

  function claveDe(nodo, modo) {
    return modo === 'num' ? nodo.codigo : CATALOGO[nodo.codigo].nombre.toLowerCase();
  }

  /* Comparación por prefijo: "yer" alcanza a "Yerba" y "77908" a "7790800".
     Así se puede encontrar un producto sin escribir la clave completa. */
  function comparar(objetivo, clave, modo) {
    var a = modo === 'num' ? String(objetivo) : String(objetivo).toLowerCase();
    var b = modo === 'num' ? String(clave) : String(clave).toLowerCase();
    if (b.indexOf(a) === 0) return 0;
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  /* Planifica la búsqueda completa: devuelve la secuencia de comparaciones. */
  function planificarBusqueda(modo, valor) {
    var pasos = [];
    var actual = 'root';
    var objetivo = modo === 'num' ? valor : valor.toLowerCase();

    while (actual) {
      var nodo = NODO_POR_ID[actual];
      var clave = claveDe(nodo, modo);
      var cmp = comparar(objetivo, clave, modo);
      var siguiente = cmp < 0 ? nodo.izq : (cmp > 0 ? nodo.der : null);
      var prefijo = cmp === 0 && String(clave).toLowerCase() !== String(objetivo).toLowerCase();
      pasos.push({
        id: nodo.id,
        codigo: nodo.codigo,
        nombre: CATALOGO[nodo.codigo].nombre,
        clave: clave,
        objetivo: objetivo,
        cmp: cmp,
        prefijo: prefijo,
        siguiente: siguiente,
        lado: cmp === 0 ? 'hallado'
          : (siguiente ? (cmp < 0 ? 'izquierda' : 'derecha') : 'sin coincidencia')
      });
      if (cmp === 0) return { modo: modo, valor: valor, pasos: pasos, ok: true, codigo: nodo.codigo };
      actual = siguiente;
    }
    return { modo: modo, valor: valor, pasos: pasos, ok: false, codigo: null };
  }

  var vistaNum = null, vistaNom = null;
  var planActual = null, pasoActual = -1;
  var enviarLab = null;

  /* Envía el estado del laboratorio al celular (vía relay WebSocket). */
  function syncLab() {
    if (!enviarLab) return;
    var res = document.getElementById('inter-result');
    var st = document.getElementById('inter-state');
    var texto = '';
    if (res) {
      texto = Array.prototype.map.call(res.children, function (s) { return s.textContent; })
        .join(' · ').replace(/\s+/g, ' ').trim();
    }
    enviarLab({
      type: 'labInfo',
      state: st ? st.textContent : '',
      result: texto,
      ok: !!(res && res.classList.contains('is-ok')),
      bad: !!(res && res.classList.contains('is-bad'))
    });
  }

  function vistaActiva() {
    return planActual && planActual.modo === 'num' ? vistaNum : vistaNom;
  }

  function descendientes(id) {
    var out = [];
    (function rec(x) {
      if (!x) return;
      out.push(x);
      rec(NODO_POR_ID[x].izq);
      rec(NODO_POR_ID[x].der);
    })(id);
    return out;
  }

  function descartarRama(vista, id) {
    var ids = descendientes(id);
    ids.forEach(function (x) {
      if (vista.nodos[x]) vista.nodos[x].g.setAttribute('opacity', '0.2');
    });
    Object.keys(vista.aristas).forEach(function (k) {
      var par = k.split('>');
      if (ids.indexOf(par[1]) !== -1 || ids.indexOf(par[0]) !== -1) {
        vista.aristas[k].setAttribute('opacity', '0.15');
      }
    });
  }

  function limpiarVista(vista) {
    if (!vista) return;
    Object.keys(vista.nodos).forEach(function (id) {
      var n = vista.nodos[id];
      n.g.setAttribute('opacity', '1');
      n.g.classList.remove('is-current', 'is-hit', 'is-descartado');
      n.halo.setAttribute('opacity', '0');
      n.halo.setAttribute('class', 'dhalo tone-amber');
    });
    Object.keys(vista.aristas).forEach(function (k) {
      vista.aristas[k].setAttribute('opacity', '1');
    });
    vista.beam.setAttribute('opacity', '0');
    vista.beam.setAttribute('d', '');
    vista.beam.setAttribute('class', 'dbeam tone-amber');
    vista.chip.setAttribute('class', 'dchip tone-slate');
    vista.chipT.textContent = 'esperando consulta';
  }

  function setModo(modo) {
    var chip = document.getElementById('mode-chip');
    if (chip) {
      chip.className = 'head-chip mono tone-' + (modo === 'num' ? 'cyan' : 'emerald');
      chip.textContent = modo === 'num' ? 'modo: código de barras' : 'modo: nombre';
    }
    var cNum = document.getElementById('card-num');
    var cNom = document.getElementById('card-nom');
    if (cNum) {
      cNum.classList.toggle('is-active', modo === 'num');
      cNum.classList.toggle('is-idle', modo !== 'num');
    }
    if (cNom) {
      cNom.classList.toggle('is-active', modo === 'nom');
      cNom.classList.toggle('is-idle', modo !== 'nom');
    }
    var inactiva = modo === 'num' ? vistaNom : vistaNum;
    if (inactiva) {
      inactiva.chip.setAttribute('class', 'dchip tone-slate');
      inactiva.chipT.textContent = 'índice no usado en esta consulta';
    }
  }

  function registrarLog(indice, paso, total) {
    var log = document.getElementById('inter-log');
    if (!log) return;
    var li = document.createElement('li');
    var signo = paso.cmp === 0 ? (paso.prefijo ? '≈' : '=') : (paso.cmp > 0 ? '>' : '<');
    if (planActual.modo === 'num') {
      li.textContent = (indice + 1) + '/' + total + ' · nodo ' + paso.codigo + ' (' + paso.nombre + ') · '
        + paso.objetivo + ' ' + signo + ' ' + paso.clave + ' → ' + paso.lado;
    } else {
      li.textContent = (indice + 1) + '/' + total + ' · nodo ' + paso.nombre + ' · '
        + '"' + paso.objetivo + '" ' + signo + ' "' + paso.clave + '" → ' + paso.lado;
    }
    if (paso.cmp === 0) li.classList.add('is-hit');
    else li.classList.add('is-descartado');
    log.appendChild(li);
    log.scrollTop = log.scrollHeight;
  }

  function pintarPaso(indice, opts) {
    opts = opts || {};
    if (!planActual) return;
    var paso = planActual.pasos[indice];
    var vista = vistaActiva();
    if (!vista || !vista.nodos[paso.id]) return;

    var total = planActual.pasos.length;
    var n = vista.nodos[paso.id];
    var signo = paso.cmp === 0 ? (paso.prefijo ? '≈' : '=') : (paso.cmp > 0 ? '>' : '<');

    n.g.classList.add('is-current');
    n.halo.setAttribute('opacity', '1');

    if (paso.cmp === 0) {
      n.halo.setAttribute('class', 'dhalo tone-emerald');
      n.g.classList.add('is-hit');
      vista.chip.setAttribute('class', 'dchip tone-emerald');
    } else {
      /* Nodo verificado y descartado: se marca en ámbar, nunca en rojo.
         El rojo reservado al resultado final evita confundir el camino. */
      n.halo.setAttribute('class', 'dhalo tone-amber');
      n.g.classList.add('is-descartado');
      vista.chip.setAttribute('class', 'dchip tone-amber');
    }

    var chipTxt = planActual.modo === 'num'
      ? paso.objetivo + ' ' + signo + ' ' + paso.clave + ' → ' + paso.lado
      : '"' + paso.objetivo + '" ' + signo + ' "' + paso.clave + '" → ' + paso.lado;
    vista.chipT.textContent = chipTxt;

    if (paso.siguiente) {
      var a = { cx: POS[paso.id][0], cy: POS[paso.id][1], w: NW, h: NH };
      var b = { cx: POS[paso.siguiente][0], cy: POS[paso.siguiente][1], w: NW, h: NH };
      vista.beam.setAttribute('d', linkPath(anchor(a, 'bottom'), anchor(b, 'top'), false));
      vista.beam.setAttribute('opacity', '1');
      vista.beam.setAttribute('class', 'dbeam ' + (paso.cmp === 0 ? 'tone-emerald' : 'tone-amber'));

      var descartado = paso.cmp < 0 ? NODO_POR_ID[paso.id].der : NODO_POR_ID[paso.id].izq;
      if (descartado) descartarRama(vista, descartado);
    } else {
      vista.beam.setAttribute('opacity', '0');
    }

    registrarLog(indice, paso, total);

    if (indice === total - 1 && !opts.enVivo) {
      finalizar(planActual.ok, planActual.codigo, total);
    }
  }

  function setEstado(texto) {
    var el = document.getElementById('inter-state');
    if (el) el.textContent = 'Pasos · ' + texto;
  }

  /* Cuenta solo dígitos y letras: espacios o guiones no suman. */
  function caracteresValidos(valor) {
    return (String(valor).match(/[0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length;
  }

  function mensajeCorto(cant) {
    return 'Mínimo 3 dígitos o letras (tenés ' + cant + ').';
  }

  /* Prepara una consulta y muestra SOLO el primer paso. Los demás se
     revelan de a uno con «paso →» (también desde el celular). */
  function prepararBusqueda(valor) {
    var cant = caracteresValidos(valor);
    if (cant < 3) { marcarError(mensajeCorto(cant)); return; }
    var campo = document.getElementById('inter-q');
    if (campo) campo.classList.remove('is-error');
    resetVisuales();

    var modo = /^\d+$/.test(valor) ? 'num' : 'nom';
    planActual = planificarBusqueda(modo, valor);
    setModo(modo);
    pasoActual = 0;
    pintarPaso(0);

    if (planActual.pasos.length > 1) {
      setEstado('pausado · paso 1 de ' + planActual.pasos.length);
      var res = document.getElementById('inter-result');
      if (res) {
        res.className = 'sim-result is-live';
        res.innerHTML =
          '<span class="sim-rlabel mono">⏸ pausado</span>' +
          '<span class="sim-rtext">' + valor + ' · paso 1 de ' + planActual.pasos.length + '</span>' +
          '<span class="sim-rsub mono">Tocá «paso →» para avanzar una comparación</span>';
      }
    }
    syncLab();
  }

  function finalizar(ok, codigo, pasos) {
    var res = document.getElementById('inter-result');
    if (!res) return;
    res.classList.remove('is-idle', 'is-ok', 'is-bad');
    var idxNombre = planActual.modo === 'num' ? 'ABB numérico' : 'ABB alfabético';
    var ultimo = planActual.pasos[planActual.pasos.length - 1];

    if (ok && codigo) {
      var p = CATALOGO[codigo];
      res.classList.add('is-ok');
      res.innerHTML =
        '<span class="sim-rlabel mono">✓ hallado' + (ultimo.prefijo ? ' · por prefijo' : '') + '</span>' +
        '<span class="sim-rtext emerald">' + p.nombre + ' · $' + p.precio.toLocaleString('es-AR') + '</span>' +
        '<span class="sim-rsub mono">' + codigo + ' · ' + p.stock + ' u · ' + pasos + ' pasos · ' + idxNombre + '</span>';
    } else {
      res.classList.add('is-bad');
      res.innerHTML =
        '<span class="sim-rlabel mono">✕ no está en el catálogo</span>' +
        '<span class="sim-rtext">No se encontró «' + planActual.valor + '»</span>' +
        '<span class="sim-rsub mono">' + pasos + ' comparaciones · ' + idxNombre + '</span>';
    }
    syncLab();
  }

  /* Avance manual: cada toque de "paso →" muestra una comparación. */
  function avanzar() {
    if (!planActual || pasoActual >= planActual.pasos.length - 1) return;
    pasoActual += 1;
    pintarPaso(pasoActual);
    setEstado('paso ' + (pasoActual + 1) + ' de ' + planActual.pasos.length);
    syncLab();
  }

  /* Retroceder: limpia el recorrido y vuelve a dibujar hasta el paso anterior. */
  function retroceder() {
    if (!planActual || pasoActual <= 0) return;
    pasoActual -= 1;
    limpiarVista(vistaNum);
    limpiarVista(vistaNom);
    var log = document.getElementById('inter-log');
    if (log) log.innerHTML = '';
    for (var i = 0; i <= pasoActual; i++) pintarPaso(i, { enVivo: true });
    var res = document.getElementById('inter-result');
    if (res) {
      res.className = 'sim-result is-live';
      res.innerHTML =
        '<span class="sim-rlabel mono">↩ atrás</span>' +
        '<span class="sim-rtext">' + planActual.valor + ' · paso ' + (pasoActual + 1) + ' de ' + planActual.pasos.length + '</span>' +
        '<span class="sim-rsub mono">Tocá «Paso →» para volver a avanzar</span>';
    }
    setEstado('paso ' + (pasoActual + 1) + ' de ' + planActual.pasos.length);
    syncLab();
  }

  function marcarError(mensaje) {
    var campo = document.getElementById('inter-q');
    if (campo) {
      campo.classList.add('is-error', 'shake');
      setTimeout(function () { campo.classList.remove('shake'); }, 420);
      campo.focus();
    }
    var res = document.getElementById('inter-result');
    if (res) {
      res.className = 'sim-result is-bad';
      res.innerHTML =
        '<span class="sim-rlabel mono">✕ entrada inválida</span>' +
        '<span class="sim-rtext">' + mensaje + '</span>' +
        '<span class="sim-rsub">Probá con un código o un nombre del catálogo</span>';
    }
    syncLab();
  }

  function resetVisuales() {
    limpiarVista(vistaNum);
    limpiarVista(vistaNom);
    var log = document.getElementById('inter-log');
    if (log) log.innerHTML = '';
    var res = document.getElementById('inter-result');
    if (res) {
      res.className = 'sim-result is-idle';
      res.innerHTML =
        '<span class="sim-rlabel">idle</span>' +
        '<span class="sim-rtext">Esperando entrada…</span>';
    }
    var campo = document.getElementById('inter-q');
    if (campo) campo.classList.remove('is-error');
    planActual = null;
    pasoActual = -1;
    setEstado('pausado');
    syncLab();
  }

  /* Buscar / Enter: queda PAUSADO en el primer paso para explicar. */
  function handleBuscar(e) {
    if (e) e.preventDefault();
    var campo = document.getElementById('inter-q');
    if (!campo) return;
    var valor = campo.value.trim();
    if (!valor) { marcarError('Escribí al menos 3 dígitos o letras.'); return; }
    prepararBusqueda(valor);
  }

  var inputTimer = null;

  /* Cada tecla recalcula la ruta y muestra solo el primer paso. Nunca avanza
     solo: cada comparación requiere tocar «paso →». */
  function handleInput() {
    if (inputTimer) clearTimeout(inputTimer);
    inputTimer = setTimeout(function () {
      inputTimer = null;
      var campo = document.getElementById('inter-q');
      if (!campo) return;
      var valor = campo.value.trim();

      var cant = caracteresValidos(valor);
      if (cant < 3) {
        resetVisuales();
        var chip = document.getElementById('mode-chip');
        if (chip) { chip.className = 'head-chip'; chip.textContent = 'modo: automático'; }
        var cN = document.getElementById('card-num');
        var cM = document.getElementById('card-nom');
        if (cN) cN.classList.remove('is-active', 'is-idle');
        if (cM) cM.classList.remove('is-active', 'is-idle');
        if (vistaNum) vistaNum.chipT.textContent = 'esperando consulta';
        if (vistaNom) vistaNom.chipT.textContent = 'esperando consulta';
        var res = document.getElementById('inter-result');
        if (res) {
          res.className = 'sim-result is-live';
          res.innerHTML =
            '<span class="sim-rlabel mono">⏳ esperando</span>' +
            '<span class="sim-rtext">Mínimo 3 dígitos o letras</span>' +
            '<span class="sim-rsub mono">' + cant + ' de 3 · seguí escribiendo</span>';
        }
        syncLab();
        return;
      }

      prepararBusqueda(valor);
    }, 180);
  }

  function initInteractive() {
    vistaNum = crearVista('d-arbol-num', 'num');
    vistaNom = crearVista('d-arbol-nom', 'nom');
    if (!vistaNum || !vistaNom) return;

    var form = document.getElementById('inter-form');
    if (form) form.addEventListener('submit', handleBuscar);

    var campo = document.getElementById('inter-q');
    if (campo) campo.addEventListener('input', handleInput);

    var next = document.getElementById('inter-next');
    if (next) next.addEventListener('click', avanzar);

    var reset = document.getElementById('inter-reset');
    if (reset) reset.addEventListener('click', function () {
      resetVisuales();
      var chip = document.getElementById('mode-chip');
      if (chip) {
        chip.className = 'head-chip';
        chip.textContent = 'modo: automático';
      }
      [document.getElementById('card-num'), document.getElementById('card-nom')].forEach(function (c) {
        if (c) c.classList.remove('is-active', 'is-idle');
      });
      vistaNum.chipT.textContent = 'esperando consulta';
      vistaNom.chipT.textContent = 'esperando consulta';
    });

  }

  /* ---------- render de diagramas estáticos ---------- */
  buildDiagram(document.getElementById('d-mini-abb'), miniCfg);
  buildDiagram(document.getElementById('d-arch'), archCfg);
  buildDiagram(document.getElementById('d-bal'), balCfg);
  buildDiagram(document.getElementById('d-deg'), degCfg);

  /* ---------- init Reveal ---------- */
  Reveal.initialize({
    hash: true,
    controls: true,
    progress: true,
    center: true,
    slideNumber: 'c/t',
    transition: 'fade',
    transitionSpeed: 'default',
    backgroundTransition: 'fade',
    width: 1280,
    height: 720,
    margin: 0,
    minScale: 0.2,
    maxScale: 2.5,
    autoAnimateDuration: 0.9,
    autoAnimateEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    plugins: [RevealHighlight]
  });

  initInteractive();
  initRemote();

  /* ============================================================
     CONTROL REMOTO (Reveal Remote)
     El servidor Node.js hace de relay: esta presentación se registra
     como "display", el celular como "controller". Los comandos se
     reenvían a Reveal y el estado de la slide vuelve al celular.
     Si se abre index.html directo (sin servidor), no hace nada.
     ============================================================ */
  function initRemote() {
    if (typeof WebSocket === 'undefined') return;
    var ws = null;
    var reintentos = 0;

    function enviar(payload) {
      if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload));
    }
    enviarLab = enviar;
    window.enviarCodigoInfo = function (page, total, label) {
      enviar({ type: 'codeInfo', page: page, total: total, label: String(label || '') });
    };

    function syncState() {
      var indices = Reveal.getIndices();
      var slide = Reveal.getCurrentSlide();
      var frag = slide ? slide.querySelectorAll('.fragment').length : 0;
      enviar({
        type: 'slideInfo',
        index: indices.h + 1,
        total: Reveal.getTotalSlides(),
        fragment: indices.f >= 0 ? indices.f + 1 : 0,
        totalFragments: frag,
        lab: indices.h === 3,
        code: indices.h === 4
      });
    }

    function conectar() {
      var proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
      try { ws = new WebSocket(proto + location.host); }
      catch (_) { return; }

      ws.onopen = function () {
        reintentos = 0;
        enviar({ type: 'display' });
        syncState();
      };

      ws.onmessage = function (e) {
        var msg;
        try { msg = JSON.parse(e.data); } catch (_) { return; }
        if (msg.type === 'controller-connected') {
          if (window.QRModal) window.QRModal.hide();
          syncState();
          return;
        }
        /* Consulta enviada desde el celular: se escribe en el input de la
           slide 4, se va a esa slide y queda pausada en el paso 1. */
        if (msg.type === 'query') {
          var campo = document.getElementById('inter-q');
          if (campo) {
            campo.value = String(msg.value || '');
            Reveal.slide(3);
            handleBuscar();
          }
          return;
        }
        /* Escritura en vivo desde el celular: se replica en el input y se
           recalcula la ruta igual que si se escribiera en la compu. */
        if (msg.type === 'input') {
          var campo = document.getElementById('inter-q');
          if (campo) {
            campo.value = String(msg.value || '');
            handleInput();
          }
          return;
        }
        var acciones = {
          right: function () { Reveal.right(); },
          left: function () { Reveal.left(); },
          up: function () { Reveal.up(); },
          down: function () { Reveal.down(); },
          step: function () {
            if (Reveal.getIndices().h === 3) avanzar();
            syncLab();
          },
          stepBack: function () {
            if (Reveal.getIndices().h === 3) retroceder();
            syncLab();
          },
          codePrev: function () {
            if (Reveal.getIndices().h === 4) {
              var b = document.getElementById('codePrev');
              if (b && !b.disabled) b.click();
            }
          },
          codeNext: function () {
            if (Reveal.getIndices().h === 4) {
              var b = document.getElementById('codeNext');
              if (b && !b.disabled) b.click();
            }
          },
          clear: function () {
            if (Reveal.getIndices().h === 3) {
              resetVisuales();
              var chip = document.getElementById('mode-chip');
              if (chip) { chip.className = 'head-chip'; chip.textContent = 'modo: automático'; }
            }
          }
        };
        if (msg.action && acciones[msg.action]) acciones[msg.action]();
      };

      ws.onclose = function () {
        var espera = Math.min(15000, 2000 * Math.pow(2, reintentos++));
        setTimeout(conectar, espera);
      };
    }

    ['ready', 'slidechanged', 'fragmentshown', 'fragmenthidden'].forEach(function (evt) {
      Reveal.addEventListener(evt, syncState);
    });
    conectar();
  }
})();
