import { create } from 'zustand';
import { parseFeed } from './feedParser';
import db from './db';
import DEFAULT_FEEDS from './defaultFeeds';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

/** Guard against React StrictMode double-mounting seeding default feeds twice. */
let _seeding = false;

/**
 * Fetch raw XML through the CORS proxy and parse with our browser-native parser.
 */
async function fetchAndParseFeed(url) {
  const proxiedUrl = CORS_PROXY + encodeURIComponent(url);
  const res = await fetch(proxiedUrl);
  if (!res.ok) throw new Error(`Failed to fetch feed: ${res.status}`);
  const xml = await res.text();
  return parseFeed(xml);
}

const useFeedStore = create((set, get) => ({
  feeds: [],
  articles: [],
  selectedFeedId: null,
  selectedArticle: null,
  readerOpen: false,
  isLoading: false,
  error: null,
  /** Map of feedUrl → error message for feeds that failed to load. */
  feedErrors: {},
  /** Live status message for the ticker. */
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
        await get().addFeed(DEFAULT_FEEDS[i].url);
      }
      _seeding = false;
    }
    set({ statusMessage: null });
  },

  /**
   * Add a new feed by URL. Fetches, parses, and stores in IndexedDB.
   */
  addFeed: async (url) => {
    set({ isLoading: true, error: null, statusMessage: `Fetching ${url}…` });
    try {
      // Check for duplicate
      const existing = await db.feeds.where('url').equals(url).first();
      if (existing) {
        set({ isLoading: false, error: 'Feed already exists' });
        return;
      }

      const parsed = await fetchAndParseFeed(url);

      const feedRecord = {
        url,
        title: parsed.title || url,
        siteUrl: parsed.link || '',
        description: parsed.description || '',
        imageUrl: parsed.image || '',
        lastFetched: new Date().toISOString(),
      };

      const feedId = await db.feeds.add(feedRecord);
      feedRecord.id = feedId;

      // Store articles
      const articleRecords = (parsed.items || []).map((item) => ({
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
      const msg = err.message || 'Failed to add feed';
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

      const newArticles = (parsed.items || [])
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
      const msg = err.message || 'Failed to refresh feed';
      set((state) => ({
        isLoading: false,
        error: msg,
        feedErrors: { ...state.feedErrors, [feedRecord?.url || feedId]: msg },
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
          feedErrors: { ...state.feedErrors, [feeds[i].url]: err.message || 'Failed' },
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

  closeReader: () => set({ readerOpen: false, selectedArticle: null }),

  /**
   * Nuke IndexedDB and reload — fresh start with default feeds.
   */
  resetAll: async () => {
    await db.delete();
    window.location.reload();
  },
}));

export default useFeedStore;
