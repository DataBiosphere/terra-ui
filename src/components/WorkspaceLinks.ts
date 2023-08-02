import { h, span } from 'react-hyperscript-helpers';
import { DelayedRender, Link } from 'src/components/common';
import { getLink } from 'src/libs/nav';
import { useWorkspaceById } from 'src/libs/workspace-hooks';

type WorkspaceLinkProps = {
  namespace: string;
  name: string;
};

export const WorkspaceLink = (props: WorkspaceLinkProps) => {
  const { namespace, name } = props;
  return h(
    Link,
    {
      href: getLink('workspace-dashboard', { namespace, name }),
    },
    [`${namespace}/${name}`]
  );
};

type WorkspaceLinkByIdProps = {
  workspaceId: string;
};

export const WorkspaceLinkById = (props: WorkspaceLinkByIdProps) => {
  const { workspaceId } = props;
  const { workspace, status } = useWorkspaceById(workspaceId, []);

  switch (status) {
    case 'Ready':
      const {
        workspace: { namespace, name },
      } = workspace;
      return h(WorkspaceLink, { namespace, name });
    case 'Error':
      return span([workspaceId]);
    default:
      return h(DelayedRender, [workspaceId]);
  }
};
