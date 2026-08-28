import { CardSimple, Card, Badge, Separator, Button } from '#toolcrib';
import useFeedStore from '../store';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { feeds, articles, openReader, feedErrors, refreshAllFeeds, isLoading } = useFeedStore();

  const totalFeeds = feeds.length;
  const unreadCount = articles.filter((a) => !a.isRead).length;
  const starredCount = articles.filter((a) => a.isStarred).length;
  const recentArticles = articles.slice(0, 25);

  const feedMap = Object.fromEntries(feeds.map((f) => [f.id, f]));
  const errorEntries = Object.entries(feedErrors);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>🌾 Dashboard</h1>
        <p>Your feed farm at a glance</p>
      </div>

      <div className="stats-grid">
        <CardSimple title="Feeds">
          <div className="stat-value">{totalFeeds}</div>
          <div className="stat-label">Subscriptions</div>
        </CardSimple>
        <CardSimple title="Unread">
          <div className="stat-value">{unreadCount}</div>
          <div className="stat-label">Articles to read</div>
        </CardSimple>
        <CardSimple title="Starred">
          <div className="stat-value">{starredCount}</div>
          <div className="stat-label">Saved for later</div>
        </CardSimple>
        <CardSimple title="Total">
          <div className="stat-value">{articles.length}</div>
          <div className="stat-label">Articles harvested</div>
        </CardSimple>
      </div>

      {/* Feed errors */}
      {errorEntries.length > 0 && (
        <Card>
          <Card.Header>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ Failed Feeds
              <Badge subtheme="warning" appearance="soft" size="sm">{errorEntries.length}</Badge>
            </span>
          </Card.Header>
          <Card.Content>
            <div className="feed-errors-list">
              {errorEntries.map(([url, msg]) => (
                <div key={url} className="feed-error-row">
                  <div className="feed-error-url">{url}</div>
                  <div className="feed-error-msg">{msg}</div>
                </div>
              ))}
            </div>
          </Card.Content>
          <Card.Footer>
            <Button variant="ghost" size="sm" icon="🔄" onClick={refreshAllFeeds} disabled={isLoading}>
              Retry All
            </Button>
          </Card.Footer>
        </Card>
      )}

      <Separator />

      <div style={{ marginTop: '1.5rem' }}>
        <div className="section-title">📰 Recent Harvest</div>
        {recentArticles.length === 0 ? (
          <p style={{ color: 'var(--ai-text-secondary)', fontSize: '0.875rem' }}>
            No articles yet. Add some feeds to get started!
          </p>
        ) : (
          recentArticles.map((article) => (
            <div
              key={article.id}
              className={`article-row ${article.isRead ? 'read' : 'unread'}`}
              onClick={() => openReader(article)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openReader(article)}
            >
              {!article.isRead && <div className="unread-dot" />}
              <div className="article-meta">
                <div className="article-title">{article.title}</div>
                <div className="article-snippet">{article.contentSnippet}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Badge size="sm" appearance="soft">
                    {feedMap[article.feedId]?.title || 'Unknown'}
                  </Badge>
                  <span className="article-date">
                    {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

