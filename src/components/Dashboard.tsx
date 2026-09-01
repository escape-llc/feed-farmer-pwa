import { CardSimple, Card, Badge, Separator, Button, Grid, EmptyState, Skeleton } from '#toolcrib';
import useFeedStore from '../store';
import { openArticle } from '../hashRoute';
import { formatDistanceToNow } from 'date-fns';

function ArticleRowSkeleton() {
  return (
    <div className="article-row" aria-hidden="true">
      <div className="article-meta" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <Skeleton shape="text" width="55%" height="0.875rem" />
        <Skeleton shape="text" width="90%" height="0.75rem" />
        <Skeleton shape="text" width="30%" height="0.6875rem" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { feeds, articles, feedErrors, refreshAllFeeds, isLoading } = useFeedStore();

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

      <div style={{ marginBottom: '2rem' }}>
        <Grid columns="auto-fit" minColWidth="10rem">
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
        </Grid>
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
        {isLoading && recentArticles.length === 0 ? (
          <>
            <ArticleRowSkeleton />
            <ArticleRowSkeleton />
            <ArticleRowSkeleton />
          </>
        ) : recentArticles.length === 0 ? (
          <EmptyState>
            <EmptyState.Title>No articles yet. Add some feeds to get started!</EmptyState.Title>
          </EmptyState>
        ) : (
          recentArticles.map((article) => (
            <div
              key={article.id}
              className={`article-row ${article.isRead ? 'read' : 'unread'}`}
              onClick={() => openArticle(article)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openArticle(article)}
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

