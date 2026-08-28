import { useEffect, useState } from 'react';
import { Tree, Badge } from '#toolcrib';
import useFeedStore from '../store';
import type { FeedRecord } from '../types';

const DASHBOARD_ID = '__dashboard__';

export default function FeedSidebar() {
  const { feeds, articles, selectedFeedId, setSelectedFeedId } = useFeedStore();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  // Count unread per feed
  const unreadByFeed: Record<number, number> = {};
  for (const article of articles) {
    if (!article.isRead) {
      unreadByFeed[article.feedId] = (unreadByFeed[article.feedId] || 0) + 1;
    }
  }

  // Group feeds into folders by category — real hierarchy for <Tree> to
  // show off, since <Sidebar> (used for top-level nav elsewhere in this
  // app) is deliberately flat/single-level and has no grouping concept.
  const byCategory: Record<string, FeedRecord[]> = {};
  for (const feed of feeds) {
    const category = feed.category || 'Other';
    (byCategory[category] ||= []).push(feed);
  }

  const feedNode = (feed: FeedRecord) => {
    const unread = unreadByFeed[feed.id] || 0;
    return {
      id: String(feed.id),
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📡 {feed.title}
          </span>
          {unread > 0 && (
            <Badge size="sm" appearance="solid" variant="primary">
              {unread}
            </Badge>
          )}
        </span>
      ),
    };
  };

  // Feeds arrive incrementally while seeding, so a folder's own id
  // doesn't exist yet at <Tree>'s first mount -- `defaultExpandedIds`
  // only applies once, at that first (empty) render, so it can't expand
  // folders that appear afterward. Controlled `expandedIds` instead:
  // auto-expand each category the first time it appears, but leave
  // anything the user has since collapsed/expanded alone.
  const categoryKeys = Object.keys(byCategory);
  useEffect(() => {
    setExpandedIds((prev) => {
      const prevSet = new Set(prev);
      const missing = categoryKeys.map((c) => `folder-${c}`).filter((id) => !prevSet.has(id));
      return missing.length > 0 ? [...prev, ...missing] : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKeys.join(',')]);

  const treeItems = [
    { id: DASHBOARD_ID, label: '🌾 Dashboard' },
    ...Object.entries(byCategory).map(([category, categoryFeeds]) => ({
      id: `folder-${category}`,
      label: `📁 ${category}`,
      children: categoryFeeds.map(feedNode),
      disabled: categoryFeeds.length === 0,
    })),
  ];

  const activeId = selectedFeedId ? String(selectedFeedId) : DASHBOARD_ID;

  return (
    <Tree
      items={treeItems}
      selectedId={activeId}
      expandedIds={expandedIds}
      onExpandedChange={setExpandedIds}
      onSelectChange={(id) => {
        // Folder rows aren't navigable content — ignore selection there
        // and let <Tree> handle expand/collapse for them on its own.
        if (!id || id.startsWith('folder-')) return;
        setSelectedFeedId(id === DASHBOARD_ID ? null : Number(id));
      }}
      aria-label="Feed navigation"
    />
  );
}
