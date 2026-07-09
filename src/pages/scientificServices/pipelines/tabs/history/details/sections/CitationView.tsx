import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown';

interface CitationViewProps {
  citation: string;
}

export const CitationView = ({ citation }: CitationViewProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(citation);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      style={{
        backgroundColor: '#f4f6f9',
        border: '1px solid #d6d9dc',
        borderRadius: '4px',
        padding: '1rem 1rem 1.5rem',
        margin: '1rem 0',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Citation</h3>
        <ButtonPrimary
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Icon icon={isCopied ? 'check' : 'copy'} size={14} />
          {isCopied ? 'Copied!' : 'Copy Citation'}
        </ButtonPrimary>
      </div>
      <div
        style={{
          backgroundColor: 'white',
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
    </div>
  );
};
