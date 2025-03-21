import { DeepPartial } from '@terra-ui-packages/core-utils';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash';
import { h } from 'react-hyperscript-helpers';
import { Billing, BillingContract } from 'src/libs/ajax/billing/Billing';
import { BillingProject } from 'src/libs/ajax/billing/billing-models';
import { GroupContract, Groups, GroupsContract } from 'src/libs/ajax/Groups';
import { Metrics, MetricsContract } from 'src/libs/ajax/Metrics';
import { getTerraUser } from 'src/libs/state';
import { asMockedFn, partial, renderWithAppContexts as render, SelectHelper } from 'src/testing/test-utils';
import { useWorkspaces } from 'src/workspaces/common/state/useWorkspaces';
import { WorkspaceWrapper } from 'src/workspaces/utils';

import { importDockstoreWorkflow } from './importDockstoreWorkflow';
import { ImportWorkflow } from './ImportWorkflow';
import { useDockstoreWdl } from './useDockstoreWdl';

jest.mock('src/libs/ajax/leonardo/Apps');
jest.mock('src/libs/ajax/billing/Billing');
jest.mock('src/libs/ajax/workflows-app/Cbas');
jest.mock('src/libs/ajax/Groups');
jest.mock('src/libs/ajax/Metrics');

type UseWorkspacesExports = typeof import('src/workspaces/common/state/useWorkspaces');
jest.mock('src/workspaces/common/state/useWorkspaces', (): UseWorkspacesExports => {
  return {
    ...jest.requireActual<UseWorkspacesExports>('src/workspaces/common/state/useWorkspaces'),
    useWorkspaces: jest.fn(),
  };
});

type ImportDockstoreWorkflowExports = typeof import('./importDockstoreWorkflow');
jest.mock(
  './importDockstoreWorkflow',
  (): ImportDockstoreWorkflowExports => ({
    importDockstoreWorkflow: jest.fn().mockResolvedValue(undefined),
  })
);

type FeaturePrev = typeof import('src/libs/feature-previews');
jest.mock(
  'src/libs/feature-previews',
  (): FeaturePrev => ({
    ...jest.requireActual('src/libs/feature-previews'),
    isFeaturePreviewEnabled: jest.fn(),
  })
);

type UseDockstoreWdlExports = typeof import('./useDockstoreWdl');
jest.mock(
  './useDockstoreWdl',
  (): UseDockstoreWdlExports => ({
    useDockstoreWdl: jest.fn().mockReturnValue({
      status: 'Ready',
      wdl: 'workflow TestWorkflow {}',
    }),
  })
);

type RuntimeCommonComponentsExports = typeof import('src/analysis/runtime-common-components.js');
jest.mock(
  'src/analysis/runtime-common-components.js',
  (): Partial<RuntimeCommonComponentsExports> => ({
    setAzureCookieOnUrl: jest.fn().mockResolvedValue(undefined),
  })
);

type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    goToPath: jest.fn(),
    getLink: jest.fn().mockReturnValue(''),
  })
);

type ErrorExports = typeof import('src/libs/error');
jest.mock('src/libs/error', (): ErrorExports => {
  const errorModule = jest.requireActual('src/libs/error');
  const mockErrorModule = jest.requireActual('src/libs/error.mock');
  return {
    ...errorModule,
    withErrorReporting: mockErrorModule.mockWithErrorReporting,
  };
});

type StateExports = typeof import('src/libs/state');
jest.mock(
  'src/libs/state',
  (): StateExports => ({
    ...jest.requireActual('src/libs/state'),
    getTerraUser: jest.fn(),
  })
);

