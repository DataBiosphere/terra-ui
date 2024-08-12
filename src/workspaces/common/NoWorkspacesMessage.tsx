import { Clickable, Link } from '@terra-ui-packages/components';
import React from 'react';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';

interface NoWorkspacesMessageProps {
  onClick: () => void;
}

export const NoWorkspacesMessage = (props: NoWorkspacesMessageProps): React.ReactNode => {
  const { onClick } = props;
  return (
    <div style={{ fontSize: 20, margin: '1rem' }}>
      <div>
        {'To get started, '}
        <Clickable onClick={onClick} style={{ display: 'inline', fontWeight: 600, color: colors.accent() }}>
          Create a New Workspace
        </Clickable>
      </div>
      <div style={{ marginTop: '1rem', fontSize: 16 }}>
        <Link {...Utils.newTabLinkProps} href='https://support.terra.bio/hc/en-us/articles/360024743371'>
          What&#39;s a workspace?
        </Link>
      </div>
    </div>
  );
};
