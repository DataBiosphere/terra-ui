import { cond, DEFAULT } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { InfoBox } from 'src/components/InfoBox';
import colors from 'src/libs/colors';
import { isOwner, WorkspaceAccessLevel } from 'src/libs/workspace-utils';

import { WorkspaceAcl } from '../WorkspaceAcl';

interface OwnerNoticeProps {
  owners: string[];
  accessLevel: WorkspaceAccessLevel;
  acl?: WorkspaceAcl;
}

export const OwnerNotice = (props: OwnerNoticeProps): ReactNode => {
  const { owners, accessLevel, acl } = props;
  return cond(
    // No warning if there are multiple owners.
    [_.size(owners) !== 1, () => null],
    // If the current user does not own the workspace, then then workspace must be shared.
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
      _.size(acl) > 1,
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
