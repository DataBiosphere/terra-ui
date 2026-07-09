import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { MarkdownViewer } from 'src/components/markdown';
import colors from 'src/libs/colors';
import { notify } from 'src/libs/notifications';

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
        border: `1px solid ${colors.dark(0.25)}`,
        borderRadius: '4px',
        padding: '1rem',
        backgroundColor: 'white',
        marginTop: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Citation</h3>
        <ButtonPrimary
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '14px',
          }}
        >
          <Icon icon={isCopied ? 'check' : 'copy'} size={14} />
          {isCopied ? 'Copied!' : 'Copy Citation'}
        </ButtonPrimary>
      </div>
      <div
        style={{
          backgroundColor: colors.dark(0.05),
          padding: '1rem',
          borderRadius: '4px',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      >
        <MarkdownViewer renderers={undefined}>{citation}</MarkdownViewer>
      </div>
    </div>
  );
};
