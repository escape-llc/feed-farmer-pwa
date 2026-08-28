import useFeedStore from '../store';

/**
 * Slim status ticker bar that sits below the header.
 * Shows live progress messages during feed operations.
 */
export default function Ticker() {
  const { statusMessage, isLoading } = useFeedStore();

  if (!statusMessage) return null;

  const isError = statusMessage.startsWith('✗');
  const isDone = statusMessage.includes('✓');

  return (
    <div className={`ticker ${isError ? 'ticker--error' : isDone ? 'ticker--done' : ''}`}>
      {isLoading && !isError && !isDone && <span className="ticker-dot" />}
      <span className="ticker-text">{statusMessage}</span>
    </div>
  );
}
