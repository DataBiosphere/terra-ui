import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, Link } from 'src/components/common';
import { centeredSpinner } from 'src/components/icons';
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
    div({ style: { display: 'flex', marginTop: '1rem', justifyContent: 'flex-center' } }, [
      'The Workflows App must be launched in order to explore, view, and submit workflows.',
    ]),
    div({ style: { display: 'flex', marginTop: '.5rem', justifyContent: 'flex-center' } }, [
      'Once launched, it will stay on until the workspace is deleted.',
    ]),
    div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-center' } }, [
      disabled
        ? 'Workflows App is being created. You may exit this page and return later without interrupting the creation process.'
        : 'Would you like to get started?',
    ]),
    div({ style: { display: 'flex', marginTop: '1rem', justifyContent: 'flex-center', width: '18rem' } }, [
      disabled
        ? div({ style: { marginLeft: '1rem' } }, [centeredSpinner({ size: 36 })])
        : h(
            ButtonPrimary,
            {
              disabled,
              tooltip: disabled ? 'Workflows App is being created' : 'Create Workflows App',
              onClick,
              style: { width: '100%' },
            },
            ['Yes, launch the Workflows App ']
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
