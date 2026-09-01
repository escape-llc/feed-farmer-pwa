import { Button, EmptyState, Skeleton, Tooltip } from '#toolcrib';
import useFeedStore from '../store';
import { useHashRoute, openArticle } from '../hashRoute';
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

export default function ArticleList() {
  const { feeds, articles, refreshFeed, toggleStar, isLoading } = useFeedStore();
  const { feedId } = useHashRoute();

  const feed = feeds.find((f) => f.id === feedId);
  const feedArticles = articles.filter((a) => a.feedId === feedId);

  if (!feed) {
    return (
      <div className="article-list" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState>
          <EmptyState.Title>Select a feed from the sidebar</EmptyState.Title>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="article-list">
      <div className="article-list-header">
        <h2>{feed.title}</h2>
        <Button
          variant="ghost"
          size="sm"
          icon="🔄"
          onClick={() => refreshFeed(feed.id)}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </div>

      {isLoading && feedArticles.length === 0 ? (
        <>
          <ArticleRowSkeleton />
          <ArticleRowSkeleton />
          <ArticleRowSkeleton />
        </>
      ) : feedArticles.length === 0 ? (
        <EmptyState>
          <EmptyState.Title>No articles in this feed yet.</EmptyState.Title>
        </EmptyState>
      ) : (
        feedArticles.map((article) => (
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
                {article.author && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--ai-text-secondary)' }}>
                    by {article.author}
                  </span>
                )}
                <span className="article-date">
                  {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                </span>
              </div>
            </div>
            <Tooltip content={article.isStarred ? 'Unstar' : 'Star'}>
              <Button
                variant="ghost"
                size="sm"
                icon={article.isStarred ? '⭐' : '☆'}
                aria-label={article.isStarred ? 'Unstar' : 'Star'}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar(article.id);
                }}
              />
            </Tooltip>
          </div>
        ))
      )}
    </div>
  );
}
