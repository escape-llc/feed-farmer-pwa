import { useState } from 'react';
import { z } from 'zod';
import { Modal, Button, Form, FormField, Input, SubmitButton, aiBus, Tooltip } from '#toolcrib';
import useFeedStore from '../store';

const addFeedSchema = z.object({
  url: z.string().trim().url('Enter a valid RSS or Atom feed URL'),
});

export default function AddFeedModal() {
  // Bumped to force <Form> to remount (clearing the field) after a
  // successful add — Form doesn't expose its own resetForm() outside a
  // child that can reach FormContext, so a key change is the simplest way
  // to reset from the parent.
  const [formKey, setFormKey] = useState(0);
  const { addFeed, error } = useFeedStore();

  const handleSubmit = async ({ url }: z.infer<typeof addFeedSchema>) => {
    await addFeed(url);
    const { error: addError, statusMessage } = useFeedStore.getState();
    if (!addError) {
      // Real aiBus usage, not decorative: confirms the add with a toast
      // (reusing the store's own success message) and closes the modal
      // automatically instead of leaving the user to dismiss it by hand.
      aiBus.showToast(statusMessage || 'Feed added', 'success');
      aiBus.closeModal('add-feed-modal');
      setFormKey((k) => k + 1);
    }
  };

  return (
    <Modal
      id="add-feed-modal"
      trigger={
        <Tooltip content="Add Feed">
          {/* No manual squareCorners needed as of toolcrib v0.9.0 -- this
              trigger sits in the middle of App.tsx's header <UIGroup>;
              UIGroupContext now reaches through Modal's own internal
              trigger wrapper div automatically. */}
          <Button variant="primary" size="sm" icon="＋" aria-label="Add Feed" />
        </Tooltip>
      }
      ariaLabel="Add Feed"
      width="28rem"
    >
      <Modal.Header>Add a New Feed</Modal.Header>
      <Modal.Body>
        <Form key={formKey} id="add-feed-form" schema={addFeedSchema} onSubmit={handleSubmit}>
          <FormField name="url" label="RSS or Atom feed URL">
            <Input type="url" placeholder="https://example.com/feed.xml" autoFocus />
          </FormField>
          {error && <div className="add-feed-error">{error}</div>}
          <SubmitButton variant="primary">Add Feed</SubmitButton>
        </Form>
      </Modal.Body>
      <Modal.Actions>
        <Modal.CloseButton />
      </Modal.Actions>
    </Modal>
  );
}
