import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { appAccessScopes, appToolLabels } from 'src/analysis/utils/tool-utils';
import { Ajax } from 'src/libs/ajax';
import { getConfig } from 'src/libs/config';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_COLLABORATIVE_WORKFLOW_RUNNERS } from 'src/libs/feature-previews-config';
import { getTerraUser, workflowsAppStore } from 'src/libs/state';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { SubmitWorkflowModal } from 'src/workflows-app/components/SubmitWorkflowModal';
import { methodDataWithVersions } from 'src/workflows-app/utils/mock-data';
import {
  mockAzureApps,
  mockAzureWorkspace,
  mockCollaborativeAzureApps,
  mockCromwellRunner,
  runSetInputDef,
  runSetOutputDefFilled,
} from 'src/workflows-app/utils/mock-responses';

jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<typeof Ajax>;

jest.mock('src/libs/notifications.js');

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

jest.mock('src/libs/feature-previews', () => ({
  ...jest.requireActual('src/libs/feature-previews'),
  isFeaturePreviewEnabled: jest.fn(),
}));

jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  goToPath: jest.fn(),
}));

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: jest.fn().mockReturnValue({ id: 'foo' }),
}));

jest.mock('src/components/Modal', () => {
  const mockModal = jest.requireActual('src/components/Modal.mock');
  return mockModal.mockModalModule();
});

jest.mock('src/libs/ajax/metrics/useMetrics', () => ({
  ...jest.requireActual('src/libs/ajax/metrics/useMetrics'),
  useMetricsEvent: jest.fn(() => ({ captureEvent: jest.fn() })),
}));

const submitModalProps = {
  method: methodDataWithVersions.methods[0],
  methodVersion: methodDataWithVersions.methods[0].method_versions[0],
  recordType: 'FOO',
  selectedRecords: { FOO1: 'bar' },
  inputDefinition: runSetInputDef,
  outputDefinition: runSetOutputDefFilled,
  callCachingEnabled: true,
  onDismiss: jest.fn(),
  name: 'test-azure-ws-name',
  namespace: 'test-azure-ws-namespace',
  workspace: mockAzureWorkspace,
  apps: [],
  refreshApps: jest.fn().mockReturnValue(Promise.resolve()),
};

const submitModalPropsReader = {
  ...submitModalProps,
  workspace: {
    ...mockAzureWorkspace,
    canCompute: false,
  },
};

const postRunSetPayload = expect.objectContaining({
  method_version_id: methodDataWithVersions.methods[0].method_versions[0].method_version_id,
  workflow_input_definitions: runSetInputDef,
  workflow_output_definitions: runSetOutputDefFilled,
  wds_records: {
    record_type: 'FOO',
    record_ids: ['FOO1'],
  },
  call_caching_enabled: true,
});

describe('SubmitWorkflowModal submitting to cromwell', () => {
  beforeEach(() => {
    workflowsAppStore.reset();
    asMockedFn(getConfig).mockReturnValue({
      wdsUrlRoot: 'https://lz-abc/wds-abc-c07807929cd1/',
      cbasUrlRoot: 'https://lz-abc/terra-app-abc/cbas',
      cromwellUrlRoot: 'https://lz-abc/terra-app-abc/cromwell',
    });
    asMockedFn(isFeaturePreviewEnabled).mockImplementation((id) => id !== ENABLE_AZURE_COLLABORATIVE_WORKFLOW_RUNNERS);
  });

  it('should allow submit to cromwell by workspace creator', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const postRunSetFunction = jest.fn();
    const createAppV2 = jest.fn();
    asMockedFn(getTerraUser).mockReturnValue({ email: 'groot@gmail.com' });

    await asMockedFn<() => DeepPartial<AjaxContract>>(Ajax).mockImplementation(() => {
      return {
        Apps: {
          createAppV2,
        },
        Cbas: {
          runSets: {
            post: postRunSetFunction,
          },
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(SubmitWorkflowModal, {
          ...submitModalProps,
          apps: mockAzureApps,
        })
      )
    );

    // ** ASSERT **
    // Launch modal should be displayed
    const modalSubmitButton = screen.getByLabelText('Launch Submission');
    expect(modalSubmitButton).not.toHaveAttribute('disabled');

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    expect(createAppV2).not.toHaveBeenCalled();
    expect(postRunSetFunction).toHaveBeenCalledWith('https://lz-abc/terra-app-abc/cbas', postRunSetPayload);
  });

  it('should display error message for workspace non-creator', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const postRunSetFunction = jest.fn();
    const createAppV2 = jest.fn();
    asMockedFn(getTerraUser).mockReturnValue({ email: 'not-groot@gmail.com' });

    await asMockedFn<() => DeepPartial<AjaxContract>>(Ajax).mockImplementation(() => {
      return {
        Apps: {
          createAppV2,
        },
        Cbas: {
          runSets: {
            post: postRunSetFunction,
          },
        },
      };
    });

    // ** ACT **
    await act(async () => render(h(SubmitWorkflowModal, submitModalProps)));

    // ** ASSERT **
    // Launch modal should be displayed, but user is workspace reader and cannot submit
    screen.getByText('Send submission');
    screen.getByText(/you do not have permission to run workflows/i);
    const modalSubmitButton = screen.getByLabelText('Launch Submission');
    expect(modalSubmitButton).toHaveAttribute('disabled');

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    // assert no post requests made
    expect(createAppV2).not.toHaveBeenCalled();
    expect(postRunSetFunction).not.toHaveBeenCalled();
  });
});

