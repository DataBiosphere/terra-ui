import { Icon } from '@terra-ui-packages/components';
import React from 'react';

interface RenderBucketConsoleLinkProps {
  cloudPath?: string;
  linkText?: string;
  // When true, the link opens the full object path within the bucket rather than just the bucket root
  includePath?: boolean;
}

const parseGcsPath = (path: string): { bucketName: string; objectPath: string } | null => {
  const match = /^gs:\/\/([a-z0-9._-]+)\/(.*)$/.exec(path);
  return match ? { bucketName: match[1], objectPath: match[2] } : null;
};

export const BucketConsoleLink: React.FC<RenderBucketConsoleLinkProps> = ({
  cloudPath,
  linkText = 'View bucket in Google Cloud Console',
  includePath = false,
}) => {
  const parsed = cloudPath ? parseGcsPath(cloudPath) : null;
  if (!parsed) {
    return null;
  }

  let consoleUrl = `https://console.cloud.google.com/storage/browser/${parsed.bucketName}`;
  if (includePath && parsed.objectPath) {
    consoleUrl += `/${parsed.objectPath}`;
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
