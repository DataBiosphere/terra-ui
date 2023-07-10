import _ from 'lodash/fp';
import React, { CSSProperties, Dispatch, Fragment, SetStateAction, useLayoutEffect, useRef } from 'react';
import { div, h, h2 } from 'react-hyperscript-helpers';
import { centeredSpinner } from 'src/components/icons';
import * as Style from 'src/libs/style';
import { BaseWorkspace } from 'src/libs/workspace-utils';
import { Collaborator } from 'src/pages/workspaces/workspace/ShareWorkspaceModal/Collaborator';
import { aclEntryIsTerraSupport, WorkspaceAcl } from 'src/pages/workspaces/workspace/WorkspaceAcl';

/**
 * Render a list of Collaborators of a workspace, and allow them to be modified or removed.
 * @param acl {WorkspaceAcl} the entire current Access Control List
 * @param setAcl {Dispatch<SetStateAction<WorkspaceAcl>>} called to modify the Access Control list when the aclItem changes or is removed
 * @param originalAcl {WorkspaceAcl} the original acl, to determine new items
 * @param workspace {BaseWorkspace} the workspace the acl belongs to
 * @param lastAddedEmail {string | undefined}  the most recently added email to the list
 */
interface CurrentCollaboratorsProps {
  acl: WorkspaceAcl;
  setAcl: Dispatch<SetStateAction<WorkspaceAcl>>;
  originalAcl: WorkspaceAcl;
  workspace: BaseWorkspace;
  lastAddedEmail: string | undefined;
  loaded: boolean;
}

export const CurrentCollaborators: React.FC<CurrentCollaboratorsProps> = (props: CurrentCollaboratorsProps) => {
  const { acl, loaded } = props;
  const list = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    !!props.lastAddedEmail && list?.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [props.lastAddedEmail]);

  return h(Fragment, [
    h2({ style: { ...Style.elements.sectionHeader, margin: '1rem 0 0.5rem 0' } }, ['Current Collaborators']),

    div({ ref: list, role: 'list', style: styles }, [
      h(
        Fragment,
        _.flow(
          _.remove(aclEntryIsTerraSupport),
          _.map((aclItem) => h(Collaborator, { aclItem, ...props }))
        )(acl)
      ),
      !loaded && centeredSpinner(),
    ]),
  ]);
};

const styles: CSSProperties = {
  margin: '0.5rem -1.25rem 0',
  padding: '1rem 1.25rem',
  maxHeight: 550,
  overflowY: 'auto',
  borderBottom: Style.standardLine,
  borderTop: Style.standardLine,
};
