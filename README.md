# ABB × POS — búsquedas ultrarrápidas con doble índice

Presentación de 6 diapositivas hecha con **Reveal.js** sobre una arquitectura de
**doble índice en memoria**: dos Árboles Binarios de Búsqueda apuntando a los
mismos objetos `Producto`, uno por código de barras y otro por nombre.

Incluye un **laboratorio interactivo** para recorrer las comparaciones paso a
paso y un **control remoto por celular** compatible con
[PierSoco/Reveal-Remote](https://github.com/PierSoco/Reveal-Remote).

Repo público: **https://github.com/PierSoco/abb-pos**

---

## Inicio rápido

### Solo la presentación

Abrir `index.html` con doble clic. No requiere instalación: Reveal.js, el
resaltador de sintaxis y las fuentes se cargan desde CDN (necesita internet).

### Con control remoto

```bat
cd servidor-remoto
iniciar.bat
```

En Linux/macOS:

```bash
cd servidor-remoto
npm install
node servidor.js
```

Luego abrir:

- PC: `http://localhost:3000`
- Celular: `http://<IP_DE_LA_PC>:3000/remote`

El QR se abre **pasando el mouse por el borde superior** de la presentación.
El servidor elige la IP de la **Wi-Fi** (por ejemplo `10.10.x.x`), nunca
`localhost` ni Tailscale, y genera el QR con esa dirección. No hay botones
flotantes.

---

## Navegación

| Acción | Control |
|---|---|
| Avanzar / retroceder | `→` `←` o barra espaciadora |
| Ir a una diapositiva | flechas de la esquina inferior derecha |
| Vista general | `Esc` |
| Enlace directo | `#/n` en la URL (p. ej. `#/4`) |

Las 6 diapositivas son:

1. Portada.
2. El problema: búsquedas lentas en caja.
3. Un catálogo, dos índices, cero duplicación.
4. **Laboratorio interactivo** (búsqueda manual en ambos ABB).
5. Código del simulador, en un visor paginado de 4 partes.
6. Riesgo y cierre: la importancia de mantener el árbol balanceado.

---

## Laboratorio interactivo (slide 4)

Se ingresa con las flechas, sin botones intermedios. El panel es deliberadamente
simple: fondo plano `#0E1523`, sin rejillas ni cartelas; arriba el input y abajo
los dos árboles, siempre visibles. La entrada es `fade` lento.

### Reglas de búsqueda

- Si se escriben **solo dígitos** se usa el ABB numérico (cyan); si no, el ABB
  alfabético (esmeralda). El otro índice queda atenuado pero visible.
- Se necesitan **al menos 3 dígitos o letras** (espacios y guiones no cuentan).
  Con menos se muestra `Mínimo 3 dígitos o letras` y no se busca.
- La coincidencia es **por prefijo**: `yer` encuentra a **Yerba** y `77908` al
  código **7790800**. El resultado indica `✓ hallado · por prefijo`.
- **No hay autoplay**. `Buscar ↵` o escribir dejan la búsqueda pausada en el
  paso 1. Cada comparación requiere tocar `paso →`.
- Los nodos verificados y descartados se marcan en **ámbar** (`›`). El rojo se
  reserva al resultado final `✕ no está en el catálogo`, sin marcar el último
  nodo comparado.
- `clear` reinicia el recorrido. Todo respeta `prefers-reduced-motion`.

### Catálogo de ejemplo

| Código | Producto |
|---|---|
| `7790040` | Alfajor |
| `7790100` | Arroz |
| `7790300` | Coca-Cola |
| `7790500` | Leche |
| `7790700` | Pan |
| `7790800` | Yerba |
| `7790900` | Zanahoria |

---

## Control remoto

Un solo servidor Express + WebSocket hace de relay en el puerto `3000`. La
presentación se registra como `display` y el celular como `controller`.
Si se abre `index.html` sin servidor, la presentación funciona igual con teclado.

El remoto conserva el estilo original del repo: OLED negro, azul `#3b82f6`,
D-Pad SVG, gesture trail, vibración, long-press, swipes, telemetría y
reconexión automática.

| Slide | Panel en el celular | Botones |
|---|---|---|
| 4 — Laboratorio | Consulta | `Buscar`, `Paso →`, `← Paso`, `Limpiar`, más input en vivo |
| 5 — Código Java | Visor de código | `Siguiente →`, `← Anterior`, con indicador `1 / 4` |

En cualquier otra slide ambos paneles se repliegan y el D-Pad vuelve a su tamaño
original. Los botones del D-Pad solo cambian de tamaño al tocarlos: mantienen el
mismo color que en reposo.

- La escritura en el celular se replica en la PC con debounce de 180 ms y nunca
  avanza pasos por sí sola.
- `Buscar` salta a la slide 4 y deja la búsqueda pausada en el paso 1.
- `Paso →` y `← Paso` avanzan o retroceden una comparación por toque.
- Los botones de código mueven las 4 partes del visor Java y muestran la misma
  parte que la PC.

---

## Código del simulador

La slide 5 muestra el código real que mueve el laboratorio (`app.js`), en un
único viewport partido en 4 partes navegables:

1. `Datos del simulador`: `CATALOGO` y la forma compartida de los dos ABB en `NODOS`.
2. `Clave y prefijo`: `claveDe(nodo, modo)` elige la clave y `comparar` detecta prefijos.
3. `Plan de búsqueda`: `planificarBusqueda` devuelve un array `pasos` con cada comparación.
4. `Paso a paso`: `prepararBusqueda` pausa en el paso 1 y `avanzar` muestra una comparación por toque.

No hay una «traza» opaca: `pasos` es la lista que recorre el botón «paso →».
El código está sin comentarios y con resaltado de sintaxis. La implementación
Java equivalente del material de la cátedra queda como referencia externa en
`../ayed3/02-ejemplosJava/13-Arboles/ArbolBinarioBusquedaCatalogo.java`
(fuera de este repo).

---

## Estructura del repo

| Archivo | Contenido |
|---|---|
| `index.html` | Las 6 diapositivas, el laboratorio y el modal QR. |
| `styles.css` | Tema oscuro, layout, SVG y animaciones. |
| `app.js` | Motor de búsqueda, generación de diagramas, Reveal y clienteWebSocket. |
| `servidor-remoto/servidor.js` | Relay WebSocket + APIs `/api/qr`, `/api/qr-url` y `/api/connect-info`. |
| `servidor-remoto/public/remote.html` | Interfaz móvil del control remoto. |
| `servidor-remoto/iniciar.bat` | Arranque rápido en Windows. |
| `RESUMEN.md` | Cheat sheet de una página con lo esencial. |

## Detalles técnicos

- Reveal.js 5.1.0, `1280 × 720`, transición `fade`, `slideNumber: 'c/t'`.
- Paleta: fondo `#0B0F19`, cyan `#38BDF8` = código, esmeralda `#10B981` = nombre.
- Tipografías: Plus Jakarta Sans + JetBrains Mono.
- Animaciones: `rise`, `scan`, `floaty`, `linpulse`, `beamflow`, `labBoot`,
  `labRow`, `logIn`, `resultIn`, `simshake`, `lab-pulse` y fragments.
- `node_modules/` no se versiona; instalar con `npm install` dentro de
  `servidor-remoto/`.

## Créditos

Basado en [PierSoco/Reveal-Remote](https://github.com/PierSoco/Reveal-Remote)
para el protocolo, el D-Pad y el modal QR. Uso académico para AyED3.
