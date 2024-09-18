import { InfoBox } from '@terra-ui-packages/components';
import { cond, DEFAULT } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { ReactNode, useEffect, useState } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { withErrorReporting } from 'src/libs/error';
import { useCancellation } from 'src/libs/react-utils';
import { RawWorkspaceAcl } from 'src/workspaces/acl-utils';
import { InitializedWorkspaceWrapper as Workspace } from 'src/workspaces/common/state/useWorkspace';
import { isOwner } from 'src/workspaces/utils';

interface OwnerNoticeProps {
  workspace: Workspace;
}

export const OwnerNotice = (props: OwnerNoticeProps): ReactNode => {
  const { workspace } = props;
  const { owners = [], accessLevel } = workspace;

  const [acl, setAcl] = useState<RawWorkspaceAcl>();

  const signal = useCancellation();

  useEffect(() => {
    const { namespace, name } = workspace.workspace;
    const loadAcl = withErrorReporting('Error loading ACL')(async () => {
      const { acl } = await Ajax(signal).Workspaces.workspace(namespace, name).getAcl();
      setAcl(acl);
    });

    // If the current user is the only owner of the workspace, load the ACL to check if the workspace is shared.
    if (workspace.workspaceInitialized && isOwner(accessLevel) && _.size(owners) === 1) {
      loadAcl();
    }
  }, [workspace, owners, accessLevel, signal]);

  return cond(
    // No warning if there are multiple owners.
    [_.size(owners) !== 1, () => null],
    // If the current user does not own the workspace, then the workspace must be shared.
    [
      !isOwner(accessLevel),
      () =>
        h(
          InfoBox,
          {
            icon: 'error-standard',
            style: { color: colors.accent() },
          },
          [
            'This shared workspace has only one owner. Consider requesting ',
            h(Link, { href: `mailto:${owners[0]}` }, [owners[0]]),
            ' to add another owner to ensure someone is able to manage the workspace in case they lose access to their account.',
          ]
        ),
    ],
    // If the current user is the only owner of the workspace, check if the workspace is shared.
    [
      _.size(acl) > 1, // acl is a dict, and _.size will give the number of entries
      () =>
        h(
          InfoBox,
          {
            icon: 'error-standard',
            style: { color: colors.accent() },
          },
          [
            'You are the only owner of this shared workspace. Consider adding another owner to ensure someone is able to manage the workspace in case you lose access to your account.',
          ]
        ),
    ],
    [DEFAULT, () => null]
  );
};
