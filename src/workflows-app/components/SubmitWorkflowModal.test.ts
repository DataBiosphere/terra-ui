import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { getConfig } from 'src/libs/config';
import { getTerraUser, workflowsAppStore } from 'src/libs/state';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { SubmitWorkflowModal } from 'src/workflows-app/components/SubmitWorkflowModal';
import { methodDataWithVersions } from 'src/workflows-app/utils/mock-data';
import {
  mockAzureApps,
  mockAzureWorkspace,
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
  appToUse: undefined,
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
  });

  it('should allow submit to cromwell by workspace creator', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const postRunSetFunction = jest.fn();
    asMockedFn(getTerraUser).mockReturnValue({ email: 'groot@gmail.com' });

    await asMockedFn<() => DeepPartial<AjaxContract>>(Ajax).mockImplementation(() => {
      return {
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
          appToUse: mockAzureApps[0],
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
    expect(postRunSetFunction).toHaveBeenCalledWith('https://lz-abc/terra-app-abc/cbas', postRunSetPayload);
  });

  it('should display error message for cromwell non-creator', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const postRunSetFunction = jest.fn();
    asMockedFn(getTerraUser).mockReturnValue({ email: 'not-groot@gmail.com' });

    await asMockedFn<() => DeepPartial<AjaxContract>>(Ajax).mockImplementation(() => {
      return {
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
  });

  it('should allow submit to workflows app by workflows app creator', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const postRunSetFunction = jest.fn();
    asMockedFn(getTerraUser).mockReturnValue({ email: 'groot@gmail.com' });

    await asMockedFn<() => DeepPartial<AjaxContract>>(Ajax).mockImplementation(() => {
      return {
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
          appToUse: mockAzureApps[0],
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
    expect(postRunSetFunction).toHaveBeenCalledWith('https://lz-abc/terra-app-wfa-abc/cbas', postRunSetPayload);
  });

  it('should display error message for workflows app non-creator', async () => {
    // ** ARRANGE **
    const user = userEvent.setup();
    const postRunSetFunction = jest.fn();
    asMockedFn(getTerraUser).mockReturnValue({ email: 'not-groot@gmail.com' });

    await asMockedFn<() => DeepPartial<AjaxContract>>(Ajax).mockImplementation(() => {
      return {
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
    expect(postRunSetFunction).not.toHaveBeenCalled();
  });
});
