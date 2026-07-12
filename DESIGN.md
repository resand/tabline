# Design

## Theme

Oscuro, siempre. La UI es cristal translúcido que flota sobre un wallpaper
fotográfico o un gradiente; un tema claro destruiría esa relación. Refuerza el
modo "atenuar de noche". Acabado objetivo: glass premium, sobrio, con
profundidad construida por capas (no decorativa).

## Color

### Estrategia
Restrained. Neutrales tintados hacia el color de acento activo más un único
acento reservado para acción primaria, selección y estado.

### Accent (un solo color, retintable)
Toda la UI deriva de la variable `--accent` (HSL triple, p.ej. `215 8% 48%`).
El usuario elige entre seis paletas curadas desde Configuración:

| Slug      | HSL              | Carácter                                         |
|-----------|------------------|--------------------------------------------------|
| `space`   | `215 8% 48%`     | Gris titanio (default) — graphite metálico frío  |
| `lavender`| `266 61% 86%`    | Violeta tonal — el accent original MD3           |
| `sand`    | `30 65% 78%`     | Arena cálida — para wallpapers de desierto       |
| `ocean`   | `200 75% 70%`    | Azul agua — para fondos azules                   |
| `forest`  | `145 50% 70%`    | Verde bosque — para naturaleza                   |
| `mono`    | `0 0% 90%`       | Blanco/gris puro — neutral fotográfico           |

Reglas para una nueva paleta: lightness en `[65-90]` para que el accent siga
siendo legible sobre superficies oscuras; saturación libre.

### Tokens derivados
- `--md-sys-color-primary: hsl(var(--accent))`
- `--md-sys-color-primary-container: hsl(from hsl(var(--accent)) h s calc(l - 50))`
  → versión muy oscura del accent para fondos sobre superficies claras (toast,
  filled buttons sobre snackbars).
- `--md-sys-color-on-primary-container: hsl(from hsl(var(--accent)) h s calc(l + 5))`
  → versión muy clara para texto sobre primary-container.

Todo lo demás (halos, hovers, focus rings, bordes glass, dots de paginación,
pills, About logo glow, fondo radial) usa `hsla(var(--accent), X)`.

### Superficies (de atrás hacia delante)
- surface-0  `oklch(0.17 0.012 300)`  fondo base / scrim
- surface-1  `oklch(0.21 0.014 300)`  capa flotante (tarjetas, barra de búsqueda)
- surface-2  `oklch(0.25 0.016 300)`  capa elevada (panel de configuración, diálogos)
- surface-3  `oklch(0.30 0.018 300)`  hover / controles

### Texto
- text        `oklch(0.94 0.008 300)`
- text-muted  `oklch(0.73 0.014 300)`
- text-faint  `oklch(0.56 0.014 300)`

### Semánticos
- error  `oklch(0.72 0.15 25)`
- éxito  `oklch(0.78 0.12 155)`

## Typography

Una sola familia para toda la UI: Roboto Flex (variable, con optical sizing).
El reloj usa Roboto Flex en peso ligero con `font-variant-numeric: tabular-nums`.
Escala (ratio ~1.2): 11 · 13 · 14 · 16 · 20 · 24 · 32 px, y el reloj aparte.
Pesos: 300 display, 400 cuerpo, 500 etiquetas y botones, 600 énfasis.

Tamaños responsivos clave usan `clamp()` para que el reloj, los iconos y la
densidad del grid se ajusten a alturas de viewport pequeñas sin romper el
layout (evita el scroll vertical interno).

## Elevation & Depth

Glass por capas; cada nivel tiene su propio desenfoque, sombra y borde de luz:
- **Nivel 1** (tarjetas, barra de búsqueda): blur ~14 px, sombra suave,
  hairline superior de 1 px que simula luz cenital.
- **Nivel 2** (panel de configuración, diálogos, context menu): blur ~28 px
  con saturación, sombra amplia y difusa.

Bordes: hairline de 1 px con tinte de acento muy bajo. Sin bordes de color
gruesos ni franjas laterales.

## Motion

Curva única ease-out: `cubic-bezier(0.22, 1, 0.36, 1)`.
Duraciones:
- `--dur-1` 120 ms → hover/press
- `--dur-2` 200 ms → cambios de estado, transiciones de color
- `--dur-3` 320 ms → entrada/salida de diálogos y paneles, page flip

Excepciones específicas (todas curvas no-bounce):
- Page flip del grid: 320 ms con `cubic-bezier(0.32, 0.72, 0, 1)` (spring tipo
  Apple, sin overshoot).
