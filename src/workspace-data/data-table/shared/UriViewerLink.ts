import _ from 'lodash/fp';
import { Fragment, ReactNode, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { WorkspaceWrapper } from 'src/workspaces/utils';

import { isAzureUri, isGsUri } from '../uri-viewer/uri-viewer-utils';
import { UriViewer } from '../uri-viewer/UriViewer';

type UriViewerLinkProps = {
  uri: string;
  workspace: WorkspaceWrapper;
};

export const UriViewerLink = (props: UriViewerLinkProps): ReactNode => {
  const { uri, workspace } = props;
  const [modalOpen, setModalOpen] = useState(false);
  return h(Fragment, [
    h(
      Link,
      {
        style: { textDecoration: 'underline' },
        href: uri,
        onClick: (e) => {
          e.preventDefault();
          setModalOpen(true);
        },
      },
      [typeof uri === 'string' && (isGsUri(uri) || isAzureUri(uri)) ? _.last(uri.split(/\/\b/)) : uri]
    ),
    modalOpen &&
      h(UriViewer, {
        onDismiss: () => setModalOpen(false),
        uri,
        workspace,
      }),
  ]);
};
