import { Icon } from '@terra-ui-packages/components';
import React from 'react';

interface RenderBucketConsoleLinkProps {
  cloudPath?: string;
  linkText?: string;
  // When true, the link opens the full object path within the bucket rather than just the bucket root
  includePath?: boolean;
}

const parseGcsPath = (path: string): { bucketName: string; objectPath: string } | null => {
  const match = path.match(/^gs:\/\/([a-z0-9._-]+)\/(.*)$/);
  return match ? { bucketName: match[1], objectPath: match[2] } : null;
};

export const BucketConsoleLink: React.FC<RenderBucketConsoleLinkProps> = ({
  cloudPath,
  linkText = 'View bucket in Google Cloud Console',
  includePath = false,
}) => {
  const parsed = cloudPath ? parseGcsPath(cloudPath) : null;
  const consoleUrl = parsed
    ? `https://console.cloud.google.com/storage/browser/${parsed.bucketName}${
        includePath && parsed.objectPath ? `/${parsed.objectPath}` : ''
      }`
    : null;

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
