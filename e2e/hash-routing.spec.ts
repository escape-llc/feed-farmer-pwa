import { test, expect } from '@playwright/test';

// Real feed fetches go through unreliable public CORS proxies (see
// src/store.ts's own comment on this) — playwright.config.ts's own policy
// is to never depend on one succeeding, so this intercepts the first proxy
// in the rotation (api.allorigins.win, tried first) and serves a small
// canned feed instead. One sequential test, not several independent ones,
// since IndexedDB doesn't persist across separate Playwright test() blocks
// and there's no shared storageState set up to change that.
const FEED_TITLE = 'Hash Routing Test Feed';
const ARTICLE_TITLE = 'Test Article One';

const CANNED_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${FEED_TITLE}</title>
    <link>https://example.com</link>
    <description>A feed for e2e testing.</description>
    <item>
      <title>${ARTICLE_TITLE}</title>
      <link>https://example.com/article-one</link>
      <description>First test article.</description>
      <pubDate>Mon, 01 Sep 2026 00:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Test Article Two</title>
      <link>https://example.com/article-two</link>
      <description>Second test article.</description>
      <pubDate>Mon, 01 Sep 2026 00:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

test('hash reflects feed/article navigation and survives Back + a real reload', async ({ page }) => {
  // Intercept all three proxies (src/store.ts's own rotation) so the app's
  // own default-feed seeding — which goes through the exact same proxies —
  // doesn't fall through to a real network call or, worse, get served this
  // test's own canned feed under a different title. Only the URL this test
  // actually adds gets the canned response; every other underlying feed
  // URL (the real default feeds) fails fast so seeding moves on quickly.
  const proxyHosts = ['https://api.allorigins.win/**', 'https://corsproxy.io/**', 'https://proxy.cors.sh/**'];
  for (const hostPattern of proxyHosts) {
    await page.route(hostPattern, (route) => {
      const isTestFeed = route.request().url().includes('test-feed.xml');
      if (isTestFeed) {
        route.fulfill({ status: 200, contentType: 'application/xml', body: CANNED_RSS });
      } else {
        route.fulfill({ status: 502, body: 'blocked in e2e' });
      }
    });
  }

  await page.goto('/');

  // Add the feed.
  await page.getByRole('button', { name: /Add Feed/ }).click();
  await page.getByPlaceholder('https://example.com/feed.xml').fill('https://example.com/test-feed.xml');
  await page.getByRole('button', { name: /^Add Feed$/ }).click();
  await expect(page.getByText('Add a New Feed')).not.toBeVisible();
  const feedTreeItem = page.getByRole('treeitem', { name: new RegExp(FEED_TITLE) });
  await expect(feedTreeItem).toBeVisible();

  // Selecting the feed in the sidebar updates the hash (routed through
  // aiBus.navigate() -> RouterAdapterProvider -> mergeHash).
  await feedTreeItem.click();
  await expect.poll(() => page.evaluate(() => location.hash)).toMatch(/^#feed=\d+$/);
  const feedHash = await page.evaluate(() => location.hash);

  // Opening an article merges in the article param without clobbering feed.
  // (The article title also appears in ArticleList's own row regardless of
  // whether the Drawer is open, so "Open in a new tab" — only rendered
  // inside the Reader itself — is the real open/closed signal below.)
  await page.getByText(ARTICLE_TITLE).click();
  await expect.poll(() => page.evaluate(() => location.hash)).toMatch(/^#feed=\d+&article=\d+$/);
  const readerLink = page.getByRole('button', { name: 'Open in a new tab' });
  await expect(readerLink).toBeVisible();

  // Back closes the reader (article param drops) and returns to the prior feed.
  await page.goBack();
  await expect(readerLink).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe(feedHash);

  // A real fresh navigation to the captured URL restores the same feed
  // selection — the deep-link/reload case, using a real id this test
  // produced rather than a guessed default.
  const url = page.url();
  await page.goto(url);
  await expect(page.getByText(ARTICLE_TITLE)).toBeVisible();
});
