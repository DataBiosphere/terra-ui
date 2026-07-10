import { ButtonPrimary, Icon, Modal } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown';

interface CitationModalProps {
  citation: string;
  onDismiss: () => void;
}

export const CitationModal = ({ citation, onDismiss }: CitationModalProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      // Silently fail - button will remain in "Copy Citation" state
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <Modal
      title='Cite the Service'
      onDismiss={onDismiss}
      showCancel={false}
      showX
      okButton={
        <ButtonPrimary onClick={handleCopy}>
          <Icon icon={isCopied ? 'check' : 'copy'} size={14} style={{ marginRight: '0.5rem' }} />
          {isCopied ? 'Copied!' : 'Copy Citation'}
        </ButtonPrimary>
      }
    >
      <div
        style={{
          backgroundColor: '#f4f6f9',
          padding: '1rem',
          borderRadius: '4px',
          fontSize: '14px',
          lineHeight: '1.5',
          border: '1px solid #d6d9dc',
        }}
      >
        <MarkdownViewer
          renderers={{
            link: newWindowLinkRenderer,
            heading: (text: string, level: number) => `<h${level} style="margin-bottom: 0">${text}</h${level}>`,
          }}
        >
          {citation}
        </MarkdownViewer>
      </div>
    </Modal>
  );
};
