import { create } from 'zustand';
import { parseFeed } from './feedParser';
import db from './db';
import DEFAULT_FEEDS from './defaultFeeds';
import type { InsertType } from 'dexie';
import type { FeedRecord, ArticleRecord } from './types';

/**
 * Free CORS proxies are unreliable individually (10-20% request failure
 * rate is typical) — rotating through several with fallback is the
 * standard pattern for a client-only feed reader, not a single hardcoded
 * one. Each entry builds its own proxied URL, since response shape/query
 * param naming differs per service (not just the base host).
 */
const CORS_PROXIES: ((url: string) => string)[] = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://proxy.cors.sh/${url}`,
];

/** Guard against React StrictMode double-mounting seeding default feeds twice. */
let _seeding = false;

/** How long to wait on one proxy before moving to the next — confirmed for
 * real (via network logging during this feature's own verification) that
 * a free proxy can simply hang with no response and no error, which would
 * otherwise block the whole rotation forever despite having fallbacks. */
const PROXY_TIMEOUT_MS = 8000;

/**
 * Fetch raw XML through the CORS proxy rotation and parse with our
 * browser-native parser — tries each proxy in turn, only throwing once
 * every one has failed, so a single proxy outage/rate-limit doesn't take
 * down feed fetching entirely. Each attempt is bounded by
 * PROXY_TIMEOUT_MS so a hung (not just a failed) proxy can't block the
 * rotation either.
 */
