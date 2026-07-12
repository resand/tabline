# GEMINI.md

Guidance for AI coding assistants working on **TabLine**, a Chrome new-tab extension.

---

## 1. What this project is

**TabLine** replaces Chrome's default new-tab page with a personal launcher: a clock, Google search bar, a 7×3 paginated grid of reorderable app shortcuts, and a customizable background (gradient, wallpaper gallery, daily rotation, video gallery, custom URL, or local file).

> Note: the project was renamed from "DashTab" (which collided with several existing Chrome Web Store extensions). Some internal identifiers — notably the IndexedDB name `dashtab-bg` — kept the old slug on purpose to avoid breaking storage for existing users. Don't rename those without a migration path.

Single-user, personal extension. Opened tens of times a day → speed and zero friction beat features.

For strategic intent and visual language, read **`PRODUCT.md`** and **`DESIGN.md`** at the project root. They are short and authoritative.

---

## 2. Hard rules (non-negotiable)

1. **All code and code comments must be in English.** UI strings live in the i18n dictionary (`I18N`), where Spanish and English coexist as content. Inline comments, variable names, log messages, etc. → English only. Clean Spanish residue when you touch a file.
2. **Never use `innerHTML` with user-controlled content.** Build DOM with `createElement` + `textContent`, or `createElementNS` for SVG. A pre-tool security hook will block obvious cases.
3. **Don't add dependencies.** No bundler, no npm. Vanilla JS, CSS, HTML.
4. **Don't introduce a build step.** The extension loads the files as-is.
5. **i18n parity is mandatory.** Every key in `I18N.es` must exist in `I18N.en` and vice versa. Run the parity check in §6 after touching the dictionary.

---

## 3. File layout

```
manifest.json          Chrome MV3 manifest with __MSG_*__ localization placeholders
_locales/en/messages.json   Manifest copy (name, description) in English
_locales/es/messages.json   Manifest copy in Spanish
newtab.html            Single-page UI (entry: chrome_url_overrides.newtab)
newtab.js              ~2.9k lines. Class NewTabController + I18N + CURATED_* arrays + StorageRepository + Shortcut
newtab.css             ~2.8k lines. Design tokens in :root, then components
wallpapers/            bg1.png…bg17.png + vid_*.mp4 (gallery assets)
icons/                 Extension icons (16, 48, 128)
PRODUCT.md             Strategic guide (register, users, anti-references)
DESIGN.md              Visual guide (color, typography, motion, components)
README.md              Setup, sanity checks, pre-launch checklist
CHANGELOG.md           Per-version changes (Keep a Changelog format)
PRIVACY.md             Privacy policy (also hosted at renes.dev/privacy-tabline)
GEMINI.md              AI assistant guide — this file
```

**Everything is in `NewTabController`** today. It does storage, render, drag-and-drop, i18n, IndexedDB, background, shortcuts, themes, context menu, toast, etc. There is a documented refactor opportunity to split it into modules; leave that alone unless explicitly asked.

---

## 4. Key subsystems

### i18n (custom, not `chrome.i18n` for the UI)
- Dictionary: `I18N = { es: {...}, en: {...} }` in `newtab.js`. Currently ~150 keys per locale, parity enforced.
- `t(key, vars)` translates with `{var}` interpolation.
- `resolveLang()` reads `settings.language` (`'auto' | 'es' | 'en'`); `auto` follows `navigator.language` (default English for non-Spanish).
- `applyI18n()` walks four attributes:
  - `[data-i18n]` → `textContent`
  - `[data-i18n-ph]` → `placeholder`
  - `[data-i18n-title]` → `title` (native browser tooltip)
  - `[data-i18n-tooltip]` → `data-tooltip` + `aria-label` (used by **custom CSS tooltips** so we never set `title` and avoid the native tooltip flash)
- Dynamic strings (toasts, dialog titles, video labels) call `t()` directly.
- **`_locales/` is separate** from `I18N`. It only localizes `manifest.json` (`name`, `description`) for the Chrome Web Store listing. The runtime UI uses the `I18N` dictionary.

