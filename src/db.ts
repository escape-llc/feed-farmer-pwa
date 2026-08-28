import Dexie, { type EntityTable } from 'dexie';
import type { FeedRecord, ArticleRecord } from './types';

const db = new Dexie('FeedFarmerDB') as Dexie & {
  feeds: EntityTable<FeedRecord, 'id'>;
  articles: EntityTable<ArticleRecord, 'id'>;
};

db.version(1).stores({
  feeds: '++id, url, title, lastFetched',
  articles: '++id, feedId, pubDate, isRead, isStarred, link',
});

export default db;
