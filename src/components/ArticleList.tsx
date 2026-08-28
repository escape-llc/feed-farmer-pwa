import { Button, Badge } from '#toolcrib';
import useFeedStore from '../store';
import { formatDistanceToNow } from 'date-fns';

export default function ArticleList() {
  const { feeds, articles, selectedFeedId, openReader, refreshFeed, toggleStar, isLoading } =
    useFeedStore();

  const feed = feeds.find((f) => f.id === selectedFeedId);
  const feedArticles = articles.filter((a) => a.feedId === selectedFeedId);

  if (!feed) {
    return (
      <div className="article-list" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--ai-text-secondary)' }}>Select a feed from the sidebar</p>
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

      {feedArticles.length === 0 ? (
        <p style={{ color: 'var(--ai-text-secondary)', fontSize: '0.875rem' }}>
          No articles in this feed yet.
        </p>
      ) : (
        feedArticles.map((article) => (
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
            <button
              className={`star-button ${article.isStarred ? 'starred' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleStar(article.id);
              }}
              title={article.isStarred ? 'Unstar' : 'Star'}
            >
              {article.isStarred ? '⭐' : '☆'}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
