import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Apps, AppsAjaxContract } from 'src/libs/ajax/leonardo/Apps';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace } from 'src/testing/workspace-fixtures';

import { appAccessScopes, appToolLabels } from '../utils/tool-utils';
import { CromwellModal } from './CromwellModal';

const onSuccess = jest.fn();

const defaultAjaxImpl: AppsAjaxContract = {
  list: jest.fn(),
  listWithoutProject: jest.fn(),
  app: jest.fn(),
  listAppsV2: jest.fn(),
  createAppV2: jest.fn(),
  deleteAppV2: jest.fn(),
  getAppV2: jest.fn(),
};

const defaultCromwellProps = {
  onDismiss: () => {},
  onError: () => {},
  onSuccess,
  apps: [],
  workspace: defaultAzureWorkspace,
  isOpen: true,
  onExited: () => {},
};

jest.mock('src/libs/ajax/leonardo/Apps');
jest.mock('src/libs/ajax/Metrics');

type FeaturePrev = typeof import('src/libs/feature-previews');
jest.mock(
  'src/libs/feature-previews',
  (): FeaturePrev => ({
    ...jest.requireActual('src/libs/feature-previews'),
    isFeaturePreviewEnabled: jest.fn(),
  })
);

function createAppV2Func() {
  const createFunc = jest.fn();
  asMockedFn(Apps).mockImplementation(
    (): AppsAjaxContract => ({
      ...defaultAjaxImpl,
      createAppV2: createFunc,
    })
  );
  asMockedFn(Metrics).mockImplementation(() => partial<MetricsContract>({ captureEvent: jest.fn() }));
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

  it('Use new WORKFLOW apps when feature flag is enabled', async () => {
    // Arrange
    const user = userEvent.setup();
    const createFunc = createAppV2Func();

    // Act
    render(h(CromwellModal, defaultCromwellProps));

    const createButton = screen.getByText('Create');
    await user.click(createButton);

    expect(createFunc).toHaveBeenCalledWith(
      expect.anything(),
      defaultAzureWorkspace.workspace.workspaceId,
      appToolLabels.WORKFLOWS_APP,
      appAccessScopes.WORKSPACE_SHARED
    );
    expect(createFunc).toHaveBeenCalledWith(
      expect.anything(),
      defaultAzureWorkspace.workspace.workspaceId,
      appToolLabels.CROMWELL_RUNNER_APP,
      appAccessScopes.USER_PRIVATE
    );
    expect(onSuccess).toHaveBeenCalled();
  });
});