### Storage
- `StorageRepository` abstracts `chrome.storage.local` with a `localStorage` fallback for non-extension dev contexts.
- `getSettings()` merges `getDefaultSettings()` over the loaded blob — adding a new field with a default is safe for existing users.
- Videos uploaded by the user live in **IndexedDB** (`dashtab-bg` DB — kept under the old slug to preserve existing users' data, `video` store, key `'current'`), not `chrome.storage`, because they easily exceed the 10 MB limit. The blob URL is revoked before re-creation to prevent memory leaks.

### Themes (accent palettes)
- Six curated accents are defined in `NewTabController.ACCENT_PALETTES`: `space` (Titanium Gray, default), `lavender`, `sand`, `ocean`, `forest`, `mono`. Each is an HSL triple (e.g. `'215 8% 48%'`).
- `applyAccentPalette()` sets `--accent` on `document.documentElement` and marks the active swatch.
- Every UI surface derives from `--accent`:
  - Direct: `hsl(var(--accent))` / `hsla(var(--accent), X)`.
  - MD3 primary tokens use relative color syntax to derive container shades:
    - `--md-sys-color-primary: hsl(var(--accent))`
    - `--md-sys-color-primary-container: hsl(from hsl(var(--accent)) h s calc(l - 50))`
    - `--md-sys-color-on-primary-container: hsl(from hsl(var(--accent)) h s calc(l + 5))`
  - Color-mix is also used (`color-mix(in srgb, var(--md-sys-color-primary-container) 75%, transparent)`).
- **Never reintroduce a hardcoded violet** like `rgba(208, 188, 255, X)` or `#D0BCFF`; use `hsla(var(--accent), X)` instead.
- The default `--accent` is set in `:root` of the CSS as well as in `getDefaultSettings()` so the first paint has a valid value before JS runs.

### Drag-and-drop reorder
- Pure pointer-events implementation in `onCardPointerDown`, `handleDragMove`, `beginDrag`, `applyShift`, `handleDragEnd`. No libraries.
- Threshold: 6 px movement separates a click from a drag.
- Native image drag (`<img draggable="true">`) is disabled to prevent the browser hijacking the gesture.

### Pagination
- 7×3 = 21 shortcuts per page. `state.slotsPerPage = 21`.
- `goToPage(target)` infers direction, toggles `.flip-next` / `.flip-prev` on the grid (Apple-style spring 320 ms), then renders.
- Mouse wheel over the grid is throttled to 280 ms to match the animation.
- `←` / `→` keys paginate when no overlay is open.
- Pagination dots live inside a glass pill; the active dot is a wider accent capsule. The container hides itself via `.pagination-dots:empty`.

### Add / Edit shortcut
- The "+" button lives at the top of the right sidebar (`.add-shortcut-btn-primary`, filled accent style — visually distinct from the outlined utility buttons).
- Dialog has three tabs: Popular presets, Custom URL, Chrome system pages.
- Popular preset icons that fail to load fall back to a colored letter chip in the picker (broken Wikipedia paths route through `https://www.google.com/s2/favicons?domain=…&sz=128`).
- Empty state: when `state.shortcuts.length === 0`, `renderEmptyState()` shows a centered CTA that opens the add dialog.
- Loading skeleton: 14 placeholder boxes are rendered in HTML directly inside `#shortcuts-grid` so the first paint never flashes empty. `renderShortcuts()` clears them on the first run.

### Context menu (right-click on a shortcut)
- Built once in HTML (`#shortcut-context-menu`) and reused.
- Items: Open in new tab · Open in incognito · Copy URL · ─ · Edit · Duplicate · Delete.
- `showContextMenu(event, id)` accepts both `contextmenu` events (uses pointer coordinates) and clicks from the kebab button (anchors below the rect). Clamps to viewport.
- Delete shows a toast with an inline "Undo" action that restores the shortcut to its original index.
- Duplicate inserts the copy right after the original with a non-clashing `(N)` name suffix, and `goToPage`s to the page where the copy landed.

### Toast notifications (MD3 Snackbar)
- `showToast(message)` → notification only, with manual × dismiss.
- `showToastWithAction(message, label, onAction)` → MD3 Snackbar with action. The × is hidden (the action IS the dismiss).
- Action color uses `var(--md-sys-color-primary-container)` so contrast on the light toast surface stays above WCAG AA regardless of the active theme.

### Modals (a11y)
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby="…"` on every overlay.
- Open: `installFocusTrap(container)` adds a Tab/Shift+Tab loop and stores `_previouslyFocused` so the trigger gets focus back on close.
- Open AND close are animated symmetrically via `opacity` + `transform` transitions (`visibility` is also toggled to keep focus management correct).

### Background system
Single `bgProvider` setting drives `renderBackground()`:
- `gradient` → CSS animated gradient (`body.bg-image-wrapper.gradient-animated`).
- `static` → image from `bgStaticUrl` (curated gallery).
- `daily` → deterministic random pick from `CURATED_WALLPAPERS` seeded by the date.
- `video` → curated video from `bgVideoUrl`.
- `video-url` → external video URL.
- `video-file` → blob from IndexedDB.
- `custom-url` / `custom-file` → user image by URL or base64.
- URLs are escaped before interpolation into `url('…')` so a hostile string can't break out of the CSS literal.

### Icon cache
- `cacheIconUrl(url)` fetches and converts a remote image to a data URL (≤ 250 KB).
- Runs on shortcut save (in `saveShortcutUseCase`) and as a background sweep on startup (`cacheRemoteIcons`).
- Requires `host_permissions: ["<all_urls>"]` in the manifest. The Chrome Web Store reviewer is most likely to question this permission; the justification is "exclusively to fetch and cache the favicon of each domain the user adds as a shortcut; no content scripts, no third-party servers other than Google's s2/favicons as a fallback".

---

## 5. CSS design tokens

Defined in `:root` in `newtab.css`. **Use these, do not hardcode.**

| Token | Purpose |
|---|---|
| `--accent` (HSL triplet) | Active accent of the current theme. Wrap with `hsl()` / `hsla()`. |
| `--md-sys-color-primary` | Derived from `--accent`. Use for primary actions, focus rings, switches. |
| `--md-sys-color-primary-container` | Darker derived shade. Filled buttons, dark fills on light surfaces. |
| `--md-sys-color-on-primary-container` | Lighter derived shade. Text on primary-container. |
| `--glass-1-bg/-border/-blur/-shadow` | Floating surfaces (cards, search bar). |
| `--glass-2-bg/-border/-blur/-shadow` | Elevated surfaces (drawer, dialogs, context menu). |
| `--ease-out` | Single motion curve. |
| `--dur-1` 120 ms · `--dur-2` 200 ms · `--dur-3` 320 ms | Motion scale. |
| `--icon-radius` | Shortcut icon corner radius (driven by the Configuration slider). |
| `--md-shape-*` | Corner radius scale. |

**Never animate layout properties** (use `transform`/`opacity`). **No bounce/elastic easing.** Respect `prefers-reduced-motion` (already handled at the bottom of the CSS).

Use `color-mix(in srgb, var(--token) X%, transparent)` for tonal hovers/overlays instead of duplicating rgba literals. Use `hsl(from var(--token) h s calc(l ± N))` (relative color syntax, Chrome 119+) to derive shades from `--accent`.

---

## 6. Common commands

Run from the repo root.

```sh
# JS syntax check (fastest sanity check after edits)
node --check newtab.js

# CSS brace balance (catch broken edits)
node -e 'const c=require("fs").readFileSync("newtab.css","utf8");
const o=(c.match(/{/g)||[]).length, x=(c.match(/}/g)||[]).length;
console.log(o===x ? "CSS OK" : "CSS UNBALANCED " + o + "/" + x);'

# i18n parity (es and en must have the same keys)
node -e 'const fs=require("fs");
const js=fs.readFileSync("newtab.js","utf8");
const s=js.indexOf("const I18N = {"), e=js.indexOf("\n};", s);
const b=js.slice(s,e);
const esB=b.slice(b.indexOf("es: {"), b.indexOf("en: {"));
const enB=b.slice(b.indexOf("en: {"));
const grab=x=>{const r=new Set(); for(const m of x.matchAll(/^\s{4}.([^\x27\n]+).:/gm)) r.add(m[1]); return r;};
const es=grab(esB), en=grab(enB);
console.log(es.size, en.size, [...es].filter(k=>!en.has(k)).length || [...en].filter(k=>!es.has(k)).length ? "MISMATCH" : "OK");'

# JSON validity (manifest + locales)
python3 -c 'import json; json.load(open("manifest.json")); json.load(open("_locales/en/messages.json")); json.load(open("_locales/es/messages.json")); print("JSON OK")'

# Verify referenced assets exist
ls wallpapers/
```

After editing the extension, reload it from `chrome://extensions` and open a fresh tab (`Cmd+T`). HTML/CSS/JS changes don't require a reload of the extension itself, just a new tab — but a `manifest.json` change (including `_locales/` files) does.

---

## 7. Conventions

- **Indentation:** 2 spaces. No tabs.
- **Quotes:** single quotes in JS, double in HTML attributes.
- **Semicolons:** always.
- **Variable naming:** `camelCase` for variables and functions, `PascalCase` for classes, `UPPER_SNAKE` for module-level constants (`CURATED_VIDEOS`, `CURATED_WALLPAPERS`, `I18N`).
- **CSS class naming:** kebab-case, BEM-ish (`.wallpaper-card.active`, `.shortcut-icon-wrapper`).
- **DOM refs:** centralized in `this.dom = {…}` inside the constructor. Add new IDs there, not via ad-hoc `document.getElementById`.
- **i18n keys:** dot-namespaced (`settings.bg.video`, `dialog.addTitle`, `toast.shortcutAdded`).
- **SVG creation in JS:** never `innerHTML`. Use `createElementNS('http://www.w3.org/2000/svg', …)`. See `createKebabSvg()` for the canonical pattern.
- **Setting intervals:** always store the handle on `this._xxxInterval` and `clearInterval` before re-creating, so a re-init can't stack timers.

---

## 8. Anti-patterns to refuse

These show up in AI-generated code and should never land here:

- 3-sided borders (`border-top: none` + asymmetric radii) — not an MD3 pattern, looks broken.
- Gradient text (`background-clip: text` + gradient background). Use a solid color.
- Decorative glassmorphism without a depth hierarchy.
- Nested cards.
- Heavy left-/right-stripe borders as accents.
- Bouncy / elastic easings (`cubic-bezier(...1.5...)`).
- Hardcoded violet literals (`rgba(208, 188, 255, …)`, `#D0BCFF`) — they decouple from the theme. Use `hsla(var(--accent), X)` / `hsl(var(--accent))`.
- Cyan hex literals (`#06b6d4`, `rgba(6, 182, 212, …)`) — relic from before the violet rename. The only legitimate `#06b6d4` is one of the user-selectable color swatches in the shortcut color picker.
- Animating `left`, `top`, `width`, `height`, etc. Use `transform`.
- Hardcoded icon corner radius — use `var(--icon-radius)`.
- Native `title=` attributes on sidebar buttons or other tooltipped controls — they double up with the custom CSS tooltip. Use `data-i18n-tooltip` instead.
- Toast with both an action button AND a × — MD3 Snackbar pattern says action IS the dismiss.

---

## 9. Keyboard shortcuts (the contract)

Surfaced to users in the About dialog. Keep this list and `handleGlobalKeyDown` in sync.

| Key | Action |
|---|---|
| `/` or `⌘/Ctrl + K` | Focus the search bar |
| `⌘/Ctrl + N` | Open the Add Shortcut dialog |
| `⌘/Ctrl + ,` | Toggle the Settings drawer |
| `←` / `→` | Paginate the shortcut grid |
| `?` | Open About |
| `Esc` | Close any open modal, drawer or popover |

`isTypingTarget(el)` guards every shortcut that conflicts with typing.

---

## 10. When uncertain

- Check `PRODUCT.md` and `DESIGN.md` before invoking creative judgment on UX or visuals.
- Match the surrounding code's idioms before introducing a new one.
- Prefer the smallest change that addresses the user's request fully. The user iterates fast; large speculative rewrites get in the way.
- If you add a new component, derive its colors from `--accent` (directly or via the MD3 primary container tokens) so it follows the active theme automatically.
