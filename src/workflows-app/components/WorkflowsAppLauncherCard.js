import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary } from 'src/components/common';
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

export const WorkflowsAppLauncherCard = ({ onClick, launching, disabled }) => {
  return div({ style: { ...styles.card, width: '50rem', margin: '2rem 4rem' } }, [
    h(TitleBar, {
      id: 'workflow-app-launch-page',
      title: 'Launch Workflows app to run workflows',
      style: { marginBottom: '0.5rem' },
    }),
    div({ style: { display: 'flex', marginTop: '1rem', justifyContent: 'flex-center' } }, [
      'Workflows app must be launched in order to explore, view, and submit workflows.',
    ]),
    div({ style: { display: 'flex', marginTop: '.5rem', justifyContent: 'flex-center' } }, [
      'Once launched, Workflows app will remain active until the workspace is deleted.',
    ]),
    div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-center' } }, [
      Utils.cond(
        [launching, () => 'Workflows app is being launched. You may exit this page and return later without interrupting the launching process.'],
        [disabled, () => 'You do not have permission to launch the workflows app in this workspace.'],
        () => 'Would you like to get started?'
      ),
    ]),
    div({ style: { display: 'flex', marginTop: '1rem', justifyContent: 'flex-center', width: '18rem' } }, [
      launching
        ? div({ style: { marginLeft: '1rem' } }, [centeredSpinner({ size: 36 })])
        : h(
            ButtonPrimary,
            {
              disabled,
              onClick,
              style: { width: '100%' },
            },
            ['Yes, launch Workflows app']
          ),
    ]),
  ]);
};
