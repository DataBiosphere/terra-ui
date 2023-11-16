import React, { ReactNode, useEffect, useState } from 'react';
import { spinnerOverlay } from 'src/components/common';
import { MarkdownViewer, newWindowLinkRenderer } from 'src/components/markdown';
import { useRemoteResource } from 'src/libs/util/useRemoteResource';

interface RemoteMarkdownProps {
  getRemoteText: () => Promise<string>;
}
export const RemoteMarkdown = (props: RemoteMarkdownProps): ReactNode => {
  const { getRemoteText } = props;
  const { resourceState } = useRemoteResource('', getRemoteText, 'Could not get Terms of Service');
  const remoteTextStatus = resourceState.status;
  const [hasLoadedRemoteText, setHasLoadedRemoteText] = useState(false);

  useEffect(() => {
    if (remoteTextStatus === 'Ready') {
      setHasLoadedRemoteText(true);
    }
  }, [remoteTextStatus]);

  return hasLoadedRemoteText ? (
    <MarkdownViewer
      renderers={{
        link: newWindowLinkRenderer,
        heading: (text: string, level: number) => `<h${level} style="margin-bottom: 0">${text}</h${level}>`,
      }}
    >
      {resourceState.resource}
    </MarkdownViewer>
  ) : (
    spinnerOverlay
  );
};
