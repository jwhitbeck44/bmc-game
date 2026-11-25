# Build. Break. Rebuild.

A phone-first Business Model Canvas game for ENTP 3000 (UCCS), Design Thinking Part III (Module 14).
Students build their canvas, their Board tries to break it, and they rebuild it. The page then makes a one-page hand-in (PDF or text).

- `docs/` is the whole site, served by GitHub Pages. No build step, no server, no accounts, no AI calls.
- `docs/content.js` holds every word students see. Edit it, then bump `?v=` on its script tag in `docs/index.html`.
- `docs/app.js` is the page logic. The canvas saves in the browser (localStorage key `bbr-state`). "Copy my link" puts the whole canvas in the URL after `#`, which never reaches a server.
- Tests: `cd test && npm install && node walk.mjs` (full walk with two ventures at 390 and 1280 wide, PDFs, reload, money edge cases, link) and `node words.mjs` (flags dashes and long sentences in content.js). Output goes to `_local/`.
