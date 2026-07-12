# TabLine

A quiet new tab for Chrome: clock, Google search, reorderable squircle shortcuts and customizable HD wallpapers. Built to be opened tens of times a day without getting in the way.

> Vanilla JS, no bundler, no dependencies. Just three files (`newtab.html`, `newtab.js`, `newtab.css`) plus assets and a manifest. Loads as-is.

---

## Install (for development)

1. Clone or download this repo.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. Open a new tab — TabLine takes over the new tab page.

After editing HTML/CSS/JS, just open a new tab to see the change. After editing `manifest.json`, hit the reload button in `chrome://extensions`.

To open in incognito (for the right-click "Open in incognito" action), toggle **Allow in Incognito** in `chrome://extensions` for TabLine.

---

## Project structure

```
manifest.json           MV3 manifest with __MSG_*__ localization placeholders
_locales/en/            Manifest copy (name, description) in English
_locales/es/            Manifest copy in Spanish
newtab.html             Single-page UI (entry: chrome_url_overrides.newtab)
newtab.js               NewTabController + I18N + CURATED_* + StorageRepository (~2900 lines)
newtab.css              Design tokens in :root, then components (~2800 lines)
wallpapers/             bg1.png…bg17.png + vid_*.mp4 (gallery assets)
icons/                  Extension icons (16, 48, 128)
PRODUCT.md              Strategic guide (register, target users, anti-references)
DESIGN.md               Visual guide (color, typography, motion, themes, components)
CHANGELOG.md            Per-version changes (Keep a Changelog format)
PRIVACY.md              Privacy policy
GEMINI.md               AI assistant guidance — read before contributing
```

---

## Quick sanity checks

```sh
# JS syntax (fastest check after editing newtab.js)
node --check newtab.js

# CSS brace balance (catches half-edited blocks)
node -e 'const c=require("fs").readFileSync("newtab.css","utf8");
const o=(c.match(/{/g)||[]).length, x=(c.match(/}/g)||[]).length;
console.log(o===x ? "CSS OK" : "CSS UNBALANCED " + o + "/" + x);'

# i18n parity (ES and EN must have the same keys)
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
```

---

## Conventions (short version — see `GEMINI.md` for the full set)

- **All code and code comments in English.** UI strings live in the `I18N` dictionary where Spanish and English coexist as content.
- **Never use `innerHTML` with user-controlled content.** Build DOM with `createElement` + `textContent`.
- **No dependencies. No build step.** Vanilla JS, CSS, HTML.
- 2-space indent, single quotes in JS, semicolons always, `camelCase` for vars/funcs, `PascalCase` for classes, `UPPER_SNAKE` for module-level constants.
- Use design tokens (`--accent`, `--glass-1-*`, `--ease-out`, `--dur-1/2/3`, `--icon-radius`, `--md-shape-*`) — never hardcode their values.
- Animate `transform` and `opacity` only; never layout properties. Respect `prefers-reduced-motion`.

---

## Keyboard shortcuts

Surfaced to users in the About dialog (ⓘ in the sidebar or press `?`).

| Key | Action |
|---|---|
| `/` or `⌘/Ctrl + K` | Focus the search bar |
| `⌘/Ctrl + N` | Open the Add Shortcut dialog |
| `⌘/Ctrl + ,` | Toggle the Settings drawer |
| `←` / `→` | Paginate the shortcut grid |
| `?` | Open About (where this list lives) |
| `Esc` | Close any open modal / drawer / popover |

---

## Themes

Six curated accent palettes, selectable from Settings → "Color de acento":
**Titanium Gray** (default), **Lavender**, **Sand**, **Ocean**, **Forest** and
**Mono**. All UI surfaces (FAB, switches, sliders, focus rings, halos,
pagination, tooltips, About chips, background washes) derive from a single
`--accent` HSL triple, so themes stay perfectly consistent. See
`DESIGN.md` for the per-palette HSL values and the derivation rules.

---

## Submitting to the Chrome Web Store

Before submitting `v0.9.0+`:

- `manifest.json` is localized via `_locales/en` and `_locales/es` so the
  Store listing displays in the user's browser language. The ZIP **must
  include the `_locales/` directory** or the manifest will fail to install.
- `permissions` includes only what the code uses: `storage`, `unlimitedStorage`, `search`.
  `search` routes the new-tab search box through the user's own default search
  engine (`chrome.search.query`) so the page stays single-purpose and respects
  the user's choice. Note `chrome.tabs.create` / `chrome.tabs.update` are used
  for `chrome://` shortcuts but do **not** require the `tabs` permission, so it
  is intentionally omitted.
- `host_permissions: ["<all_urls>"]` is required for the favicon cache. The
  Web Store reviewer will likely flag this — the justification is
  "exclusively to fetch and cache the favicon of each domain the user adds
  as a shortcut; no content scripts, no third-party servers other than
  Google's s2/favicons as a fallback".
- Provide at least one screenshot (1280×800) and a hosted privacy policy URL
  (current one: `https://renes.dev/privacy-tabline`).
- Run the sanity checks above; all three must return `OK`.

For full strategic and design context, read `PRODUCT.md` and `DESIGN.md`.
For per-version history, read `CHANGELOG.md`.
