import _ from 'lodash/fp';
import React, { CSSProperties, Dispatch, SetStateAction, useLayoutEffect, useRef } from 'react';
import * as Style from 'src/libs/style';
import { aclEntryIsTerraSupport, WorkspaceAcl } from 'src/workspaces/acl-utils';
import { Collaborator } from 'src/workspaces/ShareWorkspaceModal/Collaborator';
import { BaseWorkspace } from 'src/workspaces/utils';

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
  lastAddedEmail?: string;
}

export const CurrentCollaborators: React.FC<CurrentCollaboratorsProps> = (props: CurrentCollaboratorsProps) => {
  const { acl } = props;
  const list = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    !!props.lastAddedEmail && list?.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [props.lastAddedEmail]);

  return (
    <>
      <div style={{ ...Style.elements.sectionHeader, margin: '1rem 0 0.5rem 0' }}>Current Collaborators</div>
      <div ref={list} role='list' style={styles}>
        {_.flow(
          _.remove(aclEntryIsTerraSupport),
          _.map((aclItem) => <Collaborator key={aclItem.email} aclItem={aclItem} {...props} />)
        )(acl)}
      </div>
    </>
  );
};

const styles: CSSProperties = {
  margin: '0.5rem -1.25rem 0',
  padding: '1rem 1.25rem',
  maxHeight: 550,
  overflowY: 'auto',
  borderBottom: Style.standardLine,
  borderTop: Style.standardLine,
};
