import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_COLLABORATIVE_WORKFLOW_RUNNERS } from 'src/libs/feature-previews-config';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace } from 'src/testing/workspace-fixtures';

import { appAccessScopes, appToolLabels } from '../utils/tool-utils';
import { CromwellModal } from './CromwellModal';

const onSuccess = jest.fn();

const defaultAjaxImpl = {
  list: jest.fn(),
  listWithoutProject: jest.fn(),
  app: jest.fn(),
  listAppsV2: jest.fn(),
  createAppV2: jest.fn(),
  deleteAppV2: jest.fn(),
};

const defaultCromwellProps = {
  onDismiss: () => {},
  onError: () => {},
  onSuccess,
  appLabel: appToolLabels.CROMWELL,
  apps: [],
  workspace: defaultAzureWorkspace,
  isOpen: true,
  onExited: () => {},
};

const defaultCromwellRunnerAppProps = {
  onDismiss: () => {},
  onError: () => {},
  onSuccess,
  appLabel: appToolLabels.CROMWELL_RUNNER_APP,
  apps: [],
  workspace: defaultAzureWorkspace,
  isOpen: true,
  onExited: () => {},
};

jest.mock('src/libs/ajax');
jest.mock('src/libs/ajax/leonardo/Apps');
type FeaturePrev = typeof import('src/libs/feature-previews');
jest.mock(
  'src/libs/feature-previews',
  (): FeaturePrev => ({
    ...jest.requireActual('src/libs/feature-previews'),
    isFeaturePreviewEnabled: jest.fn(),
  })
);

type AjaxContract = ReturnType<typeof Ajax>;

function createAppV2Func() {
  const createFunc = jest.fn();
  asMockedFn(Ajax).mockImplementation(
    () =>
      ({
        Apps: {
          ...defaultAjaxImpl,
          createAppV2: createFunc,
        },
        Metrics: { captureEvent: jest.fn() } as Partial<AjaxContract['Metrics']>,
      } as Partial<AjaxContract> as AjaxContract)
  );
  return createFunc;
}

describe('CromwellModal', () => {
  it('Renders correctly by default', () => {
    // Act
    render(h(CromwellModal, defaultCromwellProps));
    // Assert
    screen.getByText('Cromwell Cloud Environment');
    screen.getByText('Create');
  });

  it('Use new CROMWELL_RUNNER app when feature flag is enabled', async () => {
    // Arrange
    const user = userEvent.setup();
    const createFunc = createAppV2Func();
    asMockedFn(isFeaturePreviewEnabled).mockImplementation((key) => {
      return key === ENABLE_AZURE_COLLABORATIVE_WORKFLOW_RUNNERS;
    });

    // Act
    render(h(CromwellModal, defaultCromwellRunnerAppProps));

    const createButton = screen.getByText('Create');
    await user.click(createButton);

    expect(createFunc).toHaveBeenCalledWith(
      expect.anything(),
      defaultAzureWorkspace.workspace.workspaceId,
      appToolLabels.CROMWELL_RUNNER_APP,
      appAccessScopes.USER_PRIVATE
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('Prevent creation of CROMWELL_RUNNER app in CROMWELL_RUNNER modal when feature flag is not enabled', async () => {
    // Arrange
    const user = userEvent.setup();

    const createFunc = createAppV2Func();
    asMockedFn(isFeaturePreviewEnabled).mockImplementation(() => {
      return false;
    });

    // Act
    render(h(CromwellModal, defaultCromwellRunnerAppProps));

    const createButton = screen.getByText('Create');
    await user.click(createButton);

    expect(createFunc).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
