// `id` is required here, not optional -- EntityTable's own InsertType
// utility (used in db.ts) derives the *insert*-time shape (id optional,
// since it's Dexie-assigned on add()) from this base type automatically.
// Declaring it optional here instead would make every *read* path (get,
// toArray, ...) carry a spurious `number | undefined` for a field that's
// always genuinely present once loaded from the DB.
export interface FeedRecord {
  id: number;
  url: string;
  category: string;
  title: string;
  siteUrl: string;
  description: string;
  imageUrl: string;
  lastFetched: string;
}

export interface ArticleRecord {
  id: number;
  feedId: number;
  title: string;
  link: string;
  content: string;
  contentSnippet: string;
  pubDate: string;
  author: string;
  imageUrl: string;
  isRead: boolean;
  isStarred: boolean;
}

export interface ParsedFeedItem {
  title: string;
  link: string;
  content: string;
  contentSnippet: string;
  pubDate: string;
  author: string;
  imageUrl: string;
}

export interface ParsedFeed {
  title: string;
  link: string;
  description: string;
  image: string;
  items: ParsedFeedItem[];
}
