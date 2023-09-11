import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { Cbas } from 'src/libs/ajax/workflows-app/Cbas';
import { goToPath } from 'src/libs/nav';
import { asMockedFn } from 'src/testing/test-utils';
import { methodDataWithVersions } from 'src/workflows-app/utils/mock-data';
import { mockAzureWorkspace } from 'src/workflows-app/utils/mock-responses';
import { WorkflowsInWorkspace } from 'src/workflows-app/WorkflowsInWorkspace';

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({
    wdsUrlRoot: 'https://lz-abc/wds-abc-c07807929cd1/',
    cbasUrlRoot: 'https://lz-abc/terra-app-abc/cbas',
    cromwellUrlRoot: 'https://lz-abc/terra-app-abc/cromwell',
  }),
}));

jest.mock('src/libs/ajax/workflows-app/Cbas', () => ({
  Cbas: jest.fn(),
}));

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  goToPath: jest.fn(),
}));

type CbasContract = ReturnType<typeof Cbas>;

describe('Workflows in workspace', () => {
  it('should render a message if no methods are in workspace', async () => {
    const getWithVersions = jest.fn().mockReturnValue(Promise.resolve({ methods: [] }));
    const mockGet: DeepPartial<CbasContract> = {
      methods: {
        getWithVersions,
      },
    };
    asMockedFn(Cbas).mockImplementation(() => mockGet as CbasContract);

    await act(() =>
      render(
        h(WorkflowsInWorkspace, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          analysesData: {
            apps: [],
            refreshApps: jest.fn().mockReturnValue(Promise.resolve()),
          },
        })
      )
    );

    expect(getWithVersions).toHaveBeenCalledTimes(1);

    expect(screen.getByText(/Get started:/i)).toBeInTheDocument();
  });

  it('should render workflow cards linked to submission config if methods are in workspace', async () => {
    const user = userEvent.setup();
    const getWithVersions = jest.fn().mockReturnValue(Promise.resolve(methodDataWithVersions));
    const mockGet: DeepPartial<CbasContract> = {
      methods: {
        getWithVersions,
      },
    };
    asMockedFn(Cbas).mockImplementation(() => mockGet as CbasContract);

    await act(() =>
      render(
        h(WorkflowsInWorkspace, {
          name: 'test-azure-ws-name',
          namespace: 'test-azure-ws-namespace',
          workspace: mockAzureWorkspace,
          analysesData: {
            apps: [],
            refreshApps: jest.fn().mockReturnValue(Promise.resolve()),
          },
        })
      )
    );

    screen.debug();

    expect(getWithVersions).toHaveBeenCalledTimes(1);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    expect(screen.getByText('Last run: (Never run)')).toBeInTheDocument();
    expect(screen.getByText('Source: Github')).toBeInTheDocument();
    expect(screen.getByText('Add description')).toBeInTheDocument();

    const configureButton = screen.getByRole('button', { name: 'Configure' });
    await user.click(configureButton);

    expect(goToPath).toHaveBeenCalledTimes(1);
    expect(goToPath).toHaveBeenCalledWith('workspace-workflows-app-submission-config', {
      methodId: methodDataWithVersions.methods[0].method_id,
      name: 'test-azure-ws-name',
      namespace: 'test-azure-ws-namespace',
    });
  });
});
