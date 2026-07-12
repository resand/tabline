# Changelog

All notable changes to TabLine are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.9.1] — 2026-06-02

Chrome Web Store review compliance. No new features; these changes address two
policy findings from the first submission so the listing can be resubmitted.

### Changed

- The search box now routes queries through `chrome.search.query` to the user's
  **own default search engine** (set in Chrome's settings) instead of a
  hardcoded provider. For users whose default is Google — most of them — the
  behavior is unchanged, but the new tab page no longer overrides the search
  experience. Resolves the *Single Purpose* finding.

### Removed

- The multi-engine search picker (Google / ChatGPT / Gemini / Bing /
  DuckDuckGo) and its popover. Engine selection now lives in Chrome's own
  settings, which `chrome.search` respects.
- The `tabs` permission. `chrome.tabs.create` / `chrome.tabs.update` (used to
  open `chrome://` shortcuts) work without it, so requesting it violated the
  least-privilege policy. Added the narrower `search` permission instead.

---

## [0.9.0] — 2026-05-24

First public release candidate. TabLine replaces Chrome's default new-tab
page with a quiet launcher: a clock, a Google search bar, a paginated grid
of app shortcuts, and a customizable wallpaper.

### What's included

**Shortcuts**

- 7-column grid with 3 or 4 rows per page (configurable density,
  default `Auto` picks the row count based on viewport height).
- Auto-fetch of the page `<title>` (with `og:title` / `twitter:title`
  fallbacks) when adding a shortcut from the Custom tab — fills the name
  field only when the user hasn't typed manually. Aborts cleanly if the
  user keeps editing or closes the dialog.
- Drag-and-drop reordering with live preview and a drop-target ring on
  the destination card. Hit-test uses `elementsFromPoint` and falls back
  to cursor-based proximity in gutters between cards.
- Mouse wheel and `←` / `→` keys flip pages.
- Right-click menu per shortcut: Open in new tab, Open in incognito,
  Copy URL, Edit, Duplicate, Delete.
- Undo on delete restores the shortcut to its original slot.
- Empty state CTA when there are no shortcuts.
- Loading skeleton on first paint so the grid doesn't flash empty before
  storage resolves.
- **Launching animation** on icon click: ~380ms pulse + ripple shockwave +
  shimmer sweep + brightness boost. Honors `prefers-reduced-motion`.

**Pages**

- Multiple pages with dot-style pagination and an animated active capsule.
- Each page can be renamed inline (double-click the dot, type, `Enter`).
  Labeled pages render as text pills instead of dots.
- **Cross-page drag**: drag a shortcut onto a different page's dot/tab
  in the pagination bar to move it to that page. The bar pulses while
  dragging and the destination pill highlights on hover.

**Search**

- Google search bar with keyboard focus via `/` or `⌘/Ctrl + K`.

**Wallpaper**

- Curated HD gallery (17 still images).
- Curated live video backgrounds.
- Daily wallpaper rotation.
- Custom image by URL or local file.
- Custom video by URL or local file (stored in IndexedDB).
- Animated gradient as a lightweight default.
- Optional night dim with configurable start/end.

**Clock**

- Translucent clock and date, 12/24-hour toggle, responsive sizing.

**Themes (accent colors)**

- Six curated accent palettes that retint the entire UI in one click:
  Titanium Gray (default), Lavender, Sand, Ocean, Forest and Mono.
- Every UI surface — FAB, sidebar buttons, switches, sliders, focus rings,
  pill badges, hovers, halos and the ambient background wash — derives from
  a single `--accent` HSL triple, so themes stay consistent across the app.

**Customization**

- **Grid density** setting (`Auto` / `3 filas` / `4 filas`) with live
  matchMedia repagination on the `Auto` setting when the viewport crosses
  the height threshold.
- Adjustable shortcut icon roundness (square ↔ squircle ↔ circle).
- Light/dark adaptive accents that read on any wallpaper.
- Bilingual UI (ES / EN) with automatic language detection.

**Sidebar & dialogs**

- Right sidebar with Add Shortcut, About, Settings and Wallpapers buttons,
  each with a custom tooltip on hover.
- About dialog with feature highlights, author info and the full keyboard
  shortcut reference (including the double-click-to-rename-page gesture).
- Settings drawer with all configuration in one place.

**Backup**

- Export full configuration to `.json`.
- Import from current or legacy backup format. The import button stays
  disabled until a file is selected.
- One-click reset to factory defaults.

**Keyboard shortcuts**

| Key | Action |
|---|---|
| `/` or `⌘/Ctrl + K` | Focus the search bar |
| `⌘/Ctrl + N` | Open the Add Shortcut dialog |
| `⌘/Ctrl + ,` | Toggle the Settings drawer |
| `←` / `→` | Paginate the shortcut grid |
| `?` | Open About (where this list lives) |
| `Esc` | Close any open modal, drawer or popover |

**Toast notifications** (MD3 Snackbar pattern)

- Plain notifications include a `×` for manual dismissal.
- Action toasts (e.g. "Undo" after a delete) replace the `×` with the
  action button — the action itself is the dismiss, as per MD3 spec.
- `aria-live="polite"` announcements for screen readers.
- Action label always uses the dark `primary-container` shade so contrast
  stays above WCAG AA on every theme.

**Accessibility**

- `role="dialog"` with focus trap on every modal. Closed dialogs use the
  `inert` attribute (alongside `aria-hidden`) so focused descendants are
  automatically blurred — fixes the Chrome warning when closing a modal
  with a focused button.
- Custom CSS tooltips on the sidebar are exposed via `aria-label` so
  screen readers get the same text.
- `data-i18n-aria` attribute that translates `aria-label` from the I18N
  dictionary (used by the pagination bar and other static aria-labels).
- Pagination dots use `role="tablist"` / `role="tab"` with `aria-selected`.
- Respects `prefers-reduced-motion` for all transitions and animations,
  including the launching pulse and drag drop-target ring.

**Internationalization**

- Custom `I18N` dictionary with 165 keys × 2 languages (ES / EN), kept at
  parity by a sanity check.
- `manifest.json` localized via `_locales/en` and `_locales/es`, so the
  Chrome Web Store listing displays in the user's browser language.

**Security & hardening**

- Explicit `content_security_policy` in `manifest.json`:
  `script-src 'self'; object-src 'self'; base-uri 'self'`. Makes the
  default MV3 policy explicit and locks `<base href>` against hijacking.
- Zero `innerHTML` writes with user-supplied data. All clears use
  `replaceChildren()`; all dynamic SVG is built with `createElementNS`.
- Global `unhandledrejection` + script `error` listeners log silent
  async failures (storage writes, fetches) to the DevTools console with
  a `[TabLine]` prefix.
- `credentials: 'omit'` on the auto-title fetch so the user's cookies
  never reach the target domain at add-shortcut time.

[0.9.1]: https://github.com/resand/tabline/releases/tag/v0.9.1
[0.9.0]: https://github.com/resand/tabline/releases/tag/v0.9.0
