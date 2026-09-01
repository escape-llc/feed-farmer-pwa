import { useMemo, useSyncExternalStore } from 'react';
import useFeedStore from './store';
import type { ArticleRecord } from './types';

/**
 * Hash-based routing, chosen over a router library specifically to keep
 * this app dependency-light (it already dropped react-router once). The
 * hash is the single source of truth for which feed/article is "open" —
 * feedId/selectedArticle/readerOpen deliberately don't also live in
 * Zustand, so there's nothing to keep in sync and no reentrancy to guard
 * against. Format: a URLSearchParams-style query string in the fragment
 * (e.g. `#feed=3&article=42`) — feed selection and article-open are
 * genuinely independent axes (the global search combobox opens an
 * article without touching feed selection at all), not a hierarchy.
 */

export function decodeHash(hash: string): { feedId: number | null; articleId: number | null } {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const feedRaw = params.get('feed');
  const articleRaw = params.get('article');
  return {
    feedId: feedRaw ? Number(feedRaw) : null,
    articleId: articleRaw ? Number(articleRaw) : null,
  };
}

function getSnapshot() {
  return window.location.hash;
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

/** Reactive read of the current route, decoded. */
export function useHashRoute() {
  const hash = useSyncExternalStore(subscribe, getSnapshot);
  return useMemo(() => decodeHash(hash), [hash]);
}

/**
 * The one canonical write primitive. Merges `patch` (a partial
 * querystring) into the *current* hash rather than replacing it wholesale
 * — an empty value deletes that key — so e.g. selecting a different feed
 * never clobbers an already-open article. Also the RouterAdapter's own
 * `navigate` implementation: its signature already matches
 * `RouterAdapter.navigate: (to: string) => void` exactly.
 */
export function mergeHash(patch: string) {
  const current = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const patchParams = new URLSearchParams(patch);
  for (const [key, value] of patchParams) {
    if (value === '') current.delete(key);
    else current.set(key, value);
  }
  const next = current.toString();
  if (next !== window.location.hash.replace(/^#/, '')) window.location.hash = next;
}

export function openArticle(article: ArticleRecord) {
  mergeHash(`article=${article.id}`);
  if (!article.isRead) useFeedStore.getState().markRead(article.id);
}

export function closeArticle() {
  mergeHash('article=');
}
