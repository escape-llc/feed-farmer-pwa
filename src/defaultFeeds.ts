/**
 * Default feeds shipped with Feed Farmer so it's not empty on first launch.
 * Selected for: full article content in RSS (not just links), reliable CORS proxy access.
 */
const DEFAULT_FEEDS = [
  {
    url: 'https://blog.mozilla.org/en/feed/',
    title: 'Mozilla Blog',
    category: 'Tech',
  },
  {
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    title: 'BBC Tech News',
    category: 'Tech',
  },
  {
    url: 'https://www.nasa.gov/feed/',
    title: 'NASA',
    category: 'Science',
  },
  {
    url: 'https://www.theverge.com/rss/index.xml',
    title: 'The Verge',
    category: 'Tech',
  },
  {
    url: 'https://feeds.feedburner.com/brainpickings/rss',
    title: 'The Marginalian',
    category: 'Culture',
  },
];

export default DEFAULT_FEEDS;
