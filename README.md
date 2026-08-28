# Feed Farmer 🌾

An RSS/Atom feed reader PWA — fully client-side, offline-capable, no backend of any kind. Built as a real-world toolcrib sample app: not a component showcase, an actual small product built with the toolkit.

## What it does

- Subscribe to RSS/Atom feeds, organized into folders by category
- Read articles in an immersive reader (sanitized feed content, or the original page)
- Star articles, track read/unread, search across everything, jump anywhere via a command palette
- Works offline once feeds have been fetched (IndexedDB via Dexie + a PWA service worker)

## Toolcrib features this demonstrates

- **Zod-driven forms** — `AddFeedModal` validates its URL field via `<Form schema={...}>`/`<FormField>`/`<Input>`/`<SubmitButton>`, no manual `useState`/`onChange` wiring.
- **Event bus (`aiBus`)** — a successful add fires `aiBus.showToast(...)` and `aiBus.closeModal(...)`; `CommandPalette` items drive navigation and actions the same way `Modal`/`Popup` do internally.
- **`Tree`** — feeds grouped into category folders in the sidebar, with controlled expand state (see `FeedSidebar.tsx`'s own comment on why `defaultExpandedIds` alone doesn't work for folders that don't exist yet at first mount).
- **`CommandPalette`** — Cmd/Ctrl+K to jump to any feed or run an action.
- **`Combobox`** — live article search in the header.
- **`ThemeEditor`** — the toolkit's real-time HSV theme editor, hosted in a `Popup`, live-editing the app's own theme.
- **`Skeleton`** — loading placeholders while feeds are being fetched, instead of a blank pane.
- **`UIGroup`** — the header's action buttons (Add Feed / Refresh / Theme / Reset) merge into one visually cohesive segmented control.
- **`Tooltip`** — every icon-only button carries both a tooltip and an `aria-label`.
- Full theme customization (`main.tsx`'s HSV `initialParameters`) and the responsive `marginMode` breakpoint framework.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build       # production build + service worker
npm run test:e2e    # Playwright suite (see note below)
```

## A note on network dependencies

This app fetches feed XML directly from the browser, which means it needs a CORS proxy (see `src/store.ts`) — most real-world feeds don't send CORS headers, and there's no backend here to make that request server-side instead. `fetchAndParseFeed` rotates through several public proxies with an 8-second per-attempt timeout, since any single one can fail *or simply hang* (confirmed directly while building this).

The "Original" view in the reader (an iframe of the actual source page) doesn't work for every site — many sites (BBC, The Verge, both default feeds here) block being framed via their own `frame-ancestors` CSP directive, which is enforced by the browser regardless of anything this app does. There's no client-side workaround; the reader falls back to an "open in a new tab" hint after a few seconds if nothing's rendered.

Because of both of the above, `e2e/` deliberately doesn't test live feed-fetch success — it covers UI behavior that doesn't depend on a real network round-trip.
