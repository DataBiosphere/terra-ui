import { delay } from '@terra-ui-packages/core-utils';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent, { UserEvent } from '@testing-library/user-event';
import _ from 'lodash/fp';
import React from 'react';
import * as breadcrumbs from 'src/components/breadcrumbs';
import { Ajax, AjaxContract } from 'src/libs/ajax';
import { MethodsAjaxContract } from 'src/libs/ajax/methods/Methods';
import * as ExportWorkflowToWorkspaceProvider from 'src/libs/ajax/workspaces/providers/ExportWorkflowToWorkspaceProvider';
import { errorWatcher } from 'src/libs/error.mock';
import { goToPath } from 'src/libs/nav';
import { forwardRefWithName } from 'src/libs/react-utils';
import { snapshotsListStore, snapshotStore, TerraUser, TerraUserState, userStore } from 'src/libs/state';
import { WorkflowsContainer, wrapWorkflows } from 'src/pages/workflows/workflow/WorkflowWrapper';
import { Snapshot } from 'src/snapshots/Snapshot';
import { asMockedFn, partial, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { AzureContext, WorkspaceInfo, WorkspaceWrapper } from 'src/workspaces/utils';

jest.mock('src/libs/ajax');
jest.mock('src/libs/notifications');

type NavExports = typeof import('src/libs/nav');

jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    getLink: jest.fn((name, pathParams?) =>
      name === 'workflow-dashboard' ? `#workflows/${pathParams!.namespace}/${pathParams!.name}` : `#${name}`
    ),
    goToPath: jest.fn(),
  })
);

const mockSnapshot: Snapshot = {
  managers: ['hello@world.org'],
  name: 'testname',
  createDate: '2024-09-04T15:37:57Z',
  documentation: '',
  entityType: 'Workflow',
  snapshotComment: '',
  snapshotId: 1,
  namespace: 'testnamespace',
  payload:
    // eslint-disable-next-line no-template-curly-in-string
    'task echo_files {\\n  String? input1\\n  String? input2\\n  String? input3\\n  \\n  output {\\n    String out = read_string(stdout())\\n  }\\n\\n  command {\\n    echo \\"result: ${input1} ${input2} ${input3}\\"\\n  }\\n\\n  runtime {\\n    docker: \\"ubuntu:latest\\"\\n  }\\n}\\n\\nworkflow echo_strings {\\n  call echo_files\\n}',
  url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/methods/sschu/echo-strings-test/1',
  public: true,
  synopsis: '',
};

const mockSnapshotWithAdditionalOwners: Snapshot = {
  managers: ['hello@world.org', 'new@owner.com'],
  name: 'testname',
  createDate: '2024-09-04T15:37:57Z',
  documentation: '',
  entityType: 'Workflow',
  snapshotComment: '',
  snapshotId: 1,
  namespace: 'testnamespace',
  payload:
    // eslint-disable-next-line no-template-curly-in-string
    'task echo_files {\\n  String? input1\\n  String? input2\\n  String? input3\\n  \\n  output {\\n    String out = read_string(stdout())\\n  }\\n\\n  command {\\n    echo \\"result: ${input1} ${input2} ${input3}\\"\\n  }\\n\\n  runtime {\\n    docker: \\"ubuntu:latest\\"\\n  }\\n}\\n\\nworkflow echo_strings {\\n  call echo_files\\n}',
  url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/methods/sschu/echo-strings-test/1',
  public: false,
  synopsis: '',
};

const mockDeleteSnapshot: Snapshot = {
  managers: ['revali@gale.com', 'hello@WORLD.org', 'sam@i.am'],
  name: 'testname',
  createDate: '2024-09-04T15:37:57Z',
  documentation: '',
  entityType: 'Workflow',
  snapshotComment: '',
  snapshotId: 3,
  namespace: 'methodnamespace',
  payload:
    // eslint-disable-next-line no-template-curly-in-string
    'task echo_files {\\n  String? input1\\n  String? input2\\n  String? input3\\n  \\n  output {\\n    String out = read_string(stdout())\\n  }\\n\\n  command {\\n    echo \\"result: ${input1} ${input2} ${input3}\\"\\n  }\\n\\n  runtime {\\n    docker: \\"ubuntu:latest\\"\\n  }\\n}\\n\\nworkflow echo_strings {\\n  call echo_files\\n}',
  url: 'http://agora.dsde-dev.broadinstitute.org/api/v1/methods/sschu/echo-strings-test/1',
  public: true,
  synopsis: '',
};

