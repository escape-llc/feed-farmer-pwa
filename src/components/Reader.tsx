import { useRef, useState, useEffect, useCallback } from 'react';
import { Drawer, Button, ToggleGroup } from '#toolcrib';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import useFeedStore from '../store';

/** Consider RSS content "substantial" if it has this many chars of actual text. */
const CONTENT_THRESHOLD = 300;

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

export default function Reader() {
  const { selectedArticle, readerOpen, closeReader, toggleStar, feeds } = useFeedStore();
  const scrollRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewMode, setViewMode] = useState('auto'); // 'feed' | 'original' | 'auto'

  const feed = selectedArticle ? feeds.find((f) => f.id === selectedArticle.feedId) : null;

  const hasSubstantialContent =
    selectedArticle && stripHtml(selectedArticle.content || '').length > CONTENT_THRESHOLD;

  // Auto-select mode: show feed content if substantial, otherwise iframe
  const effectiveMode =
    viewMode === 'auto' ? (hasSubstantialContent ? 'feed' : 'original') : viewMode;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const progress =
      scrollHeight <= clientHeight ? 100 : (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(progress);
  }, []);

  // Reset on article change
  useEffect(() => {
    setScrollProgress(0);
    setViewMode('auto');
  }, [selectedArticle]);

  if (!selectedArticle) return null;

  const sanitizedContent = DOMPurify.sanitize(selectedArticle.content || '', {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target'],
  });

  const pubDate = selectedArticle.pubDate
    ? format(new Date(selectedArticle.pubDate), 'MMMM d, yyyy')
    : '';

  return (
    <Drawer
      id="reader-drawer"
      position="right"
      isOpen={readerOpen}
      onOpenChange={(open) => {
        if (!open) closeReader();
      }}
      title={feed?.title || 'Article'}
      width="min(100vw, 56rem)"
    >
      {/* Progress bar */}
      {effectiveMode === 'feed' && (
        <div className="reader-progress">
          <div className="reader-progress-bar" style={{ width: `${scrollProgress}%` }} />
        </div>
      )}

      {/* Toolbar */}
      <div className="reader-toolbar" style={{ padding: '0.5rem 1rem' }}>
        <Button variant="ghost" size="sm" icon="←" onClick={closeReader}>
          Back
        </Button>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* View mode toggle — only show if there's feed content AND a link */}
          {hasSubstantialContent && selectedArticle.link && (
            <ToggleGroup
              type="single"
              value={effectiveMode}
              onChange={(val) => val && setViewMode(val)}
              options={[
                { value: 'feed', label: '📄 Feed' },
                { value: 'original', label: '🌐 Original' },
              ]}
              size="sm"
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={selectedArticle.isStarred ? '⭐' : '☆'}
            onClick={() => toggleStar(selectedArticle.id)}
          />
          {selectedArticle.link && (
            <Button
              variant="ghost"
              size="sm"
              icon="↗"
              onClick={() => window.open(selectedArticle.link, '_blank', 'noopener')}
            />
          )}
        </div>
      </div>

      {/* Content area */}
      {effectiveMode === 'feed' ? (
        <div className="reader-scroll" ref={scrollRef} onScroll={handleScroll}>
          <article className="reader-article">
            <h1>{selectedArticle.title}</h1>
            <div className="reader-byline">
              {selectedArticle.author && (
                <>
                  <strong>{selectedArticle.author}</strong>
                  <span>·</span>
                </>
              )}
              {pubDate && <span>{pubDate}</span>}
              {feed && (
                <>
                  <span>·</span>
                  <span>{feed.title}</span>
                </>
              )}
            </div>
            <div
              className="reader-content"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          </article>
        </div>
      ) : (
        /* Iframe mode — embed the original article */
        <div className="reader-iframe-wrap">
          <div className="reader-iframe-header">
            <h2 className="reader-iframe-title">{selectedArticle.title}</h2>
            {pubDate && (
              <span style={{ fontSize: '0.75rem', color: 'var(--ai-text-secondary)' }}>
                {pubDate}
              </span>
            )}
          </div>
          {selectedArticle.link ? (
            <iframe
              className="reader-iframe"
              src={selectedArticle.link}
              title={selectedArticle.title}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div style={{ padding: '2rem', color: 'var(--ai-text-secondary)', textAlign: 'center' }}>
              No link available for this article.
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}
