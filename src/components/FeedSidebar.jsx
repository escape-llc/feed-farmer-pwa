import { Sidebar } from '#toolcrib';
import useFeedStore from '../store';

export default function FeedSidebar() {
  const { feeds, articles, selectedFeedId, setSelectedFeedId } = useFeedStore();

  // Count unread per feed
  const unreadByFeed = {};
  for (const article of articles) {
    if (!article.isRead) {
      unreadByFeed[article.feedId] = (unreadByFeed[article.feedId] || 0) + 1;
    }
  }

  const sidebarItems = [
    {
      id: '__dashboard__',
      label: 'Dashboard',
      icon: '🌾',
    },
    ...feeds.map((feed) => {
      const unread = unreadByFeed[feed.id] || 0;
      return {
        id: String(feed.id),
        label: (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {feed.title}
            </span>
            {unread > 0 && <span className="feed-badge">{unread}</span>}
          </span>
        ),
        icon: '📡',
      };
    }),
  ];

  const activeId = selectedFeedId ? String(selectedFeedId) : '__dashboard__';

  return (
    <Sidebar
      items={sidebarItems}
      activeId={activeId}
      onItemClick={(id) => {
        if (id === '__dashboard__') {
          setSelectedFeedId(null);
        } else {
          setSelectedFeedId(Number(id));
        }
      }}
      aria-label="Feed navigation"
    />
  );
}
