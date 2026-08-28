import { useState } from 'react';
import { Modal, Button, Spinner } from '#toolcrib';
import useFeedStore from '../store';

export default function AddFeedModal() {
  const [url, setUrl] = useState('');
  const { addFeed, isLoading, error } = useFeedStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    await addFeed(url.trim());
    if (!useFeedStore.getState().error) {
      setUrl('');
    }
  };

  return (
    <Modal
      id="add-feed-modal"
      trigger={
        <Button variant="solid" size="sm" icon="＋">
          Add Feed
        </Button>
      }
      ariaLabel="Add Feed"
      width="28rem"
    >
      <Modal.Header>Add a New Feed</Modal.Header>
      <Modal.Body>
        <form className="add-feed-form" onSubmit={handleSubmit}>
          <label style={{ fontSize: '0.875rem', color: 'var(--ai-text-secondary)' }}>
            Enter the RSS or Atom feed URL
          </label>
          <input
            className="add-feed-input"
            type="url"
            placeholder="https://example.com/feed.xml"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
            required
          />
          {error && <div className="add-feed-error">{error}</div>}
        </form>
      </Modal.Body>
      <Modal.Actions>
        <Modal.CloseButton />
        <Button
          variant="solid"
          onClick={handleSubmit}
          disabled={isLoading || !url.trim()}
          leadingIcon={isLoading ? <Spinner size="sm" /> : undefined}
        >
          {isLoading ? 'Adding…' : 'Add Feed'}
        </Button>
      </Modal.Actions>
    </Modal>
  );
}