const mockPermissions = [
  {
    role: 'OWNER',
    user: 'user1@foo.com',
  },
  {
    role: 'READER',
    user: 'user2@bar.com',
  },
];

type ErrorExports = typeof import('src/libs/error');
jest.mock('src/libs/error', (): ErrorExports => {
  const errorModule = jest.requireActual('src/libs/error');
  const mockErrorModule = jest.requireActual('src/libs/error.mock');
  return {
    ...errorModule,
    withErrorReporting: mockErrorModule.mockWithErrorReporting,
  };
});

type ListAjaxContract = MethodsAjaxContract['list'];
type MethodAjaxContract = MethodsAjaxContract['method'];

interface AjaxMocks {
  listImpl?: jest.Mock<Promise<Snapshot[]>>;
  getImpl?: jest.Mock<Promise<Snapshot>, []>;
  deleteImpl?: jest.Mock;
}

const defaultListImpl = jest.fn();
const defaultGetImpl = (namespace) =>
  jest.fn().mockResolvedValue(namespace === 'testnamespace' ? mockSnapshot : mockDeleteSnapshot);
const defaultDeleteImpl = jest.fn();
const setPermissionsMock = jest.fn();

const mockAjax = (mocks: AjaxMocks = {}) => {
  const { listImpl, getImpl, deleteImpl } = mocks;
  asMockedFn(Ajax).mockReturnValue({
    Methods: {
      list: (listImpl || defaultListImpl) as ListAjaxContract,
      method: jest.fn((namespace, name, snapshotId) => {
        return partial<ReturnType<MethodAjaxContract>>({
          get: getImpl || defaultGetImpl(namespace),
          delete: deleteImpl || defaultDeleteImpl,
          permissions: jest.fn().mockResolvedValue(mockPermissions),
          setPermissions: () => setPermissionsMock(namespace, name, snapshotId),
        });
      }) as MethodAjaxContract,
    } as MethodsAjaxContract,
  } as AjaxContract);
};

type UseWorkspacesExports = typeof import('src/workspaces/common/state/useWorkspaces');
jest.mock('src/workspaces/common/state/useWorkspaces', (): UseWorkspacesExports => {
  return {
    ...jest.requireActual<UseWorkspacesExports>('src/workspaces/common/state/useWorkspaces'),
    useWorkspaces: jest.fn(),
  };
});

const mockUseWorkspaces = (workspaces: WorkspaceWrapper[]) => {
  asMockedFn(useWorkspaces).mockReturnValue({
    workspaces,
    loading: false,
    refresh: jest.fn(),
    status: 'Ready',
  });
};

const mockUser = (email: string): Partial<TerraUser> => ({ email });

const mockUserState = (email: string): Partial<TerraUserState> => {
  return { terraUser: mockUser(email) as TerraUser };
};

const MockWrappedWorkflowComponent = _.flow(
  forwardRefWithName('MockWrappedWorkflowComponent'),
  wrapWorkflows({
    breadcrumbs: () => breadcrumbs.commonPaths.workflowList(),
    title: 'Methods',
    activeTab: 'dashboard',
  })
)(() => {
  return 'children';
});

const mockWorkspace: WorkspaceInfo = {
  workspaceId: 'Workspace1',
  name: 'name1',
  namespace: 'namespace',
  cloudPlatform: 'Gcp',
  googleProject: 'project',
  billingAccount: 'account',
  bucketName: 'bucket',
  authorizationDomain: [],
  createdDate: '2023-02-15T19:17:15.711Z',
  createdBy: 'groot@gmail.com',
  lastModified: '2023-03-15T19:17:15.711Z',
};

