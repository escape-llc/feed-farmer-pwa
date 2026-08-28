import Dexie from 'dexie';

const db = new Dexie('FeedFarmerDB');

db.version(1).stores({
  feeds: '++id, url, title, lastFetched',
  articles: '++id, feedId, pubDate, isRead, isStarred, link',
});

export default db;
