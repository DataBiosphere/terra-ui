import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link } from 'src/components/common';
import TitleBar from 'src/components/TitleBar';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

const styles = {
  // Card's position: relative and the outer/inner styles are a little hack to fake nested links
  card: {
    ...Style.elements.card.container,
    position: 'absolute',
  },
};

export const WorkflowsAppLauncherCard = ({ onClick, disabled, ...props }) => {
  return div({ style: { ...styles.card, margin: '2rem 4rem' } }, [
    h(TitleBar, {
      id: 'workflow-app-launch-page',
      title: 'Launch the Workflows App to run workflows',
      style: { marginBottom: '0.5rem' },
    }),
    div(['The Workflows App must be launched in order to explore, view, and submit workflows.']),
    div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-center' } }, [
      !disabled && 'Would you like to get started?',
      disabled &&
        'Workflows App is being created. This could take several minutes. You may exit this page and return later without interrupting the creation process.',
    ]),
    div({ style: { display: 'flex', marginTop: '1rem', justifyContent: 'flex-center' } }, [
      h(
        ButtonPrimary,
        {
          disabled,
          tooltip: disabled ? 'Workflows App is being created' : 'Create Workflows App',
          onClick,
        },
        ['Yes, launch the Workflows App']
      ),
    ]),
    h(
      Link,
      {
        ...Utils.newTabLinkProps,
        href: 'https://support.terra.bio/hc/en-us/articles/360024743371-Working-with-workspaces',
        style: { marginTop: '2rem' },
      },
      ['Learn more about managing cloud cost']
    ),
  ]);
};