const mockWorkspaces: Partial<WorkspaceWrapper>[] = [
  {
    workspace: mockWorkspace,
    accessLevel: 'WRITER',
  },
  {
    workspace: {
      workspaceId: 'Workspace2',
      name: 'name2',
      namespace: 'namespace',
      cloudPlatform: 'Gcp',
      googleProject: 'project',
      billingAccount: 'account',
      bucketName: 'bucket',
      authorizationDomain: [],
      createdDate: '2023-02-15T19:17:15.711Z',
      createdBy: 'groot@gmail.com',
      lastModified: '2023-03-15T19:17:15.711Z',
    },
    accessLevel: 'OWNER',
  },
  {
    workspace: {
      workspaceId: 'Workspace3',
      name: 'name3',
      namespace: 'namespace',
      cloudPlatform: 'Gcp',
      googleProject: 'project',
      billingAccount: 'account',
      bucketName: 'bucket',
      authorizationDomain: [],
      createdDate: '2023-02-15T19:17:15.711Z',
      createdBy: 'groot@gmail.com',
      lastModified: '2023-03-15T19:17:15.711Z',
    },
    accessLevel: 'READER',
  },
  {
    workspace: {
      workspaceId: 'Workspace4',
      name: 'name4',
      namespace: 'namespace',
      cloudPlatform: 'Azure',
      authorizationDomain: [],
      createdDate: '2023-02-15T19:17:15.711Z',
      createdBy: 'groot@gmail.com',
      lastModified: '2023-03-15T19:17:15.711Z',
    },
    azureContext: {} as AzureContext,
    accessLevel: 'PROJECT_OWNER',
  },
];

const snapshotStoreInitialValue = {
  createDate: '',
  entityType: '',
  managers: [],
  name: '',
  namespace: '',
  payload: '',
  public: undefined,
  snapshotComment: '',
  snapshotId: 0,
  synopsis: '',
  url: '',
};

