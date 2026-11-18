# ABB × POS — Optimización de búsquedas en sistemas de punto de venta

Presentación web (Reveal.js vía CDN) sobre la arquitectura de **doble índice con Árboles
Binarios de Búsqueda en memoria** para resolver búsquedas ultrarrápidas en caja.

## Cómo usarla

Abrir `index.html` con doble clic (no requiere servidor ni instalación:
las librerías y fuentes se cargan desde CDN; se necesita conexión a internet).

## Navegación

| Acción | Control |
|---|---|
| Avanzar / retroceder | `→` `←` o la barra espaciadora |
| Ir a una diapositiva | las flechas de la esquina inferior derecha |
| Vista general de todas | `Esc` |
| Enlace directo a una slide | la URL con `#/n` (p. ej. `#/6`) |

Presentación en 6 diapositivas: portada · el problema · arquitectura de doble ABB ·
**laboratorio interactivo** · implementación en Java en un visor paginado (4 partes: modelo y búsquedas) ·
desbalanceo y cierre.

## Control remoto (Reveal Remote)

La presentación se puede manejar desde el celular con el mismo protocolo de
[PierSoco/Reveal-Remote](https://github.com/PierSoco/Reveal-Remote): WebSocket,
D-Pad táctil, swipes y sincronización del estado de slide/fragmentos.

```bat
cd servidor-remoto
iniciar.bat
```

Luego abrir `http://localhost:3000` en la PC y `http://<IP_DE_LA_PC>:3000/remote`
en el celular. Para no escribir la IP, pasar el mouse por el **borde superior** de
la presentación: se abre el modal QR del repo original (no hay botones flotantes).
El servidor elige la IP de la **Wi‑Fi** (no `localhost` ni Tailscale) y genera
el QR con `http://10.10.x.x:3000/remote`. Si no detecta Wi‑Fi, usa otra IP
privada. El modal se cierra solo cuando el celular se vincula.

El servidor hace de relay en un solo puerto; la presentación se registra como
`display` y el celular como `controller`. Si se abre `index.html` sin servidor,
el control remoto simplemente no se activa y la presentación funciona igual con
el teclado.

El remoto tiene, debajo del D-Pad, un **input de consulta** y los botones
`← Paso`, `Paso →`, `Buscar` y `Limpiar`. El panel **solo aparece en la
diapositiva 4**: al pasar a cualquier otra slide se repliega suavemente hacia
abajo y el D-Pad hace un barrido (crece y vuelve a su tamaño original).

- **Escribir** en el celular replica el texto en la compu en vivo (debounce de
  180 ms), recalcula la ruta y muestra solo el paso 1; no hace falta tocar
  `Buscar` ni se avanzan pasos por escribir.
- Se requieren **al menos 3 dígitos o letras** (espacios y guiones no cuentan).
  Con menos, el campo muestra `Mínimo 3 dígitos o letras` y no se inicia la
  búsqueda; el error se ve en la compu y en el celular.
- `Buscar` envía el texto al input de la diapositiva 4, salta a esa slide y la
  deja pausada en el paso 1.
- `Paso →` avanza una comparación por toque (equivale al `paso →` de la slide).
- `← Paso` retrocede una comparación redibujando la traza anterior.
- `Limpiar` vacía el campo en ambos dispositivos y reinicia la traza.
- El feedback del celular se actualiza con el resultado de la búsqueda.

En la **diapositiva 5** el panel de consulta se reemplaza por otro con
`← Anterior` y `Siguiente →`: mueve las 4 partes del visor de código Java y
muestra el número de parte que hay en la compu. Los botones del D-Pad solo
cambian de tamaño al tocarlos; mantienen el mismo color que en reposo.

### Laboratorio interactivo (diapositiva 4)

Se llega con las flechas de navegación, sin botones intermedios. Es una slide con
identidad propia pero deliberadamente **simple**: una superficie lisa `#0E1523`,
sin rejillas, marcas de registro ni cartelas; solo el input, los dos árboles y el
panel de resultado.

| Resto de la presentación | Laboratorio |
|---|---|
| Tarjetas glass con glow | Panel plano `#0E1523` con borde tenue y esquinas redondeadas |
| Acentos cyan / esmeralda | Misma paleta: cyan = código, esmeralda = nombre |
| Varios niveles de detalle | Una sola fila de controles y tres bloques: controles, traza y salida |

La slide 3 («Un catálogo, dos índices, cero duplicación») explica el concepto con
sus tres leyendas por fragments; la slide 4 permite probarlo. En ambas el input
está arriba y los dos árboles abajo, siempre visibles.

La entrada es `fade` lento (`data-transition-speed="slow"`) con una aparición suave
del panel. Dentro, los estados del árbol, el log y la salida cambian con transiciones
continuas. No hay reproducción automática: cada comparación se muestra al **tocar
el botón `paso →`**. Todo se desactiva con `prefers-reduced-motion`.

Se detecta automáticamente el modo: si se escriben solo dígitos se usa el ABB
numérico (clave: código de barras, resaltado en cyan); en caso contrario se usa
el ABB alfabético (clave: nombre, resaltado en esmeralda). El otro índice queda
atenuado pero sigue en pantalla.

La coincidencia es **por prefijo**, no exacta: `yer` encuentra a **Yerba** y
`77908` al código **7790800**, sin necesidad de escribir la clave completa. El
resultado indica `✓ hallado · por prefijo`.

Los nodos que se van verificando y descartando se marcan en **ámbar** (`›`),
nunca en rojo: el rojo queda reservado al resultado final cuando no hay
coincidencia. Así el camino no se confunde con un error.

- **Al escribir** (en la compu o en el celular), cada tecla recalcula la ruta
  (debounce de 180 ms) y actualiza **solo el paso 1**; nunca avanza solo.
- Hasta llegar a **3 dígitos o letras** no se busca: el panel indica cuántos
  caracteres válidos llevás (`1 de 3`, `2 de 3`).
- `Buscar ↵` (o `Enter`) deja la búsqueda **pausada en el paso 1** para explicarla.
- `paso →` avanza de a una comparación por toque; `clear` limpia. Lo mismo se
  puede hacer desde el celular con los botones `Paso →`, `← Paso` y `Limpiar`.
  Cada comparación requiere tocar el botón: no hay avance automático.
- Si el valor no está en el catálogo, el resultado se muestra en rojo
  (`✕ no está en el catálogo`) con halo rojo en el último nodo comparado.

## Archivos

- `index.html` — contenido y estructura de las 6 diapositivas.
- `../ayed3/02-ejemplosJava/13-Arboles/ArbolBinarioBusquedaCatalogo.java` —
  la misma lógica de búsqueda implementada en Java, siguiendo el estilo del profesor
  (`static class Nodo`, ayudantes recursivos, Javadoc con Contrato/Precondiciones/
  Postcondiciones). Dos índices sobre los mismos objetos `Producto`, búsqueda por
  código y por nombre con traza de comparaciones y caso «no está en el catálogo».
- `styles.css` — tema "Modern Tech / Dark SaaS" (fondo `#0B0F19`, tarjetas glass,
  acentos cyan `#38BDF8` / esmeralda `#10B981`, Plus Jakarta Sans + JetBrains Mono) y
  estilos de los diagramas SVG y del bloque de código. La slide 4 usa un panel simple
  `#0E1523` sobre la misma paleta cyan / esmeralda del resto. Conserva todas las
  animaciones (`rise`, `scan`, `floaty`, `linpulse`, `beamflow`,
  `caretblink`, `lab-pulse`, `simshake`) y los estados SVG del simulador.
- `app.js` — genera por código todos los diagramas SVG (árboles, tarjetas de objetos en
  RAM, halos de búsqueda, conectores), inicializa Reveal.js (1280 × 720) y conecta
  la presentación como `display` del control remoto.
- `servidor-remoto/` — relay WebSocket + QR del control remoto (`servidor.js`,
  `public/remote.html`, `iniciar.bat`). Basado en
  [PierSoco/Reveal-Remote](https://github.com/PierSoco/Reveal-Remote).