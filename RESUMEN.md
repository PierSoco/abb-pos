# ABB × POS — resumen rápido

**Qué es:** presentación de 6 slides sobre dos ABB en memoria que apuntan a los
mismos productos: uno indexado por código de barras y otro por nombre.

**Repo:** https://github.com/PierSoco/abb-pos

---

## Arrancar

```bat
cd servidor-remoto
iniciar.bat
```

- PC → `http://localhost:3000`
- Celular → `http://<IP_DE_LA_PC>:3000/remote`
- QR → pasar el mouse por el **borde superior** de la presentación. Usa la IP de
  Wi‑Fi (`10.10.x.x`), nunca `localhost`.

Sin servidor: abrir `index.html` directamente (el remoto no conecta, la
presentación sí funciona).

---

## Las 6 slides

1. Portada
2. Problema
3. Doble índice, cero duplicación
4. **Laboratorio interactivo**
5. Código Java paginado (4 partes)
6. Balanceo y cierre

---

## Laboratorio (slide 4)

| Acción | Resultado |
|---|---|
| Escribir código o nombre | Actualiza en vivo, deja el paso 1 pausado |
| Mínimo 3 dígitos/letras | Con menos no busca y lo indica |
| `Buscar ↵` | Pausa en el paso 1 |
| `paso →` / `Paso →` | Avanza una comparación |
| `← Paso` | Retrocede una comparación |
| `clear` / `Limpiar` | Reinicia |

- Dígitos → ABB numérico (cyan). Letras → ABB alfabético (esmeralda).
- Coincidencia por prefijo: `yer` → Yerba, `77908` → 7790800.
- Nodos descartados en ámbar (`›`); rojo solo para `✕ no está en el catálogo`.
- Sin autoplay. Respeta `prefers-reduced-motion`.

---

## Celular

- Slide 4: input + `Buscar`, `Paso →`, `← Paso`, `Limpiar`.
- Slide 5: `Siguiente →`, `← Anterior` + contador `1 / 4` del código Java.
- D-Pad, swipes, vibración, long-press y reconexión automática.
- Los botones del D-Pad cambian de tamaño al tocar, pero no de color.

---

## Código Java

`ArbolBinarioBusquedaCatalogo.java` se muestra en 4 partes:

1. `Producto`
2. `Nodo` y `Traza`
3. `buscarPorCodigo`
4. `buscarPorNombre`

Sin comentarios, con resaltado de sintaxis. El archivo original está en el
material de AyED3, fuera de este repo.

---

## Archivos clave

- `index.html` — slides + laboratorio + QR.
- `app.js` — motor de búsqueda y cliente WebSocket.
- `styles.css` — tema, SVG y animaciones.
- `servidor-remoto/` — relay, remoto y QR.

Basado en [PierSoco/Reveal-Remote](https://github.com/PierSoco/Reveal-Remote).
