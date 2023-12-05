import _ from 'lodash/fp';
import { Fragment, ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import * as Nav from 'src/libs/nav';
import { newTabLinkProps } from 'src/libs/utils';
import { InitializedWorkspaceWrapper as Workspace } from 'src/pages/workspaces/hooks/useWorkspace';

interface AuthDomainPanelProps {
  workspace: Workspace;
}

export const AuthDomainPanel = (props: AuthDomainPanelProps): ReactNode => {
  const { authorizationDomain } = props.workspace.workspace;

  return h(Fragment, [
    div({ style: { margin: '0.5rem 0.5rem 1rem 0.5rem' } }, [
      'Collaborators must be a member of all of these ',
      h(
        Link,
        {
          href: Nav.getLink('groups'),
          ...newTabLinkProps,
        },
        ['groups']
      ),
      ' to access this workspace.',
    ]),
    ..._.map(
      ({ membersGroupName }) => div({ style: { margin: '0.5rem', fontWeight: 500 } }, [membersGroupName]),
      authorizationDomain
    ),
  ]);
};
