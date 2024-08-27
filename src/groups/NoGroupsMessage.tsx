import React from 'react';
import { Link } from 'src/components/common';
import { newTabLinkProps } from 'src/libs/utils';

export const NoGroupsMessage = (): React.ReactNode => (
  <div style={{ fontSize: 20, margin: '1rem 1rem 0' }}>
    <div>Create a group to share your workspaces with others.</div>
    <div style={{ marginTop: '1rem', fontSize: 16 }}>
      <Link {...newTabLinkProps} href='https://support.terra.bio/hc/en-us/articles/360026775691'>
        How do I use groups to manage authorization?
      </Link>
    </div>
  </div>
);