describe('workflow wrapper', () => {
  it('displays the method not found page if a method does not exist or the user does not have access', async () => {
    // Arrange
    mockAjax({ listImpl: jest.fn().mockResolvedValue([]) });

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hello@world.org')));

    // Act
    await act(async () => {
      render(
        <MockWrappedWorkflowComponent
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    // Assert

    // should not display the loading spinner
    const spinner = document.querySelector('[data-icon="loadingSpinner"]');
    expect(spinner).not.toBeInTheDocument();

    // should not display an error toast
    expect(errorWatcher).not.toHaveBeenCalled();

    // should not display the tab bar or children
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/wdl/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/snapshot:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(`${mockSnapshot.snapshotId}`)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /export to workspace/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Snapshot action menu' })).not.toBeInTheDocument();
    expect(screen.queryByText('children')).not.toBeInTheDocument();

    // should only display the 404 error page, with the correct info filled in
    expect(screen.getByText('Could not display method')).toBeInTheDocument();
    expect(
      screen.getByText(
        'You cannot access this method because either it does not exist or you do not have access to it.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('hello@world.org')).toBeInTheDocument();
    expect(
      screen.getByText(
        'To view a snapshot of an existing method, an owner of the snapshot must give you permission to view it or make it publicly readable.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('The method may also have been deleted by one of its owners.')).toBeInTheDocument();

    const returnToMethodsListButton = screen.getByRole('link', { name: 'Return to Methods List' });
    expect(returnToMethodsListButton).toBeInTheDocument();
    expect(returnToMethodsListButton).toHaveAttribute('href', '#workflows');
  });

  it('displays an error toast when there is an unexpected error loading a method', async () => {
    // Arrange
    mockAjax({
      listImpl: jest.fn(() => {
        throw new Error('BOOM');
      }),
    });

    // Act
    await act(async () => {
      render(
        <MockWrappedWorkflowComponent
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    // Assert

    // should not display the loading spinner
    const spinner = document.querySelector('[data-icon="loadingSpinner"]');
    expect(spinner).not.toBeInTheDocument();

    // should not display the tab bar or children
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/wdl/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/snapshot:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(`${mockSnapshot.snapshotId}`)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /export to workspace/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Snapshot action menu' })).not.toBeInTheDocument();
    expect(screen.queryByText('children')).not.toBeInTheDocument();

    // should not display the 404 error page
    expect(screen.queryByText('Could not display method')).not.toBeInTheDocument();
    expect(screen.queryByText('Could not display snapshot')).not.toBeInTheDocument();

    // should only display an error toast
    expect(errorWatcher).toHaveBeenCalledWith('Error loading method', expect.anything());
  });
});

describe('workflows container', () => {
  // Keep this test first to avoid potential issues with Jest and stores
  it('performs the correct non-visual operations when a snapshot deletion is confirmed', async () => {
    // Arrange
    mockAjax();

    jest.spyOn(window.history, 'replaceState');

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hello@world.org')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockDeleteSnapshot.namespace}
          name={mockDeleteSnapshot.name}
          snapshotId={`${mockDeleteSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Delete snapshot' })); // open modal
    await user.click(screen.getByRole('button', { name: 'Delete snapshot' })); // confirm deletion

    // Assert

    // The first call is to load the snapshot; the second is to delete it
    expect(Ajax().Methods.method).toHaveBeenNthCalledWith(
      2,
      mockDeleteSnapshot.namespace,
      mockDeleteSnapshot.name,
      mockDeleteSnapshot.snapshotId
    );

    expect(
      Ajax().Methods.method(mockDeleteSnapshot.namespace, mockDeleteSnapshot.name, mockDeleteSnapshot.snapshotId).delete
    ).toHaveBeenCalled();

    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '#workflows/methodnamespace/testname');

    expect(snapshotStore.get()).toEqual(snapshotStoreInitialValue);

    expect(snapshotsListStore.get()).toBeUndefined();

    expect(goToPath).toHaveBeenCalledWith('workflows');
  });

  it('hides the delete snapshot modal and displays a loading spinner when the deletion is confirmed', async () => {
    // Arrange
    mockAjax({
      deleteImpl: jest.fn(async () => {
        await delay(100);
      }),
    });

    // ensure that an additional loading spinner does not appear due to the
    // snapshot store being reset, so that we can test only the spinner that
    // should appear while the delete snapshot operation is being performed
    jest.spyOn(snapshotStore, 'reset').mockImplementation(_.noop);

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hello@world.org')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockDeleteSnapshot.namespace}
          name={mockDeleteSnapshot.name}
          snapshotId={`${mockDeleteSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Delete snapshot' })); // open modal
    await user.click(screen.getByRole('button', { name: 'Delete snapshot' })); // confirm deletion

    // Assert
    const dialog = screen.queryByRole('dialog', { name: /delete snapshot/i });
    const spinner = document.querySelector('[data-icon="loadingSpinner"]');

    expect(dialog).not.toBeInTheDocument();
    expect(spinner).toBeInTheDocument();
  });

  it('renders the delete snapshot modal when the corresponding button is pressed if the user is a snapshot owner', async () => {
    // Arrange
    mockAjax();

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hElLo@world.org')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockDeleteSnapshot.namespace}
          name={mockDeleteSnapshot.name}
          snapshotId={`${mockDeleteSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Delete snapshot' }));

    // Assert
    const dialog = screen.getByRole('dialog', { name: /delete snapshot/i });

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('methodnamespace', { exact: false })).toBeInTheDocument();
    expect(within(dialog).getByText('testname', { exact: false })).toBeInTheDocument();
    expect(within(dialog).getByText('3', { exact: false })).toBeInTheDocument();
  });

  it('only allows the delete snapshot modal to be opened if the user is a snapshot owner', async () => {
    // Arrange
    mockAjax();

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hello2@world.org')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockDeleteSnapshot.namespace}
          name={mockDeleteSnapshot.name}
          snapshotId={`${mockDeleteSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Delete snapshot' }));

    // Assert
    const dialog = screen.queryByRole('dialog', { name: /delete snapshot/i });

    expect(dialog).not.toBeInTheDocument();
  });

  it('hides the delete snapshot modal when it is dismissed', async () => {
    // Arrange
    mockAjax();

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hello@world.org')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockDeleteSnapshot.namespace}
          name={mockDeleteSnapshot.name}
          snapshotId={`${mockDeleteSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Delete snapshot' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    const dialog = screen.queryByRole('dialog', { name: /delete snapshot/i });

    expect(dialog).not.toBeInTheDocument();
  });

  it('displays an error message when there is an error deleting a snapshot', async () => {
    // Arrange
    mockAjax({
      deleteImpl: jest.fn(() => {
        throw new Error('BOOM');
      }),
    });

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hello@world.org')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockDeleteSnapshot.namespace}
          name={mockDeleteSnapshot.name}
          snapshotId={`${mockDeleteSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Delete snapshot' })); // open modal
    await user.click(screen.getByRole('button', { name: 'Delete snapshot' })); // confirm deletion

    // Assert
    expect(errorWatcher).toHaveBeenCalledWith('Error deleting snapshot', expect.anything());
  });

  it('displays the snapshot not found page if a snapshot does not exist or the user does not have access', async () => {
    // Arrange
    mockAjax({ getImpl: jest.fn().mockRejectedValue(new Response('{ "message": "Not found"}', { status: 404 })) });

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hello@world.org')));

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        >
          children
        </WorkflowsContainer>
      );
    });

    // Assert

    // should not display the loading spinner
    const spinner = document.querySelector('[data-icon="loadingSpinner"]');
    expect(spinner).not.toBeInTheDocument();

    // should not display the children
    expect(screen.queryByText('children')).not.toBeInTheDocument();

    // should not display an error toast
    expect(errorWatcher).not.toHaveBeenCalled();

    // should display the tab bar, but with the export button and action menu disabled
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/wdl/i)).toBeInTheDocument();
    expect(screen.getByText(/snapshot:/i)).toBeInTheDocument();
    expect(screen.getByText(`${mockSnapshot.snapshotId}`)).toBeInTheDocument();

    const exportButton = screen.getByRole('button', { name: /export to workspace/i });
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).toHaveAttribute('disabled');
    expect(exportButton).toHaveAttribute('aria-disabled');

    const actionMenu = screen.getByRole('button', { name: 'Snapshot action menu' });
    expect(actionMenu).toBeInTheDocument();
    expect(actionMenu).toHaveAttribute('disabled');
    expect(actionMenu).toHaveAttribute('aria-disabled');

    // should display the 404 error page, with the correct info filled in
    expect(screen.getByText('Could not display snapshot')).toBeInTheDocument();
    expect(
      screen.getByText(
        'You cannot access this method snapshot because either it does not exist or you do not have access to it.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('hello@world.org')).toBeInTheDocument();
    expect(
      screen.getByText(
        'To view an existing method snapshot, an owner of the snapshot must give you permission to view it or make it publicly readable.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('The snapshot may also have been deleted by one of its owners.')).toBeInTheDocument();
    expect(screen.getByText('Please select a different snapshot from the dropdown above.')).toBeInTheDocument();

    expect(screen.queryByRole('link', { name: 'Return to Methods List' })).not.toBeInTheDocument();
  });

  it('displays an error toast when there is an unexpected error loading a snapshot', async () => {
    // Arrange
    mockAjax({
      getImpl: jest.fn(() => {
        throw new Error('BOOM');
      }),
    });

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        >
          children
        </WorkflowsContainer>
      );
    });

    // Assert

    // should not display the loading spinner
    const spinner = document.querySelector('[data-icon="loadingSpinner"]');
    expect(spinner).not.toBeInTheDocument();

    // should not display the tab bar or children
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/wdl/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/snapshot:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(`${mockSnapshot.snapshotId}`)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /export to workspace/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Snapshot action menu' })).not.toBeInTheDocument();
    expect(screen.queryByText('children')).not.toBeInTheDocument();

    // should not display the 404 error page
    expect(screen.queryByText('Could not display method')).not.toBeInTheDocument();
    expect(screen.queryByText('Could not display snapshot')).not.toBeInTheDocument();

    // should only display an error toast
    expect(errorWatcher).toHaveBeenCalledWith('Error loading snapshot', expect.anything());
  });

  it('displays export to workspace modal when export button is pressed', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces([]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));

    // Assert
    const dialog = screen.getByRole('dialog', { name: /export to workspace/i });

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Export to Workspace')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Export' })).toBeInTheDocument();
  });

  it('hides export to workspace modal when it is dismissed', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces([]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    expect(screen.queryByRole('dialog', { name: /export to workspace/i })).not.toBeInTheDocument();
  });

  it('properly filters destination workspace options in export to workspace modal', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));

    // Assert
    const workspaceSelector = new SelectHelper(screen.getByRole('combobox', { name: 'Select a workspace' }), user);
    const workspaceOptions = await workspaceSelector.getOptions();

    // should display GCP workspace with WRITER access level and GCP workspace
    // with OWNER access level; should not display GCP workspace with READER
    // access level or Azure workspace
    expect(workspaceOptions).toEqual([expect.stringMatching('name1'), expect.stringMatching('name2')]);
  });

  it('uses the workflow name as the default name in the export to workspace modal', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));

    // Assert
    expect(screen.getByRole('textbox', { name: 'Name *' })).toHaveDisplayValue(mockSnapshot.name);
  });

  it('uses the correct export provider for the export to workspace modal', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    const exportWorkflowFromMethodsRepoProviderFactory = jest.spyOn(
      ExportWorkflowToWorkspaceProvider,
      'makeExportWorkflowFromMethodsRepoProvider'
    );

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));

    // Assert
    expect(exportWorkflowFromMethodsRepoProviderFactory).toHaveBeenCalledWith({
      methodNamespace: mockSnapshot.namespace,
      methodName: mockSnapshot.name,
      methodVersion: mockSnapshot.snapshotId,
    });
  });

  it('navigates to the correct location when viewing an exported workflow', async () => {
    // Arrange
    mockAjax();
    mockUseWorkspaces(mockWorkspaces as WorkspaceWrapper[]);

    // So that clicking the export button does not fail
    jest.spyOn(ExportWorkflowToWorkspaceProvider, 'makeExportWorkflowFromMethodsRepoProvider').mockReturnValue({
      export: () => Promise.resolve(),
    });

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Export to Workspace' }));

    const workspaceSelector = new SelectHelper(screen.getByRole('combobox', { name: 'Select a workspace' }), user);
    await workspaceSelector.selectOption('cloud_google_icon.svg name1');
    fireEvent.change(screen.getByRole('textbox', { name: 'Name *' }), { target: { value: 'newname' } });

    await user.click(screen.getByRole('button', { name: 'Export' }));
    await user.click(screen.getByRole('button', { name: /go to exported workflow/i }));

    // Assert
    expect(goToPath).toHaveBeenCalledWith('workflow', {
      namespace: mockWorkspace.namespace,
      name: mockWorkspace.name,
      workflowNamespace: mockSnapshot.namespace,
      workflowName: 'newname',
    });
  });

  it('renders edit permissions modal', async () => {
    // Arrange
    mockAjax();

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hElLo@world.org')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Edit snapshot permissions' }));

    // Assert
    expect(screen.getByText('Edit Snapshot Permissions'));
  });

  it('hides edit permissions modal when it is dismissed', async () => {
    // Arrange
    mockAjax();

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hElLo@world.org')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Edit snapshot permissions' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    // Assert
    expect(screen.queryByText('Edit Snapshot Permissions')).not.toBeInTheDocument();
  });

  it("allows the currently displayed snapshot's permissions to be edited", async () => {
    // Arrange
    mockAjax();

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hElLo@world.org')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Edit snapshot permissions' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Assert
    expect(setPermissionsMock).toHaveBeenCalledTimes(1);
    expect(setPermissionsMock).toHaveBeenCalledWith(mockSnapshot.namespace, mockSnapshot.name, mockSnapshot.snapshotId);
  });

  it('reloads the displayed snapshot after its permissions are edited', async () => {
    // Arrange
    mockAjax();

    // set the user's email
    jest.spyOn(userStore, 'get').mockImplementation(jest.fn().mockReturnValue(mockUserState('hElLo@world.org')));

    const user: UserEvent = userEvent.setup();

    // Act
    await act(async () => {
      render(
        <WorkflowsContainer
          namespace={mockSnapshot.namespace}
          name={mockSnapshot.name}
          snapshotId={`${mockSnapshot.snapshotId}`}
          tabName='dashboard'
        />
      );
    });

    await user.click(screen.getByRole('button', { name: 'Snapshot action menu' }));
    await user.click(screen.getByRole('button', { name: 'Edit snapshot permissions' }));

    // Simulate the snapshot being updated with new owners in the backend when
    // the save button is pressed
    mockAjax({
      getImpl: jest.fn().mockResolvedValue(mockSnapshotWithAdditionalOwners),
    });

    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Assert
    expect(snapshotStore.get().managers).toEqual(mockSnapshotWithAdditionalOwners.managers);
    expect(snapshotStore.get().public).toEqual(mockSnapshotWithAdditionalOwners.public);
  });
});
