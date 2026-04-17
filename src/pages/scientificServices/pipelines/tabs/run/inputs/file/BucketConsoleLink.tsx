import { Icon } from '@terra-ui-packages/components';
import React from 'react';

interface RenderBucketConsoleLinkProps {
  cloudPath?: string;
  linkText?: string;
}

const extractBucketName = (path: string): string | null => {
  const match = path.match(/^gs:\/\/([a-z0-9._-]+)\/.*$/);
  return match ? match[1] : null;
};

export const BucketConsoleLink: React.FC<RenderBucketConsoleLinkProps> = ({
  cloudPath,
  linkText = 'View bucket in Google Cloud Console',
}) => {
  const bucketName = cloudPath ? extractBucketName(cloudPath) : null;
  const consoleUrl = bucketName ? `https://console.cloud.google.com/storage/browser/${bucketName}` : null;

  if (!consoleUrl) {
    return null;
  }

  return (
    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #d0d0d0' }}>
      <a
        href={consoleUrl}
        target='_blank'
        rel='noreferrer'
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#46A3E9',
          textDecoration: 'none',
        }}
      >
        {linkText} <Icon icon='pop-out' />
      </a>
    </div>
  );
};
