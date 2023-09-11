import _ from 'lodash/fp';
import { div, h, img } from 'react-hyperscript-helpers';
import { Clickable } from 'src/components/common';
// Removing this import causes test failures related to circular imports.
import { Ajax } from 'src/libs/ajax'; // eslint-disable-line
import { canUseWorkspaceProject } from 'src/libs/ajax/Billing';
import colors from 'src/libs/colors';
import { requesterPaysProjectStore } from 'src/libs/state';
import * as Style from 'src/libs/style';

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

export const ModalToolButton = ({ icon, text, disabled, ...props }) => {
  return h(
    Clickable,
    _.merge(
      {
        disabled,
        style: {
          color: disabled ? colors.secondary() : colors.accent(),
          opacity: disabled ? 0.5 : undefined,
          border: '1px solid transparent',
          padding: '0 0.875rem',
          marginBottom: '0.5rem',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          height: '3rem',
          fontSize: 18,
          userSelect: 'none',
        },
        hover: {
          border: `1px solid ${colors.accent(0.8)}`,
          boxShadow: Style.standardShadow,
        },
      },
      props
    ),
    [
      !!icon &&
        div({ style: { display: 'flex', alignItems: 'center', width: 45, marginRight: '1rem' } }, [
          img({ src: icon, style: { opacity: disabled ? 0.5 : undefined, maxWidth: 45, maxHeight: 40 } }),
        ]),
      text,
    ]
  );
};