describe('SubmitWorkflowModal submitting to workflows app', () => {
  beforeEach(() => {
    workflowsAppStore.reset();
    asMockedFn(getConfig).mockReturnValue({
      wdsUrlRoot: 'https://lz-abc/wds-abc-c07807929cd1/',
      cbasUrlRoot: 'https://lz-abc/terra-app-wfa-abc/cbas',
      cromwellUrlRoot: 'https://lz-abc/terra-app-abc/cromwell',
    });
    asMockedFn(isFeaturePreviewEnabled).mockImplementation((id) => id === ENABLE_AZURE_COLLABORATIVE_WORKFLOW_RUNNERS);
  });

  it('should display error message for workspace reader', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const postRunSetFunction = jest.fn();
    const createAppV2 = jest.fn();
    asMockedFn(getTerraUser).mockReturnValue({ email: 'not-groot@gmail.com' });

    await asMockedFn<() => DeepPartial<AjaxContract>>(Ajax).mockImplementation(() => {
      return {
        Apps: {
          createAppV2,
        },
        Cbas: {
          runSets: {
            post: postRunSetFunction,
          },
        },
      };
    });

    // ** ACT **
    await act(async () => render(h(SubmitWorkflowModal, submitModalPropsReader)));

    // ** ASSERT **
    // Launch modal should be displayed, but user is workspace reader and cannot submit
    screen.getByText('Send submission');
    screen.getByText(/you do not have permission to run workflows/i);
    const modalSubmitButton = screen.getByLabelText('Launch Submission');
    expect(modalSubmitButton).toHaveAttribute('disabled');

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    // assert no post requests made
    expect(createAppV2).not.toHaveBeenCalled();
    expect(postRunSetFunction).not.toHaveBeenCalled();
  });

  it('should display info message for workspace writer with no cromwell runner', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const postRunSetFunction = jest.fn();
    const createAppV2 = jest.fn();
    asMockedFn(getTerraUser).mockReturnValue({ email: 'not-groot@gmail.com' });

    await asMockedFn<() => DeepPartial<AjaxContract>>(Ajax).mockImplementation(() => {
      return {
        Apps: {
          createAppV2,
        },
        Cbas: {
          runSets: {
            post: postRunSetFunction,
          },
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(SubmitWorkflowModal, {
          ...submitModalProps,
          apps: mockCollaborativeAzureApps, // the cromwell-runner belongs to groot
        })
      )
    );

    // ** ASSERT **
    // Launch modal should be displayed, but user needs to launch a cromwell runner
    screen.getByText('Send submission');
    screen.getByText(/By clicking submit, Cromwell Runner/i);
    const modalSubmitButton = screen.getByLabelText('Launch Submission');
    expect(modalSubmitButton).not.toHaveAttribute('disabled');

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    // assert create app post request made
    expect(createAppV2).toHaveBeenCalledWith(
      expect.anything(),
      mockAzureWorkspace.workspace.workspaceId,
      appToolLabels.CROMWELL_RUNNER_APP,
      appAccessScopes.USER_PRIVATE
    );
    expect(postRunSetFunction).not.toHaveBeenCalled();
  });

  it('should display loading for workspace user with provisioning cromwell runner', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const postRunSetFunction = jest.fn();
    const createAppV2 = jest.fn();
    asMockedFn(getTerraUser).mockReturnValue({ email: 'groot@gmail.com' });

    await asMockedFn<() => DeepPartial<AjaxContract>>(Ajax).mockImplementation(() => {
      return {
        Apps: {
          createAppV2,
        },
        Cbas: {
          runSets: {
            post: postRunSetFunction,
          },
        },
      };
    });

    // ** ACT **
    const { rerender } = await act(async () =>
      render(
        h(SubmitWorkflowModal, {
          ...submitModalProps,
          apps: [mockCromwellRunner('PROVISIONING')],
        })
      )
    );

    // ** ASSERT **
    // Launch modal should be displayed, but cromwell runner is provisioning
    screen.getByText(/Creating/i);
    const modalSubmitButton = screen.getByLabelText('Launch Submission');
    expect(modalSubmitButton).not.toHaveAttribute('disabled');

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    // assert no post request made
    expect(createAppV2).not.toHaveBeenCalled();
    expect(postRunSetFunction).not.toHaveBeenCalled();

    // ** ACT **
    // Cromwell runner has now provisioned
    await act(async () =>
      rerender(
        h(SubmitWorkflowModal, {
          ...submitModalProps,
          apps: [mockCromwellRunner('RUNNING')],
        })
      )
    );

    // ** ASSERT **
    expect(createAppV2).not.toHaveBeenCalled();
    expect(postRunSetFunction).toHaveBeenCalledWith('https://lz-abc/terra-app-wfa-abc/cbas', postRunSetPayload);
  });

  it('should allow direct submit for workspace user with running cromwell runner', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const postRunSetFunction = jest.fn();
    const createAppV2 = jest.fn();
    asMockedFn(getTerraUser).mockReturnValue({ email: 'groot@gmail.com' });

    await asMockedFn<() => DeepPartial<AjaxContract>>(Ajax).mockImplementation(() => {
      return {
        Apps: {
          createAppV2,
        },
        Cbas: {
          runSets: {
            post: postRunSetFunction,
          },
        },
      };
    });

    // ** ACT **
    await act(async () =>
      render(
        h(SubmitWorkflowModal, {
          ...submitModalProps,
          apps: mockCollaborativeAzureApps,
        })
      )
    );

    // ** ASSERT **
    // Launch modal should be displayed, user already has a running cromwell runner
    screen.getByText('Send submission');
    const modalSubmitButton = screen.getByLabelText('Launch Submission');
    expect(modalSubmitButton).not.toHaveAttribute('disabled');

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    // assert no post request made
    expect(createAppV2).not.toHaveBeenCalled();
    expect(postRunSetFunction).toHaveBeenCalledWith('https://lz-abc/terra-app-wfa-abc/cbas', postRunSetPayload);
  });
});
