import _ from 'lodash/fp';
import { Dispatch, Fragment, SetStateAction, useLayoutEffect, useRef } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { centeredSpinner } from 'src/components/icons';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { BaseWorkspace } from 'src/libs/workspace-utils';
import { Collaborator } from 'src/pages/workspaces/workspace/ShareWorkspaceModal/Collaborator';
import { aclEntryIsTerraSupport, WorkspaceAcl } from 'src/pages/workspaces/workspace/WorkspaceAcl';

interface CurrentCollaboratorsProps {
  lastAddedEmail: string | undefined;
  loaded: boolean;
  acl: WorkspaceAcl; // the entire current acl
  setAcl: Dispatch<SetStateAction<WorkspaceAcl>>;
  originalAcl: WorkspaceAcl; // the original acl, to determine new items
  workspace: BaseWorkspace; // the workspace the acl belongs to
}

export const CurrentCollaborators = ({ acl, loaded, ...props }: CurrentCollaboratorsProps) => {
  const list = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    !!props.lastAddedEmail && list?.current?.scrollTo({ top: list?.current?.scrollHeight, behavior: 'smooth' });
  }, [props.lastAddedEmail]);

  return div({ ref: list, role: 'list', style: styles }, [
    h(
      Fragment,
      _.flow(
        _.remove(aclEntryIsTerraSupport),
        Utils.toIndexPairs,
        _.map(([_, aclItem]) =>
          h(Collaborator, {
            aclItem,
            acl,
            ...props,
          })
        )
      )(acl)
    ),
    !loaded && centeredSpinner(),
  ]);
};

const styles: React.CSSProperties = {
  margin: '0.5rem -1.25rem 0',
  padding: '1rem 1.25rem',
  maxHeight: 550,
  overflowY: 'auto',
  borderBottom: Style.standardLine,
  borderTop: Style.standardLine,
};
