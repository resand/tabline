# Product

## Register

product

## Users

Un desarrollador de software que reemplaza la página de nueva pestaña de Chrome
por este lanzador personal. La abre decenas de veces al día en sesiones de
segundos: ojea la hora, lanza un sitio frecuente (GitHub, Firebase, Supabase,
Cloud Console, Gmail) o hace una búsqueda. Trabaja de día y de noche. El
job-to-be-done: llegar a su destino con cero fricción, sin que la pestaña
reclame atención.

## Product Purpose

Sustituir la nueva pestaña por defecto por un dashboard personal: reloj, barra
de búsqueda Google, una rejilla paginada de atajos reordenables (7×3 por
página, drag & drop, scroll del mouse o flechas para paginar) y un fondo
personalizable (gradiente, wallpaper, video o URL). El éxito es invisible: el
usuario llega a lo que quiere sin pensar en la herramienta.

## Brand Personality

Refinado, eficiente, silencioso. La extensión se comporta como una herramienta
de desarrollador de gama alta (Linear, Raycast): precisa, rápida, sin ruido.
Calma con carácter, no austeridad aburrida. El movimiento confirma, no
entretiene.

## Anti-references

- Páginas de nueva pestaña recargadas: widgets de clima gigantes, citas
  motivacionales, feeds de noticias, decoración por todas partes.
- Glassmorphism decorativo y exagerado: desenfoque sobre desenfoque sin
  jerarquía de capas.
- Material Design "de plantilla": componentes genéricos sin intención.
- Cualquier elemento que compita con el wallpaper o distraiga de la tarea.

## Strategic Design Principles

1. El wallpaper es el protagonista visual; la UI flota discreta sobre él.
2. Jerarquía de profundidad real: cada capa de cristal tiene un nivel claro,
   nunca el mismo desenfoque para todo.
3. El movimiento comunica estado (foco, pulsación, reordenado, page flip),
   nunca decora.
4. Densidad cómoda: aire suficiente para respirar, sin desperdiciar espacio.
   Los tamaños se adaptan a la altura del viewport con `clamp()`, nunca con
   scroll vertical interno.
5. Vocabulario de componentes consistente: un botón, un toggle, un campo o
   una `<kbd>` se ven y se comportan igual en todas las vistas.
6. Un solo color de acento drives toda la UI vía `--accent`. El usuario lo
   elige entre 6 paletas curadas (titanio default, lavanda, arena, océano,
   bosque, mono); la extensión no permite color libre porque rompería los
   contrastes garantizados.

## Accessibility

- Respetar `prefers-reduced-motion`: desactivar transiciones no esenciales.
- Contraste de texto AA sobre las superficies de cristal, verificado para
  cada uno de los 6 temas (el toast en particular usa el container derivado
  del accent para no fallar contraste con paletas claras).
- Foco visible por teclado en todos los controles interactivos.
- Modales con `role="dialog"`, `aria-modal`, focus trap y restauración de
  foco al cerrar.
- Tooltips custom exponen su texto vía `aria-label` para lectores de
  pantalla.
- Toasts con `aria-live="polite"` para que las confirmaciones se anuncien.

## Keyboard discoverability

Los atajos de teclado son una capa de poder, no requisito. Se exponen en el
diálogo About (accesible desde el botón ⓘ del sidebar **o** con la tecla
`?`), no requieren memorización para usar la extensión.
