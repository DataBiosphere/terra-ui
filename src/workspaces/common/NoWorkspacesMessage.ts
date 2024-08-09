import { Link } from '@terra-ui-packages/components';
import { div, h } from 'react-hyperscript-helpers';
import * as Utils from 'src/libs/utils';

interface NoWorkspacesMessageProps {
  onClick: () => void;
}

export const NoWorkspacesMessage = (props: NoWorkspacesMessageProps): React.ReactNode => {
  const { onClick } = props;
  return div({ style: { fontSize: 20, margin: '1rem' } }, [
    div([
      'To get started, ',
      h(
        Link,
        {
          onClick,
          style: { fontWeight: 600 },
        },
        ['Create a New Workspace']
      ),
    ]),
    div({ style: { marginTop: '1rem', fontSize: 16 } }, [
      h(
        Link,
        {
          ...Utils.newTabLinkProps,
          href: 'https://support.terra.bio/hc/en-us/articles/360024743371',
        },
        ["What's a workspace?"]
      ),
    ]),
  ]);
};