- About logo: entrada con micro-overshoot suave + idle "breathing" infinito
  cada 6 s.

Todo elemento interactivo tiene un estado de pulsación real (scale ~0.97).
Se respeta `prefers-reduced-motion` (override global al final del CSS).

## Components

### Atajos (shortcut card)
Squircle (radio derivado de `--icon-radius`, ajustable 0–50 % desde
Configuración), glass nivel 1. Hover eleva 4 px con halo de acento (triple
sombra: profundidad negra + halo accent + highlight interior). Press hunde
(`scale(0.97)`).

El botón **kebab** (tres puntos verticales) aparece en la esquina superior
derecha al hacer hover; abre el mismo menú contextual que el clic derecho.

### Botones (form-btn)
- **Primario**: relleno `--md-sys-color-primary-container`, texto
  `--md-sys-color-on-primary-container`. Sigue el accent activo.
- **Secundario**: contorno hairline translúcido, texto `--md-sys-color-primary`.
- **Danger**: tinte rojo translúcido.
- **Disabled**: opacidad 0.42, `cursor: not-allowed`, sin hover, leve grayscale.

### Sidebar derecho
Cuatro botones verticales (`+`, ⓘ, ⚙️, 🖼️). El "+" es la única acción
primaria — fondo accent sólido + drop-shadow accent, claramente distinto de
los otros tres (outline). Tooltip CSS custom a la izquierda, sin tooltip
nativo.

### Context menu (right-click sobre un atajo)
- Items: Abrir en nueva pestaña · Abrir en incógnito · Copiar URL · ─ · Editar
  · Duplicar · Eliminar.
- Cada item gana borde + tinte accent al hover; el item "Eliminar" cambia a
  rojo (mismo tratamiento pero color de peligro).
- Se ancla a coordenadas del clic, clampeado al viewport.

### Toast (MD3 Snackbar)
- **Notificación pura**: mensaje + × (manual dismiss).
- **Con acción** (ej. "Deshacer" tras eliminar): mensaje + botón de acción,
  sin × (la acción ES el dismiss). El color de la acción es
  `--md-sys-color-primary-container` para garantizar contraste WCAG sobre el
  fondo claro del snackbar, independientemente del tema.
- Posición: `bottom: 12px`, centrado.

### Modal y panel
Glass nivel 2, entrada y salida simétricas de 320 ms (escala + opacidad).
Cada diálogo tiene `role="dialog"`, `aria-modal="true"`,
`aria-labelledby="…"`, focus trap (Tab/Shift+Tab loop), y restaura foco al
trigger original al cerrar.

### Paginación
Dots dentro de una pill glass (siempre legible sobre cualquier wallpaper).
Dot inactivo: blanco 55 % + halo negro + sombra. Dot activo: capsule accent
con halo de accent. El contenedor se oculta a sí mismo cuando hay una sola
página (`.pagination-dots:empty`).

### Keyboard chips (`<kbd>`)
Para la tabla de atajos en About: chips neutras (`rgba(255,255,255,0.08)`)
con borde sutil + inset shadows, independientes del accent para que siempre
lean igual con cualquier tema. Combos (`⌘+K`) se agrupan con `.kbd-combo`
(gap: 2 px entre teclas), separados con un `.kbd-or` ("o" en minúscula faint)
de las alternativas.

### Skeleton (loading)
14 placeholders shimmer (`shortcutSkeletonShimmer`) renderizados directamente
en HTML dentro de `#shortcuts-grid`. `renderShortcuts()` los wipea en su
primer run. Evita el flash de "empty state" mientras `chrome.storage.local`
resuelve.

## Layout

Rejilla de atajos de 7 columnas con gap consistente (`clamp` para que se
ajuste a la altura disponible). Contenido centrado con ancho máximo
controlado (1050 px de `main`, 1000 px de la `shortcuts-section`).
Espaciado en escala de 4 px. Aire generoso alrededor del reloj y la
búsqueda; densidad cómoda en el panel de configuración.

## Accessibility

- `aria-live="polite"` + `role="status"` en el toast.
- `role="dialog"` + `aria-modal="true"` + focus trap en cada modal.
- Tooltips custom usan `aria-label` así que screen readers leen el mismo
  texto que ve el usuario.
- Respetar `prefers-reduced-motion`: el override global al final del CSS
  desactiva todas las transiciones y animaciones que no sean esenciales.
- Contraste de texto AA sobre las superficies de cristal, verificado para
  cada uno de los 6 temas.
- Foco visible por teclado en todos los controles interactivos.