type ReactNotificationsComponentExports = typeof import('react-notifications-component');
jest.mock('react-notifications-component', (): DeepPartial<ReactNotificationsComponentExports> => {
  return {
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

describe('ImportWorkflow', () => {
  beforeAll(() => {
    // Arrange
    asMockedFn(useWorkspaces).mockReturnValue({
      workspaces: [
        {
          workspace: {
            namespace: 'test',
            name: 'gcp-workspace1',
            workspaceId: '6771d2c8-cd58-47da-a54c-6cdafacc4175',
            cloudPlatform: 'Gcp',
          },
          accessLevel: 'WRITER',
        },
        {
          workspace: {
            namespace: 'test',
            name: 'gcp-workspace2',
            workspaceId: '5cfa16d8-d604-4de8-8e8a-acde05d71b99',
            cloudPlatform: 'Gcp',
          },
          accessLevel: 'WRITER',
        },
        {
          workspace: {
            namespace: 'test',
            name: 'gcp-workspace3',
            workspaceId: '5cfa16d8-d604-4de8-8e8a-acde05d71b75',
            cloudPlatform: 'Gcp',
          },
          accessLevel: 'READER',
        },
      ] as WorkspaceWrapper[],
      refresh: () => Promise.resolve(),
      loading: false,
      status: 'Ready',
    });

    asMockedFn(getTerraUser).mockReturnValue({
      email: 'abc@gmail.com',
    });

    asMockedFn(Billing).mockReturnValue(
      partial<BillingContract>({
        listProjects: async () => [
          partial<BillingProject>({
            billingAccount: 'billingAccounts/FOO-BAR-BAZ',
            cloudPlatform: 'GCP',
            invalidBillingAccount: false,
            projectName: 'Google Billing Project',
            roles: ['Owner'],
            status: 'Ready',
          }),
        ],
      })
    );

    asMockedFn(Groups).mockReturnValue(
      partial<GroupsContract>({
        list: async () => {
          return [];
        },
        group: (_groupName) =>
          partial<GroupContract>({
            isMember: async () => {
              return true;
            },
          }),
      })
    );

    asMockedFn(Metrics).mockReturnValue(
      partial<MetricsContract>({
        captureEvent: async () => {}, // do nothing
      })
    );
  });

  it('fetches and renders WDL', () => {
    // Act
    render(
      h(ImportWorkflow, {
        path: 'github.com/DataBiosphere/test-workflows/test-workflow',
        version: 'v1.0.0',
        source: 'dockstore',
      })
    );

    // Assert
    expect(useDockstoreWdl).toHaveBeenCalledWith({
      path: 'github.com/DataBiosphere/test-workflows/test-workflow',
      version: 'v1.0.0',
      isTool: false,
    });

    const wdlContainer = document.querySelector('code')!;
    expect(wdlContainer).toHaveTextContent('workflow TestWorkflow {}');
  });

  describe('workflow name', () => {
    it('defaults workflow name based on path', () => {
      // Act
      render(
        h(ImportWorkflow, {
          path: 'github.com/DataBiosphere/test-workflows/test-workflow',
          version: 'v1.0.0',
          source: 'dockstore',
        })
      );

      // Assert
      const nameInput = screen.getByLabelText('Workflow Name');
      expect(nameInput).toHaveValue('test-workflow');
    });

    it('validates name based on allowed symbols', async () => {
      // Act
      render(
        h(ImportWorkflow, {
          path: 'github.com/DataBiosphere/test-workflows/test-workflow',
          version: 'v1.0.0',
          source: 'dockstore',
        })
      );

      const nameInput = screen.getByLabelText('Workflow Name');

      fireEvent.change(nameInput, { target: { value: 'a new workflow name' } });

      // Assert
      screen.getByText('Workflow name can only contain letters, numbers, underscores, dashes, and periods');
    });

    it('validates name based on maximum length', async () => {
      // Act
      render(
        h(ImportWorkflow, {
          path: 'github.com/DataBiosphere/test-workflows/test-workflow',
          version: 'v1.0.0',
          source: 'dockstore',
        })
      );

      const nameInput = screen.getByLabelText('Workflow Name');

      fireEvent.change(nameInput, { target: { value: _.repeat('a', 255) } });

      // Assert
      screen.getByText('Workflow name is too long (maximum is 254 characters)');
    });
  });

  it('it imports the workflow into the selected workspace', async () => {
    // Arrange
    const user = userEvent.setup();

    const testWorkflow = {
      path: 'github.com/DataBiosphere/test-workflows/test-workflow',
      version: 'v1.0.0',
      source: 'dockstore',
    };

    render(h(ImportWorkflow, { ...testWorkflow }));

    // Act
    const workspaceMenu = new SelectHelper(screen.getByLabelText('Destination Workspace'), user);
    await workspaceMenu.selectOption(/gcp-workspace1/);

    const importButton = screen.getByText('Import');
    await user.click(importButton);

    // Assert
    expect(importDockstoreWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: expect.objectContaining({ namespace: 'test', name: 'gcp-workspace1' }),
        workflow: testWorkflow,
      }),
      { overwrite: false }
    );
  });

  it('confirms overwrite if workflow already exists', async () => {
    // Arrange
    const user = userEvent.setup();

    asMockedFn(importDockstoreWorkflow).mockRejectedValueOnce(new Response('{}', { status: 409 }));

    const testWorkflow = {
      path: 'github.com/DataBiosphere/test-workflows/test-workflow',
      version: 'v1.0.0',
      source: 'dockstore',
    };

    render(h(ImportWorkflow, { ...testWorkflow }));

    // Act
    const workspaceMenu = new SelectHelper(screen.getByLabelText('Destination Workspace'), user);
    await workspaceMenu.selectOption(/gcp-workspace1/);

    const importButton = screen.getByText('Import');
    await user.click(importButton);
    const firstImportDockstoreWorkflowCallArgs = asMockedFn(importDockstoreWorkflow).mock.calls[0];

    const confirmationMessageShown = !!screen.queryByText(
      'The selected workspace already contains a workflow named "test-workflow". Are you sure you want to overwrite it?'
    );
    const confirmButton = screen.getByText('Overwrite');
    await user.click(confirmButton);
    const secondImportDockstoreWorkflowCallArgs = asMockedFn(importDockstoreWorkflow).mock.calls[1];

    // Assert
    expect(firstImportDockstoreWorkflowCallArgs).toEqual([
      expect.objectContaining({
        workspace: expect.objectContaining({ namespace: 'test', name: 'gcp-workspace1' }),
        workflow: testWorkflow,
      }),
      { overwrite: false },
    ]);

    expect(confirmationMessageShown).toBe(true);

    expect(secondImportDockstoreWorkflowCallArgs).toEqual([
      expect.objectContaining({
        workspace: expect.objectContaining({ namespace: 'test', name: 'gcp-workspace1' }),
        workflow: testWorkflow,
      }),
      { overwrite: true },
    ]);
  });
});
