# Agent instructions

Transposable Piano is a static PWA (no build step) hosted on GitHub Pages from
`main`. Pushing to `main` deploys it.

## Updates must show up fast

The owner wants every pushed change to appear on installed devices as fast as
possible. Keep that working:

- **Bump `APP_VERSION` in `version.js` with every change to app files**
  (HTML, CSS, JS, manifest, icons). That one value drives the service worker
  cache name (`piano-v<N>`) and the "Version N" footer. The footer is how the
  owner checks which version a device is running. Do not hard-code the version
  anywhere else.
- **Add new app files to `ASSETS` in `sw.js`** so they work offline.
- **Keep the service worker network-first with `cache: "no-cache"`** in its
  fetch handler. GitHub Pages sends `Cache-Control: max-age=600`; without
  `no-cache`, online loads can serve copies up to 10 minutes old.
- **Keep the registration in `index.html` as it is:**
  - `updateViaCache: "none"`, so update checks fetch `sw.js` and `version.js`
    from the server and never from the HTTP cache.
  - `registration.update()` whenever the page becomes visible, because an
    installed app can stay in the background for days without reloading.
  - A single reload on `controllerchange` (skipped on first install), so a new
    version appears without a second manual refresh.
- **Keep `skipWaiting()` and `clients.claim()`** in `sw.js` so a new worker
  takes over immediately instead of waiting for every tab to close.
- Do not add long-lived caching, hashed filenames that bypass `version.js`, or
  "update available, tap to refresh" prompts that delay updates.
