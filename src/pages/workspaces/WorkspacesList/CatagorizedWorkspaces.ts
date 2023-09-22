import _ from 'lodash/fp';
import { canWrite } from 'src/libs/utils';
import { WorkspaceWrapper as Workspace } from 'src/libs/workspace-utils';

export interface CatagorizedWorkspaces {
  myWorkspaces: Workspace[];
  newAndInteresting: Workspace[];
  featured: Workspace[];
  public: Workspace[];
}

export function catagorizeWorkspaces(workspaces: Workspace[], featuredList?: Workspace[]): CatagorizedWorkspaces {
  const [newWsList, featuredWsList] = _.partition('isNew', featuredList);

  return {
    myWorkspaces: _.filter((ws) => !ws.public || canWrite(ws.accessLevel), workspaces),
    public: _.filter('public', workspaces),
    newAndInteresting: _.flow(
      _.map(({ namespace, name }) => _.find({ workspace: { namespace, name } }, workspaces)),
      _.compact
    )(newWsList),
    featured: _.flow(
      _.map(({ namespace, name }) => _.find({ workspace: { namespace, name } }, workspaces)),
      _.compact
    )(featuredWsList),
  };
}
