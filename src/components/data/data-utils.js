import _ from 'lodash/fp';
// Removing this import causes test failures related to circular imports.
import { Ajax } from 'src/libs/ajax'; // eslint-disable-line
import { canUseWorkspaceProject } from 'src/libs/ajax/Billing';
import colors from 'src/libs/colors';
import { requesterPaysProjectStore } from 'src/libs/state';

export const warningBoxStyle = {
  backgroundColor: colors.warning(0.15),
  padding: '1rem 1.25rem',
  color: colors.dark(),
  fontWeight: 'bold',
  fontSize: 12,
};

export const parseGsUri = (uri) => _.drop(1, /gs:[/][/]([^/]+)[/](.+)/.exec(uri));

export const getUserProjectForWorkspace = async (workspace) =>
  workspace && (await canUseWorkspaceProject(workspace)) ? workspace.workspace.googleProject : requesterPaysProjectStore.get();
