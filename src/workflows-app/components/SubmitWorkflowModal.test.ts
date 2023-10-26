import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { appAccessScopes, appToolLabels } from 'src/analysis/utils/tool-utils';
import { Ajax } from 'src/libs/ajax';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { ENABLE_AZURE_COLLABORATIVE_WORKFLOW_READERS } from 'src/libs/feature-previews-config';
import { getTerraUser, workflowsAppStore } from 'src/libs/state';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { SubmitWorkflowModal } from 'src/workflows-app/components/SubmitWorkflowModal';
import { methodDataWithVersions } from 'src/workflows-app/utils/mock-data';
import {
  mockAzureWorkspace,
  mockCromwellApp,
  mockCromwellRunner,
  mockWdsApp,
  mockWorkflowsApp,
  runSetInputDef,
  runSetOutputDefFilled,
} from 'src/workflows-app/utils/mock-responses';

jest.mock('src/libs/ajax');

type AjaxContract = ReturnType<typeof Ajax>;

jest.mock('src/libs/notifications.js');

jest.mock('src/libs/nav', () => ({
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  goToPath: jest.fn(),
}));

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getTerraUser: jest.fn().mockReturnValue({ id: 'foo' }),
}));

jest.mock('src/libs/utils', () => ({
  ...jest.requireActual('src/libs/utils'),
  poll: jest.fn(async (fn) => {
    // remove delay
    while (true) {
      const r = await fn();
      if (!r.shouldContinue) {
        return r.result;
      }
    }
  }),
}));

jest.mock('src/libs/ajax/metrics/useMetrics', () => ({
  ...jest.requireActual('src/libs/ajax/metrics/useMetrics'),
  useMetricsEvent: jest.fn(() => ({ captureEvent: jest.fn() })),
}));

jest.mock('src/libs/feature-previews', () => ({
  ...jest.requireActual('src/libs/feature-previews'),
  isFeaturePreviewEnabled: jest.fn(),
}));

const baseSubmitModalProps = {
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
};

