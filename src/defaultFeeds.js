/**
 * Default feeds shipped with Feed Farmer so it's not empty on first launch.
 * Selected for: full article content in RSS (not just links), reliable CORS proxy access.
 */
const DEFAULT_FEEDS = [
  {
    url: 'https://blog.mozilla.org/en/feed/',
    title: 'Mozilla Blog',
  },
  {
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    title: 'BBC Tech News',
  },
  {
    url: 'https://www.nasa.gov/feed/',
    title: 'NASA',
  },
  {
    url: 'https://www.theverge.com/rss/index.xml',
    title: 'The Verge',
  },
  {
    url: 'https://feeds.feedburner.com/brainpickings/rss',
    title: 'The Marginalian',
  },
];

export default DEFAULT_FEEDS;
