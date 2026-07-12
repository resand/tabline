# TabLine — Privacy Policy

**Last updated:** July 11, 2026

TabLine ("the extension") is a Chrome new-tab replacement developed by René Sandoval. This document explains how the extension handles user data.

## Data we collect

**None.** The extension does not collect, transmit, sell or share any data on any remote server. No analytics, no telemetry, no tracking pixels.

## Local storage

All your settings and content are stored exclusively in your own browser, using Chrome's local storage APIs:

- **`chrome.storage.local`** — language preference, clock format, background choice, night-dim schedule, icon roundness, the list of shortcut tiles you create, and other UI preferences.
- **IndexedDB** (`dashtab-bg` database) — background videos you upload from your own device.

This data never leaves your browser. Uninstalling the extension removes it. There is no cloud sync.

## Network requests

The extension makes outbound network requests only in four narrow cases:

1. **Favicons for shortcuts.** When you add a shortcut, TabLine fetches the favicon of that shortcut's own domain (typically `<domain>/apple-touch-icon.png`). If that fails, it falls back to Google's public `s2/favicons` endpoint. The favicon is downloaded once and cached locally as a data URL — subsequent loads are offline.
2. **Page-title suggestion.** When you paste a URL in the "Add shortcut" dialog, TabLine fetches that page once to read its `<title>` / Open Graph name and suggest a shortcut name. The request is sent without cookies (`credentials: 'omit'`) and gives up after 4.5 seconds.
3. **External wallpaper URL or external video URL** — only if you, the user, explicitly paste one as a background source.
4. **Curated wallpaper and video assets** bundled with the extension itself.

No request carries any identifying information about you beyond what the browser normally sends to those endpoints (User-Agent, IP).

## Permissions used and why

- **`storage`** and **`unlimitedStorage`** — to persist your settings and your uploaded background videos locally. `unlimitedStorage` is required because user videos easily exceed the default 10 MB quota.
- **`search`** — used solely to send the query you type in the new-tab search box to your own default search engine via `chrome.search.query()`. It is invoked only when you submit a search; no query is sent anywhere else and no search setting is ever read or changed.
- **`host_permissions: <all_urls>`** — solely to fetch favicons for the shortcut domains you add. The extension does not run any content script, does not read or modify the content of any web page, and does not communicate with any third-party server beyond the cases listed above.

## Third parties

The extension does not integrate with any third-party analytics, advertising, A/B testing or telemetry service. All fonts and UI assets are bundled with the extension; nothing is loaded from third-party CDNs at runtime.

## Children

The extension does not knowingly collect any information from anyone, including children under 13.

## Changes to this policy

If this policy changes, the new version will be published at the same URL and dated above.

## Contact

Questions or concerns:

- René Sandoval — [renes.dev](https://renes.dev)
- Email — [resand91@gmail.com](mailto:resand91@gmail.com)