async function fetchAndParseFeed(url: string) {
  let lastError: Error = new Error('No proxies configured');
  for (const buildProxiedUrl of CORS_PROXIES) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
    try {
      const res = await fetch(buildProxiedUrl(url), { signal: controller.signal });
      if (!res.ok) throw new Error(`Failed to fetch feed: ${res.status}`);
      const xml = await res.text();
      return parseFeed(xml);
    } catch (err) {
      lastError = (err as Error).name === 'AbortError' ? new Error('Proxy timed out') : (err as Error);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

interface FeedStore {
  feeds: FeedRecord[];
  articles: ArticleRecord[];
  selectedFeedId: number | null;
  selectedArticle: ArticleRecord | null;
  readerOpen: boolean;
  isLoading: boolean;
  error: string | null;
  /** Map of feedUrl → error message for feeds that failed to load. */
  feedErrors: Record<string, string>;
  /** Live status message for the ticker. */
  statusMessage: string | null;

  loadFromDB: () => Promise<void>;
  addFeed: (url: string, category?: string) => Promise<void>;
  refreshFeed: (feedId: number) => Promise<void>;
  refreshAllFeeds: () => Promise<void>;
  deleteFeed: (feedId: number) => Promise<void>;
  markRead: (articleId: number) => Promise<void>;
  toggleStar: (articleId: number) => Promise<void>;
  setSelectedFeedId: (feedId: number | null) => void;
  openReader: (article: ArticleRecord) => void;
  closeReader: () => void;
  resetAll: () => Promise<void>;
}

const useFeedStore = create<FeedStore>((set, get) => ({
  feeds: [],
  articles: [],
  selectedFeedId: null,
  selectedArticle: null,
  readerOpen: false,
  isLoading: false,
  error: null,
  feedErrors: {},
  statusMessage: null,

  /**
   * Load all feeds and articles from IndexedDB on startup.
   */
  loadFromDB: async () => {
    set({ statusMessage: 'Loading saved feeds…' });
    const feeds = await db.feeds.toArray();
    const articles = await db.articles.orderBy('pubDate').reverse().toArray();
    set({ feeds, articles });

    // If no feeds exist, seed with defaults (guard against StrictMode double-mount)
    if (feeds.length === 0 && !_seeding) {
      _seeding = true;
      set({ statusMessage: 'First launch — planting default feeds…' });
      for (let i = 0; i < DEFAULT_FEEDS.length; i++) {
        set({ statusMessage: `Fetching ${DEFAULT_FEEDS[i].title} (${i + 1}/${DEFAULT_FEEDS.length})…` });
        await get().addFeed(DEFAULT_FEEDS[i].url, DEFAULT_FEEDS[i].category);
      }
      _seeding = false;
    }
    set({ statusMessage: null });
  },

  /**
   * Add a new feed by URL. Fetches, parses, and stores in IndexedDB.
   * `category` groups the feed under a folder in the sidebar's <Tree> —
   * defaults to 'Other' for user-added feeds, which have no way to pick
   * one via the Add Feed form.
   */
  addFeed: async (url, category = 'Other') => {
    set({ isLoading: true, error: null, statusMessage: `Fetching ${url}…` });
    try {
      // Check for duplicate
      const existing = await db.feeds.where('url').equals(url).first();
      if (existing) {
        set({ isLoading: false, error: 'Feed already exists' });
        return;
      }

      const parsed = await fetchAndParseFeed(url);

      const feedRecord: InsertType<FeedRecord, 'id'> = {
        url,
        category,
        title: parsed.title || url,
        siteUrl: parsed.link || '',
        description: parsed.description || '',
        imageUrl: parsed.image || '',
        lastFetched: new Date().toISOString(),
      };

      const feedId = await db.feeds.add(feedRecord);
      feedRecord.id = feedId;

      // Store articles
      const articleRecords: InsertType<ArticleRecord, 'id'>[] = (parsed.items || []).map((item) => ({
        feedId,
        title: item.title || 'Untitled',
        link: item.link || '',
        content: item.content || item.contentSnippet || '',
        contentSnippet: (item.contentSnippet || '').slice(0, 200),
        pubDate: item.pubDate || new Date().toISOString(),
        author: item.author || '',
        imageUrl: item.imageUrl || '',
        isRead: false,
        isStarred: false,
      }));

      await db.articles.bulkAdd(articleRecords);
      set({ statusMessage: `Added ${feedRecord.title} — ${articleRecords.length} articles` });

      // Reload from DB to get IDs
      const allFeeds = await db.feeds.toArray();
      const allArticles = await db.articles.orderBy('pubDate').reverse().toArray();
      set({ feeds: allFeeds, articles: allArticles, isLoading: false });
    } catch (err) {
      const msg = errorMessage(err, 'Failed to add feed');
      set((state) => ({
        isLoading: false,
        error: msg,
        statusMessage: `✗ Failed: ${url}`,
        feedErrors: { ...state.feedErrors, [url]: msg },
      }));
    }
  },

  /**
   * Refresh a single feed — re-fetches and adds new articles.
   */
  refreshFeed: async (feedId) => {
    set({ isLoading: true, error: null });
    try {
      const feed = await db.feeds.get(feedId);
      if (!feed) return;
      set({ statusMessage: `Refreshing ${feed.title}…` });

      const parsed = await fetchAndParseFeed(feed.url);

      // Get existing article links to avoid duplicates
      const existingLinks = new Set(
        (await db.articles.where('feedId').equals(feedId).toArray()).map((a) => a.link)
      );

      const newArticles: InsertType<ArticleRecord, 'id'>[] = (parsed.items || [])
        .filter((item) => item.link && !existingLinks.has(item.link))
        .map((item) => ({
          feedId,
          title: item.title || 'Untitled',
          link: item.link || '',
          content: item.content || item.contentSnippet || '',
          contentSnippet: (item.contentSnippet || '').slice(0, 200),
          pubDate: item.pubDate || new Date().toISOString(),
          author: item.author || '',
          imageUrl: item.imageUrl || '',
          isRead: false,
          isStarred: false,
        }));

      if (newArticles.length > 0) {
        await db.articles.bulkAdd(newArticles);
      }

      await db.feeds.update(feedId, { lastFetched: new Date().toISOString() });
      set({ statusMessage: `${feed.title} — ${newArticles.length} new articles` });

      const allFeeds = await db.feeds.toArray();
      const allArticles = await db.articles.orderBy('pubDate').reverse().toArray();
      set({ feeds: allFeeds, articles: allArticles, isLoading: false });
    } catch (err) {
      const feedRecord = await db.feeds.get(feedId);
      const msg = errorMessage(err, 'Failed to refresh feed');
      set((state) => ({
        isLoading: false,
        error: msg,
        feedErrors: { ...state.feedErrors, [feedRecord?.url ?? String(feedId)]: msg },
      }));
    }
  },

  /**
   * Refresh all feeds.
   */
  refreshAllFeeds: async () => {
    const { feeds } = get();
    set({ isLoading: true, feedErrors: {}, statusMessage: `Refreshing ${feeds.length} feeds…` });
    for (let i = 0; i < feeds.length; i++) {
      try {
        set({ statusMessage: `Refreshing ${feeds[i].title} (${i + 1}/${feeds.length})…` });
        await get().refreshFeed(feeds[i].id);
      } catch (err) {
        set((state) => ({
          feedErrors: { ...state.feedErrors, [feeds[i].url]: errorMessage(err, 'Failed') },
        }));
      }
    }
    set({ isLoading: false, statusMessage: 'All feeds refreshed ✓' });
    setTimeout(() => set({ statusMessage: null }), 3000);
  },

  /**
   * Delete a feed and all its articles.
   */
  deleteFeed: async (feedId) => {
    await db.articles.where('feedId').equals(feedId).delete();
    await db.feeds.delete(feedId);
    const allFeeds = await db.feeds.toArray();
    const allArticles = await db.articles.orderBy('pubDate').reverse().toArray();
    set({
      feeds: allFeeds,
      articles: allArticles,
      selectedFeedId: get().selectedFeedId === feedId ? null : get().selectedFeedId,
    });
  },

  /**
   * Mark an article as read.
   */
  markRead: async (articleId) => {
    await db.articles.update(articleId, { isRead: true });
    set((state) => ({
      articles: state.articles.map((a) => (a.id === articleId ? { ...a, isRead: true } : a)),
    }));
  },

  /**
   * Toggle star on an article.
   */
  toggleStar: async (articleId) => {
    const article = await db.articles.get(articleId);
    if (!article) return;
    const newStarred = !article.isStarred;
    await db.articles.update(articleId, { isStarred: newStarred });
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === articleId ? { ...a, isStarred: newStarred } : a
      ),
    }));
  },

  setSelectedFeedId: (feedId) => set({ selectedFeedId: feedId }),

  openReader: (article) => {
    set({ selectedArticle: article, readerOpen: true });
    // Also mark as read
    if (article && !article.isRead) {
      get().markRead(article.id);
    }
  },

  // Leaves `selectedArticle` set rather than nulling it here -- Reader.tsx
  // bails out early with `if (!selectedArticle) return null`, which would
  // unmount <Drawer> (and its whole animated-close lifecycle) the instant
  // this ran, before the exit animation ever got a chance to play. The
  // next `openReader()` overwrites it anyway; staying stale in between is
  // harmless since nothing reads it while readerOpen is false.
  closeReader: () => set({ readerOpen: false }),

  /**
   * Nuke IndexedDB and reload — fresh start with default feeds.
   */
  resetAll: async () => {
    await db.delete();
    window.location.reload();
  },
}));

export default useFeedStore;
