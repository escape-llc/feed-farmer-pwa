/**
 * Lightweight RSS/Atom feed parser using the browser's native DOMParser.
 * No Node.js dependencies — works entirely client-side.
 */

/**
 * Parse an RSS or Atom feed from raw XML text.
 * @param {string} xml  Raw XML string
 * @returns {{ title, link, description, image, items[] }}
 */
export function parseFeed(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  // Check for parse errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid feed XML: ' + parseError.textContent.slice(0, 120));
  }

  const root = doc.documentElement;

  // Detect format
  if (root.nodeName === 'feed' || root.namespaceURI === 'http://www.w3.org/2005/Atom') {
    return parseAtom(doc);
  }
  return parseRSS(doc);
}

/* ── RSS 2.0 / RSS 1.0 ── */
function parseRSS(doc) {
  const channel = doc.querySelector('channel') || doc.documentElement;

  return {
    title: text(channel, 'title'),
    link: text(channel, 'link'),
    description: text(channel, 'description'),
    image: text(channel, 'image > url') || '',
    items: [...doc.querySelectorAll('item')].map((item) => ({
      title: text(item, 'title') || 'Untitled',
      link: text(item, 'link') || '',
      content: cdataText(item, 'content\\:encoded') || cdataText(item, 'content:encoded') || text(item, 'description') || '',
      contentSnippet: stripHtml(text(item, 'description') || '').slice(0, 200),
      pubDate: text(item, 'pubDate') || text(item, 'dc\\:date') || '',
      author: text(item, 'dc\\:creator') || text(item, 'author') || '',
      imageUrl: item.querySelector('enclosure')?.getAttribute('url') || extractFirstImage(text(item, 'description') || '') || '',
    })),
  };
}

/* ── Atom ── */
function parseAtom(doc) {
  const feed = doc.documentElement;

  return {
    title: text(feed, 'title'),
    link: atomLink(feed),
    description: text(feed, 'subtitle') || '',
    image: text(feed, 'icon') || text(feed, 'logo') || '',
    items: [...feed.querySelectorAll('entry')].map((entry) => {
      const content = text(entry, 'content') || text(entry, 'summary') || '';
      return {
        title: text(entry, 'title') || 'Untitled',
        link: atomLink(entry) || '',
        content,
        contentSnippet: stripHtml(text(entry, 'summary') || content).slice(0, 200),
        pubDate: text(entry, 'published') || text(entry, 'updated') || '',
        author: text(entry, 'author > name') || '',
        imageUrl: extractFirstImage(content),
      };
    }),
  };
}

/* ── Helpers ── */

/** Get the text content of the first matching element. */
function text(parent, selector) {
  try {
    const el = parent.querySelector(selector);
    return el ? el.textContent.trim() : '';
  } catch {
    // Namespaced selectors may throw — try getElementsByTagName fallback
    const parts = selector.split(':');
    if (parts.length === 2) {
      const els = parent.getElementsByTagName(selector);
      return els.length > 0 ? els[0].textContent.trim() : '';
    }
    return '';
  }
}

/** Extract CDATA-wrapped content (common for content:encoded). */
function cdataText(parent, selector) {
  try {
    const el = parent.querySelector(selector);
    if (!el) {
      // Fallback: getElementsByTagName for namespaced tags
      const tag = selector.replace(/\\\\/g, '');
      const els = parent.getElementsByTagName(tag);
      if (els.length > 0) return els[0].textContent.trim();
      return '';
    }
    return el.textContent.trim();
  } catch {
    return '';
  }
}

/** Get the href from an Atom <link> element. */
function atomLink(parent) {
  const links = parent.querySelectorAll('link');
  for (const link of links) {
    const rel = link.getAttribute('rel');
    if (!rel || rel === 'alternate') {
      return link.getAttribute('href') || '';
    }
  }
  return links.length > 0 ? (links[0].getAttribute('href') || '') : '';
}

/** Strip HTML tags from a string. */
function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/** Extract the first <img> src from HTML content. */
function extractFirstImage(html) {
  if (!html) return '';
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : '';
}