const submitModalPropsReader = {
  ...baseSubmitModalProps,
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

describe('SubmitWorkflowModal', () => {
  const testCases: Array<{
    featureFlagEnabled: boolean;
    role: 'CREATOR' | 'WRITER' | 'READER';
    canSubmit: boolean;
    cromwellRunnerStates: Array<'NONE' | 'RUNNING' | 'PROVISIONING'>;
  }> = [
    {
      featureFlagEnabled: false,
      role: 'CREATOR',
      canSubmit: true,
      cromwellRunnerStates: [],
    },
    {
      featureFlagEnabled: false,
      role: 'WRITER',
      canSubmit: false,
      cromwellRunnerStates: [],
    },
    {
      featureFlagEnabled: false,
      role: 'READER',
      canSubmit: false,
      cromwellRunnerStates: [],
    },
    {
      featureFlagEnabled: true,
      role: 'CREATOR',
      canSubmit: true,
      cromwellRunnerStates: ['RUNNING'],
    },
    {
      featureFlagEnabled: true,
      role: 'WRITER',
      canSubmit: true,
      cromwellRunnerStates: ['RUNNING'],
    },
    {
      featureFlagEnabled: true,
      role: 'READER',
      canSubmit: false,
      cromwellRunnerStates: [],
    },
    {
      featureFlagEnabled: true,
      role: 'CREATOR',
      canSubmit: true,
      cromwellRunnerStates: ['PROVISIONING', 'RUNNING'],
    },
    {
      featureFlagEnabled: true,
      role: 'WRITER',
      canSubmit: true,
      cromwellRunnerStates: ['PROVISIONING', 'RUNNING'],
    },
    {
      featureFlagEnabled: true,
      role: 'READER',
      canSubmit: false,
      cromwellRunnerStates: [],
    },
    {
      featureFlagEnabled: true,
      role: 'CREATOR',
      canSubmit: true,
      cromwellRunnerStates: ['NONE', 'PROVISIONING', 'RUNNING'],
    },
    {
      featureFlagEnabled: true,
      role: 'WRITER',
      canSubmit: true,
      cromwellRunnerStates: ['NONE', 'PROVISIONING', 'PROVISIONING', 'RUNNING'],
    },
    {
      featureFlagEnabled: true,
      role: 'READER',
      canSubmit: false,
      cromwellRunnerStates: [],
    },
  ];

  it.each(
    testCases.map((testCase) => ({
      ...testCase,
      testName: `should ${testCase.canSubmit ? '' : 'not '}be able to submit as workspace ${testCase.role}, ${
        testCase.featureFlagEnabled ? 'with' : 'without'
      } feature flag enabled, and initial cromwell runner status ${testCase.cromwellRunnerStates[0]}`,
    }))
  )('$testName', async ({ featureFlagEnabled, role, canSubmit, cromwellRunnerStates }) => {
    // ** ARRANGE **
    workflowsAppStore.reset();
    asMockedFn(isFeaturePreviewEnabled).mockImplementation(
      (id) => featureFlagEnabled && id === ENABLE_AZURE_COLLABORATIVE_WORKFLOW_READERS
    );
    const userEmail = role === 'CREATOR' ? 'groot@gmail.com' : 'not-groot@gmail.com';
    const appToSubmitTo = featureFlagEnabled ? mockWorkflowsApp : mockCromwellApp;
    asMockedFn(getTerraUser).mockReturnValue({ email: userEmail });

    const user = userEvent.setup();
    const postRunSetFunction = jest.fn();
    const createAppV2 = jest.fn();
    const listAppsV2 = cromwellRunnerStates.reduce(
      (prev, current) =>
        prev.mockImplementationOnce(() =>
          Promise.resolve([
            mockWdsApp,
            appToSubmitTo,
            ...(current !== 'NONE' ? [mockCromwellRunner(current, userEmail)] : []),
          ])
        ),
      jest.fn(() => Promise.resolve([appToSubmitTo, mockWdsApp]))
    );

    asMockedFn<() => DeepPartial<AjaxContract>>(Ajax).mockImplementation(() => {
      return {
        Apps: {
          createAppV2,
          listAppsV2,
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
      render(h(SubmitWorkflowModal, role === 'READER' ? submitModalPropsReader : baseSubmitModalProps))
    );

    // ** ASSERT **
    // Launch modal should be displayed
    const modalSubmitButton = screen.getByLabelText('Launch Submission');
    if (!canSubmit) {
      screen.getByText(/you do not have permission to run workflows/i);
      expect(modalSubmitButton).toHaveAttribute('disabled');
    } else {
      expect(modalSubmitButton).not.toHaveAttribute('disabled');
    }

    // ** ACT **
    // user click on Submit button
    await user.click(modalSubmitButton);

    // ** ASSERT **
    if (canSubmit) {
      if (cromwellRunnerStates[0] === 'NONE') {
        expect(createAppV2).toHaveBeenCalledWith(
          expect.anything(),
          mockAzureWorkspace.workspace.workspaceId,
          appToolLabels.CROMWELL_RUNNER_APP,
          appAccessScopes.USER_PRIVATE
        );
      } else {
        expect(createAppV2).not.toHaveBeenCalled();
      }
      if (featureFlagEnabled) {
        expect(listAppsV2).toHaveBeenCalledTimes(cromwellRunnerStates.length + 1); // + 1 to get proxy urls
      } else {
        expect(listAppsV2).toHaveBeenCalledTimes(2); // 1 to get proxy urls, 1 to check Cromwell vs cromwell runner
      }
      expect(postRunSetFunction).toHaveBeenCalledWith(appToSubmitTo.proxyUrls.cbas, postRunSetPayload);
    } else {
      expect(createAppV2).not.toHaveBeenCalled();
      expect(listAppsV2).not.toHaveBeenCalled();
      expect(postRunSetFunction).not.toHaveBeenCalled();
    }
  });
});
