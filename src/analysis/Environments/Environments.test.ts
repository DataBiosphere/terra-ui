import { formatDatetime, NavLinkProvider } from '@terra-ui-packages/core-utils';
import { act, fireEvent, getAllByRole, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import {
  azureRuntime,
  dataprocRuntime,
  generateAzureWorkspace,
  generateGoogleWorkspace,
  generateTestAppWithAzureWorkspace,
  generateTestAppWithGoogleWorkspace,
  generateTestDiskWithAzureWorkspace,
  generateTestDiskWithGoogleWorkspace,
  generateTestListGoogleRuntime,
} from 'src/analysis/_testData/testData';
import { appToolLabels } from 'src/analysis/utils/tool-utils';
import { AzureConfig } from 'src/libs/ajax/leonardo/models/runtime-config-models';
import { Runtime, runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import { LeoAppProvider } from 'src/libs/ajax/leonardo/providers/LeoAppProvider';
import { LeoDiskProvider } from 'src/libs/ajax/leonardo/providers/LeoDiskProvider';
import { LeoRuntimeProvider } from 'src/libs/ajax/leonardo/providers/LeoRuntimeProvider';
import { leoResourcePermissions } from 'src/pages/EnvironmentsPage/environmentsPermissions';
import { asMockedFn, renderWithAppContexts as render } from 'src/testing/test-utils';
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import { UseWorkspacesResult } from 'src/workspaces/common/state/useWorkspaces.models';
import { WorkspaceWrapper } from 'src/workspaces/utils';

import { DataRefreshInfo, EnvironmentNavActions, Environments, EnvironmentsProps } from './Environments';
import { LeoResourcePermissionsProvider } from './Environments.models';

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn(),
}));

const mockNav: NavLinkProvider<EnvironmentNavActions> = {
  getUrl: jest.fn().mockReturnValue('/'),
  navTo: jest.fn(),
};

const defaultUseWorkspacesProps: UseWorkspacesResult = {
  workspaces: [defaultGoogleWorkspace] as WorkspaceWrapper[],
  refresh: () => Promise.resolve(),
  loading: false,
  status: 'Ready',
};

const getMockLeoAppProvider = (overrides?: Partial<LeoAppProvider>): LeoAppProvider => {
  const defaultProvider: LeoAppProvider = {
    listWithoutProject: jest.fn(),
    pause: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
  };
  asMockedFn(defaultProvider.listWithoutProject).mockResolvedValue([]);

  return { ...defaultProvider, ...overrides };
};

const getMockLeoRuntimeProvider = (overrides?: Partial<LeoRuntimeProvider>): LeoRuntimeProvider => {
  const defaultProvider: LeoRuntimeProvider = {
    list: jest.fn(),
    errorInfo: jest.fn(),
    stop: jest.fn(),
    delete: jest.fn(),
  };
  asMockedFn(defaultProvider.list).mockResolvedValue([]);
  return { ...defaultProvider, ...overrides };
};

const getMockLeoDiskProvider = (overrides?: Partial<LeoDiskProvider>): LeoDiskProvider => {
  const defaultProvider: LeoDiskProvider = {
    list: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    details: jest.fn(),
  };
  asMockedFn(defaultProvider.list).mockResolvedValue([]);

  return { ...defaultProvider, ...overrides };
};

const getEnvironmentsProps = (propsOverrides?: Partial<EnvironmentsProps>): EnvironmentsProps => {
  const mockPermissions: LeoResourcePermissionsProvider = {
    hasDeleteDiskPermission: jest.fn(),
    hasPausePermission: jest.fn(),
    isAppInDeletableState: jest.fn(),
    isResourceInDeletableState: jest.fn(),
  };
  asMockedFn(mockPermissions.hasDeleteDiskPermission).mockReturnValue(true);
  asMockedFn(mockPermissions.hasPausePermission).mockReturnValue(true);
  asMockedFn(mockPermissions.isAppInDeletableState).mockReturnValue(true);
  asMockedFn(mockPermissions.isResourceInDeletableState).mockReturnValue(true);

  const defaultProps: EnvironmentsProps = {
    nav: mockNav,
    useWorkspaces: jest.fn(),
    leoAppData: getMockLeoAppProvider(),
    leoRuntimeData: getMockLeoRuntimeProvider(),
    leoDiskData: getMockLeoDiskProvider(),
    permissions: mockPermissions,
    onEvent: jest.fn(),
  };
  asMockedFn(defaultProps.useWorkspaces).mockReturnValue(defaultUseWorkspacesProps);

  const finalizedProps: EnvironmentsProps = { ...defaultProps, ...propsOverrides };

  return finalizedProps;
};

describe('Environments Component', () => {
  describe('Runtimes - ', () => {
    it('Renders page correctly with runtimes and no found workspaces', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const runtime1 = generateTestListGoogleRuntime();
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([runtime1]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [],
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      const tableRows: HTMLElement[] = screen.getAllByRole('row').slice(1); // skip header row
      const firstRuntimeRow: HTMLElement = tableRows[0];
      const workspaceForFirstRuntimeCell = getAllByRole(firstRuntimeRow, 'cell')[1].textContent;
      expect(workspaceForFirstRuntimeCell).toBe(`${runtime1.labels.saturnWorkspaceName} (unavailable)`);
    });

    it('Renders page correctly with a runtime', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const runtime1 = generateTestListGoogleRuntime();
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([runtime1]);

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      const tableRows: HTMLElement[] = screen.getAllByRole('row').slice(1); // skip header row
      const firstRuntimeRow: HTMLElement = tableRows[0];
      const workspaceForFirstRuntimeCell = getTextContentForColumn(firstRuntimeRow, 1);

      expect(getTextContentForColumn(firstRuntimeRow, 0)).toBe(runtime1.labels.saturnWorkspaceNamespace);
      expect(workspaceForFirstRuntimeCell).toBe(`${runtime1.labels.saturnWorkspaceName}`);
      expect(getTextContentForColumn(firstRuntimeRow, 2)).toBe(runtime1.runtimeConfig.cloudService);
      expect(getTextContentForColumn(firstRuntimeRow, 3)).toBe(runtime1.labels.tool);
      expect(getTextContentForColumn(firstRuntimeRow, 5)).toBe(runtime1.status);
      expect(getTextContentForColumn(firstRuntimeRow, 6)).toBe(_.toLower(runtime1.runtimeConfig.normalizedRegion));
      expect(getTextContentForColumn(firstRuntimeRow, 7)).toBe(formatDatetime(runtime1.auditInfo.createdDate));
      expect(getTextContentForColumn(firstRuntimeRow, 8)).toBe(formatDatetime(runtime1.auditInfo.dateAccessed));
    });

    it('Renders page correctly with multiple runtimes and workspaces', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const runtime1 = generateTestListGoogleRuntime();
      const runtime2 = azureRuntime;
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([runtime1, runtime2]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace, defaultAzureWorkspace],
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      const tableRows: HTMLElement[] = screen.getAllByRole('row');

      const firstRuntimeRow: HTMLElement = tableRows[1];
      expect(getTextContentForColumn(firstRuntimeRow, 0)).toBe(`${runtime2.labels.saturnWorkspaceNamespace}`);
      expect(getTextContentForColumn(firstRuntimeRow, 1)).toBe(`${runtime2.labels.saturnWorkspaceName}`);
      expect(getTextContentForColumn(firstRuntimeRow, 2)).toBe(runtime2.runtimeConfig.cloudService);
      expect(getTextContentForColumn(firstRuntimeRow, 3)).toBe(_.capitalize(runtime2.labels.tool));
      expect(getTextContentForColumn(firstRuntimeRow, 5)).toBe(runtime2.status);
      expect(getTextContentForColumn(firstRuntimeRow, 6)).toBe((runtime2.runtimeConfig as AzureConfig).region);
      expect(getTextContentForColumn(firstRuntimeRow, 7)).toBe(formatDatetime(runtime2.auditInfo.createdDate));
      expect(getTextContentForColumn(firstRuntimeRow, 8)).toBe(formatDatetime(runtime2.auditInfo.dateAccessed));

      expect(getTextContentForColumn(tableRows[2], 0)).toBe(`${runtime1.labels.saturnWorkspaceNamespace}`);
      expect(getTextContentForColumn(tableRows[2], 1)).toBe(`${runtime1.labels.saturnWorkspaceName}`);
      expect(getTextContentForColumn(tableRows[2], 2)).toBe(runtime1.runtimeConfig.cloudService);
      expect(getTextContentForColumn(tableRows[2], 3)).toBe(runtime1.labels.tool);
      expect(getTextContentForColumn(tableRows[2], 5)).toBe(runtime1.status);
      expect(getTextContentForColumn(tableRows[2], 6)).toBe(_.toLower(runtime1.runtimeConfig.normalizedRegion));
      expect(getTextContentForColumn(tableRows[2], 7)).toBe(formatDatetime(runtime1.auditInfo.createdDate));
      expect(getTextContentForColumn(tableRows[2], 8)).toBe(formatDatetime(runtime1.auditInfo.dateAccessed));
    });

    it('Renders page correctly for a Dataproc Runtime', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([dataprocRuntime]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace],
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      const tableRows: HTMLElement[] = screen.getAllByRole('row');

      const firstRuntimeRow: HTMLElement = tableRows[1];
      expect(getTextContentForColumn(firstRuntimeRow, 0)).toBe(`${dataprocRuntime.labels.saturnWorkspaceNamespace}`);
      expect(getTextContentForColumn(firstRuntimeRow, 1)).toBe(`${dataprocRuntime.labels.saturnWorkspaceName}`);
      expect(getTextContentForColumn(firstRuntimeRow, 2)).toBe(
        _.capitalize(dataprocRuntime.runtimeConfig.cloudService)
      );
      expect(getTextContentForColumn(firstRuntimeRow, 3)).toBe(_.capitalize(dataprocRuntime.labels.tool));
      expect(getTextContentForColumn(firstRuntimeRow, 5)).toBe(dataprocRuntime.status);
      // @ts-expect-error ignore this ts error here, we know what type of runtime config it is since it is test data (therefore, we know zone exists)
      expect(getTextContentForColumn(firstRuntimeRow, 6)).toBe(dataprocRuntime.runtimeConfig.region);
      expect(getTextContentForColumn(firstRuntimeRow, 7)).toBe(formatDatetime(dataprocRuntime.auditInfo.createdDate));
      expect(getTextContentForColumn(firstRuntimeRow, 8)).toBe(formatDatetime(dataprocRuntime.auditInfo.dateAccessed));
    });

    it('Renders buttons for runtimes properly', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const runtime1 = generateTestListGoogleRuntime();
      const runtime2 = generateTestListGoogleRuntime({ status: runtimeStatuses.deleting.leoLabel });
      const runtime3 = azureRuntime;
      const runtime4: Runtime = { ...azureRuntime, status: runtimeStatuses.error.leoLabel };
      // the order in the below array is the default sort order of the table
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([runtime3, runtime4, runtime1, runtime2]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace, defaultAzureWorkspace],
      });
      props.permissions.isResourceInDeletableState = leoResourcePermissions.isResourceInDeletableState;

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      const tableRows: HTMLElement[] = screen.getAllByRole('row');

      // this is runtime3 in test data array
      const runtime1Row: HTMLElement = tableRows[1];
      const runtime1ButtonsCell = getAllByRole(runtime1Row, 'cell')[10];
      const buttons1 = getAllByRole(runtime1ButtonsCell, 'button');
      expect(buttons1.length).toBe(2);
      expect(buttons1[0].textContent).toBe('Pause');
      expect(buttons1[0].getAttribute('aria-disabled')).toBe('false');
      expect(buttons1[1].textContent).toBe('Delete');
      expect(buttons1[1].getAttribute('aria-disabled')).toBe('false');

      // this is runtime4 in test data array
      const runtime2Row: HTMLElement = tableRows[2];
      const runtime2ButtonsCell = getAllByRole(runtime2Row, 'cell')[10];
      const buttons2 = getAllByRole(runtime2ButtonsCell, 'button');
      expect(buttons2.length).toBe(2);
      expect(buttons2[0].textContent).toBe('Pause');
      expect(buttons2[0].getAttribute('aria-disabled')).toBe('true');
      expect(buttons2[1].textContent).toBe('Delete');
      expect(buttons2[1].getAttribute('aria-disabled')).toBe('false');

      // this is runtime1 in test data array
      const runtime3Row: HTMLElement = tableRows[3];
      const runtime3ButtonsCell = getAllByRole(runtime3Row, 'cell')[10];
      const buttons3 = getAllByRole(runtime3ButtonsCell, 'button');
      expect(buttons3.length).toBe(2);
      expect(buttons3[0].textContent).toBe('Pause');
      expect(buttons3[0].getAttribute('aria-disabled')).toBe('false');
      expect(buttons3[1].textContent).toBe('Delete');
      expect(buttons3[1].getAttribute('aria-disabled')).toBe('false');

      // this is runtime2 in test data array
      const runtime4Row: HTMLElement = tableRows[4];
      const runtime4ButtonsCell = getAllByRole(runtime4Row, 'cell')[10];
      const buttons4 = getAllByRole(runtime4ButtonsCell, 'button');
      expect(buttons4.length).toBe(2);
      expect(buttons4[0].textContent).toBe('Pause');
      expect(buttons4[0].getAttribute('aria-disabled')).toBe('true');
      expect(buttons4[1].textContent).toBe('Delete');
      expect(buttons4[1].getAttribute('aria-disabled')).toBe('true');
    });

    it('should hide pause button where user is not creator of runtime', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const runtime1 = generateTestListGoogleRuntime();
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([runtime1]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace, defaultAzureWorkspace],
      });

      asMockedFn(props.permissions.hasPausePermission).mockReturnValue(false);

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const runtime1Row: HTMLElement = tableRows[1];
      const runtime1ButtonsCell = getAllByRole(runtime1Row, 'cell')[10];
      const buttons1 = getAllByRole(runtime1ButtonsCell, 'button');
      expect(buttons1.length).toBe(1);
      expect(buttons1[0].textContent).toBe('Delete');
      expect(buttons1[0].getAttribute('aria-disabled')).toBe('false');
    });

    it.each([
      {
        runtime: { ...generateTestListGoogleRuntime(), workspaceId: defaultGoogleWorkspace.workspace.workspaceId },
        workspace: defaultGoogleWorkspace,
      },
      { runtime: azureRuntime, workspace: defaultAzureWorkspace },
    ])('Renders runtime details view correctly', async ({ runtime, workspace }) => {
      // Arrange
      const props = getEnvironmentsProps();
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([runtime]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      await act(async () => {
        render(h(Environments, props));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const runtime1Row: HTMLElement = tableRows[1];
      const runtime1ButtonsCell = getAllByRole(runtime1Row, 'cell')[4];
      const button = getAllByRole(runtime1ButtonsCell, 'button');
      const foundButtonCount = button.length;
      const foundButtonText = button[0]?.textContent;

      // Act
      fireEvent.click(button[0]);

      // Assert
      expect(foundButtonCount).toBe(1);
      expect(foundButtonText).toBe('view');
      screen.getByText(workspace.workspace.workspaceId);
      screen.getByText(runtime.cloudContext.cloudResource);
      screen.getByText(runtime.runtimeName);
    });

    it.each([
      { runtime: azureRuntime, workspace: defaultAzureWorkspace },
      { runtime: generateTestListGoogleRuntime(), workspace: defaultGoogleWorkspace },
    ])('Behaves properly when we click pause/delete for azure/gce vm', async ({ runtime, workspace }) => {
      // Arrange
      const user = userEvent.setup();
      const props = getEnvironmentsProps();
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([runtime]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const runtime1Row: HTMLElement = tableRows[1];
      const runtime1ButtonsCell = getAllByRole(runtime1Row, 'cell')[10];
      const buttons1 = getAllByRole(runtime1ButtonsCell, 'button');

      // Assert
      expect(buttons1.length).toBe(2);
      expect(buttons1[0].textContent).toBe('Pause');

      // Act - Pause button
      await user.click(buttons1[0]);

      // Assert
      expect(props.leoRuntimeData.stop).toBeCalledTimes(1);
      expect(props.leoRuntimeData.stop).toBeCalledWith(
        expect.objectContaining({
          runtimeName: runtime.runtimeName,
        })
      );

      // Act - Delete Button
      await user.click(buttons1[1]);

      // Assert
      screen.getByText('Delete cloud environment?');
    });

    it.each([
      {
        runtime: { ...generateTestListGoogleRuntime(), status: runtimeStatuses.error.leoLabel },
        workspace: defaultGoogleWorkspace,
      },
      { runtime: { ...azureRuntime, status: runtimeStatuses.error.leoLabel }, workspace: defaultAzureWorkspace },
    ])('Renders the error message properly for azure and gce vms', async ({ runtime, workspace }) => {
      // Arrange
      const props = getEnvironmentsProps();
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([runtime]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const runtime1Row: HTMLElement = tableRows[1];
      const runtime1ButtonsCell = getAllByRole(runtime1Row, 'cell')[5];
      expect(runtime1ButtonsCell.textContent).toContain('Error');
      const button = getAllByRole(runtime1ButtonsCell, 'button');
      expect(button.length).toBe(1);
    });
  });

  describe('Apps - ', () => {
    it('Renders page correctly with an app', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const galaxyApp = generateTestAppWithGoogleWorkspace({}, defaultGoogleWorkspace);
      asMockedFn(props.leoAppData.listWithoutProject).mockResolvedValue([galaxyApp]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace],
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      const tableRows: HTMLElement[] = screen.getAllByRole('row').slice(1); // skip header row
      const firstAppRow: HTMLElement = tableRows[0];
      const workspaceForFirstRuntimeCell = getTextContentForColumn(firstAppRow, 1);

      expect(getTextContentForColumn(firstAppRow, 0)).toBe(galaxyApp.labels.saturnWorkspaceNamespace);
      expect(workspaceForFirstRuntimeCell).toBe(galaxyApp.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(firstAppRow, 2)).toBe('Kubernetes');
      expect(getTextContentForColumn(firstAppRow, 3)).toBe(_.capitalize(galaxyApp.appType));
      expect(getTextContentForColumn(firstAppRow, 5)).toBe(_.capitalize(galaxyApp.status));
      expect(getTextContentForColumn(firstAppRow, 6)).toBe(galaxyApp.region);
      expect(getTextContentForColumn(firstAppRow, 7)).toBe(formatDatetime(galaxyApp.auditInfo.createdDate));
      expect(getTextContentForColumn(firstAppRow, 8)).toBe(formatDatetime(galaxyApp.auditInfo.dateAccessed));
    });

    it('Renders page correctly with multiple apps and workspaces', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const googleApp1 = generateTestAppWithGoogleWorkspace({}, defaultGoogleWorkspace);
      // the page sorts alphabetically by workspace initially
      const googleWorkspace2 = generateGoogleWorkspace();
      const googleApp2 = generateTestAppWithGoogleWorkspace({}, googleWorkspace2);

      const azureApp1 = generateTestAppWithAzureWorkspace({ appType: appToolLabels.CROMWELL }, defaultAzureWorkspace);
      const azureWorkspace2 = generateAzureWorkspace();
      const azureApp2 = generateTestAppWithAzureWorkspace({ appType: appToolLabels.CROMWELL }, azureWorkspace2);
      asMockedFn(props.leoAppData.listWithoutProject).mockResolvedValue([googleApp1, googleApp2, azureApp1, azureApp2]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace, googleWorkspace2, defaultAzureWorkspace, azureWorkspace2],
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      const tableRows: HTMLElement[] = screen.getAllByRole('row').slice(1); // skip header row
      const firstAppRow: HTMLElement = tableRows[0];
      expect(getTextContentForColumn(firstAppRow, 0)).toBe(googleApp1.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(firstAppRow, 1)).toBe(googleApp1.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(firstAppRow, 2)).toBe('Kubernetes');
      expect(getTextContentForColumn(firstAppRow, 3)).toBe(_.capitalize(googleApp1.appType));
      expect(getTextContentForColumn(firstAppRow, 5)).toBe(_.capitalize(googleApp1.status));
      expect(getTextContentForColumn(firstAppRow, 6)).toBe(googleApp1.region);
      expect(getTextContentForColumn(firstAppRow, 7)).toBe(formatDatetime(googleApp1.auditInfo.createdDate));
      expect(getTextContentForColumn(firstAppRow, 8)).toBe(formatDatetime(googleApp1.auditInfo.dateAccessed));

      const secondAppRow: HTMLElement = tableRows[1];
      expect(getTextContentForColumn(secondAppRow, 0)).toBe(googleApp2.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(secondAppRow, 1)).toBe(googleApp2.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(secondAppRow, 2)).toBe('Kubernetes');
      expect(getTextContentForColumn(secondAppRow, 3)).toBe(_.capitalize(googleApp2.appType));
      expect(getTextContentForColumn(secondAppRow, 5)).toBe(_.capitalize(googleApp2.status));
      expect(getTextContentForColumn(secondAppRow, 6)).toBe(googleApp2.region);
      expect(getTextContentForColumn(secondAppRow, 7)).toBe(formatDatetime(googleApp2.auditInfo.createdDate));
      expect(getTextContentForColumn(secondAppRow, 8)).toBe(formatDatetime(googleApp1.auditInfo.dateAccessed));

      const thirdAppRow: HTMLElement = tableRows[2];
      expect(getTextContentForColumn(thirdAppRow, 0)).toBe(azureApp1.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(thirdAppRow, 1)).toBe(azureApp1.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(thirdAppRow, 2)).toBe('Kubernetes');
      expect(getTextContentForColumn(thirdAppRow, 3)).toBe(_.capitalize(azureApp1.appType));
      expect(getTextContentForColumn(thirdAppRow, 5)).toBe(_.capitalize(azureApp1.status));
      expect(getTextContentForColumn(thirdAppRow, 6)).toBe(azureApp1.region);
      expect(getTextContentForColumn(thirdAppRow, 7)).toBe(formatDatetime(azureApp1.auditInfo.createdDate));
      expect(getTextContentForColumn(thirdAppRow, 8)).toBe(formatDatetime(azureApp1.auditInfo.dateAccessed));

      const fourthAppRow: HTMLElement = tableRows[3];
      expect(getTextContentForColumn(fourthAppRow, 0)).toBe(azureApp2.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(fourthAppRow, 1)).toBe(azureApp2.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(fourthAppRow, 2)).toBe('Kubernetes');
      expect(getTextContentForColumn(fourthAppRow, 3)).toBe(_.capitalize(azureApp2.appType));
      expect(getTextContentForColumn(fourthAppRow, 5)).toBe(_.capitalize(azureApp2.status));
      expect(getTextContentForColumn(fourthAppRow, 6)).toBe(azureApp2.region);
      expect(getTextContentForColumn(fourthAppRow, 7)).toBe(formatDatetime(azureApp2.auditInfo.createdDate));
      expect(getTextContentForColumn(fourthAppRow, 8)).toBe(formatDatetime(azureApp2.auditInfo.dateAccessed));
    });

    it('Renders Cromwell apps with disabled delete', async () => {
      // Arrange
      const props = getEnvironmentsProps();

      const googleApp1 = generateTestAppWithGoogleWorkspace({}, defaultGoogleWorkspace);
      const azureApp1 = generateTestAppWithAzureWorkspace({ appType: appToolLabels.CROMWELL }, defaultAzureWorkspace);
      const azureWorkspace2 = generateAzureWorkspace();
      const azureApp2 = generateTestAppWithAzureWorkspace({ appType: appToolLabels.WORKFLOWS_APP }, azureWorkspace2);
      asMockedFn(props.leoAppData.listWithoutProject).mockResolvedValue([googleApp1, azureApp1, azureApp2]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace, defaultAzureWorkspace, azureWorkspace2],
      });
      props.permissions = leoResourcePermissions;

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      expect(screen.getAllByRole('row')).toHaveLength(6);

      const tableRows: HTMLElement[] = screen.getAllByRole('row').slice(1); // skip header row
      const firstAppRow: HTMLElement = tableRows[0];
      const actionColumnButton1 = within(firstAppRow).getByRole('button', { name: 'Delete' });
      expect(actionColumnButton1).not.toHaveAttribute('disabled');

      const secondAppRow: HTMLElement = tableRows[1];
      const actionColumnButton2 = within(secondAppRow).getByRole('button', { name: 'Delete' });
      expect(actionColumnButton2).toHaveAttribute('disabled');

      const thirdAppRow: HTMLElement = tableRows[2];
      const actionColumnButton3 = within(thirdAppRow).getByRole('button', { name: 'Delete' });
      expect(actionColumnButton3).toHaveAttribute('disabled');

      // Check for tooltip, and that it's only present for azure apps
      const notSupportedTooltip = screen.getAllByText('Deleting not yet supported');
      expect(notSupportedTooltip).toBeInTheDocument;
      expect(notSupportedTooltip.length).toBe(2);
    });

    it.each([
      { app: generateTestAppWithGoogleWorkspace({}, defaultGoogleWorkspace), workspace: defaultGoogleWorkspace },
      { app: generateTestAppWithAzureWorkspace({}, defaultAzureWorkspace), workspace: defaultAzureWorkspace },
    ])('Renders app details view correctly', async ({ app, workspace }) => {
      // Arrange
      const props = getEnvironmentsProps();
      asMockedFn(props.leoAppData.listWithoutProject).mockResolvedValue([app]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      await act(async () => {
        render(h(Environments, props));
      });

      // Act
      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const appRow: HTMLElement = tableRows[1];
      const appDetailsButtonCell = getAllByRole(appRow, 'cell')[4];
      const button = getAllByRole(appDetailsButtonCell, 'button');
      const foundButtonCount = button.length;
      const foundButtonText = button[0]?.textContent;

      fireEvent.click(button[0]);

      // Assert
      expect(foundButtonCount).toBe(1);
      expect(foundButtonText).toBe('view');
      screen.getByText(workspace.workspace.workspaceId);
      screen.getByText(app.appName);
      screen.getByText(app.cloudContext.cloudResource);
    });

    it.each([
      {
        app: generateTestAppWithGoogleWorkspace({}, defaultGoogleWorkspace),
        workspace: defaultGoogleWorkspace,
        isAzure: false,
      },
      {
        app: generateTestAppWithAzureWorkspace({}, defaultAzureWorkspace),
        workspace: defaultAzureWorkspace,
        isAzure: true,
      },
    ])('Behaves properly when we click pause/delete for azure/gce app', async ({ app, workspace }) => {
      // Arrange
      const user = userEvent.setup();
      const props = getEnvironmentsProps();
      asMockedFn(props.leoAppData.listWithoutProject).mockResolvedValue([app]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      await act(async () => {
        render(h(Environments, props));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const app1Row: HTMLElement = tableRows[1];
      const app1ButtonsCell = getAllByRole(app1Row, 'cell')[10];
      const buttons1 = getAllByRole(app1ButtonsCell, 'button');

      // Assert
      // TODO: should be 2 once pause is supported for apps
      // See https://broadworkbench.atlassian.net/browse/PROD-905
      expect(buttons1.length).toBe(1);
      expect(buttons1[0].textContent).toBe('Delete');

      // Delete button
      expect(buttons1[0].textContent).toBe('Delete');
      await user.click(buttons1[0]);
      screen.getByText('Delete cloud environment?');
    });
  });

  describe('Disks - ', () => {
    it('Renders page correctly with a disk', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const disk = generateTestDiskWithGoogleWorkspace();
      asMockedFn(props.leoDiskData.list).mockResolvedValue([disk]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace],
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const firstDiskRow: HTMLElement = tableRows[3];

      expect(getTextContentForColumn(firstDiskRow, 0)).toBe(disk.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(firstDiskRow, 1)).toBe(disk.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(firstDiskRow, 3)).toBe(`${disk.size}`);
      expect(getTextContentForColumn(firstDiskRow, 4)).toBe(disk.status);
      expect(getTextContentForColumn(firstDiskRow, 5)).toBe(disk.zone);
      expect(getTextContentForColumn(firstDiskRow, 6)).toBe(formatDatetime(disk.auditInfo.createdDate));
      expect(getTextContentForColumn(firstDiskRow, 7)).toBe(formatDatetime(disk.auditInfo.dateAccessed));
    });

    it('Renders page correctly with multiple workspaces/disks', async () => {
      // Arrange
      const props = getEnvironmentsProps();

      const googleDisk1 = generateTestDiskWithGoogleWorkspace({}, defaultGoogleWorkspace);
      // the page sorts alphabetically by workspace initially
      const googleWorkspace2 = generateGoogleWorkspace();
      const googleDisk2 = generateTestDiskWithGoogleWorkspace({}, googleWorkspace2);

      const azureDisk1 = generateTestDiskWithAzureWorkspace({}, defaultAzureWorkspace);
      const azureWorkspace2 = generateAzureWorkspace();
      const azureDisk2 = generateTestDiskWithAzureWorkspace({}, azureWorkspace2);

      asMockedFn(props.leoDiskData.list).mockResolvedValue([googleDisk1, googleDisk2, azureDisk1, azureDisk2]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace, googleWorkspace2, defaultAzureWorkspace, azureWorkspace2],
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      const tableRows: HTMLElement[] = screen.getAllByRole('row');

      const firstDiskRow: HTMLElement = tableRows[3];
      expect(getTextContentForColumn(firstDiskRow, 0)).toBe(googleDisk1.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(firstDiskRow, 1)).toBe(googleDisk1.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(firstDiskRow, 3)).toBe(`${googleDisk1.size}`);
      expect(getTextContentForColumn(firstDiskRow, 4)).toBe(googleDisk1.status);
      expect(getTextContentForColumn(firstDiskRow, 5)).toBe(googleDisk1.zone);
      expect(getTextContentForColumn(firstDiskRow, 6)).toBe(formatDatetime(googleDisk1.auditInfo.createdDate));
      expect(getTextContentForColumn(firstDiskRow, 7)).toBe(formatDatetime(googleDisk1.auditInfo.dateAccessed));

      const secondDiskRow: HTMLElement = tableRows[4];
      expect(getTextContentForColumn(secondDiskRow, 0)).toBe(googleDisk2.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(secondDiskRow, 1)).toBe(googleDisk2.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(secondDiskRow, 3)).toBe(`${googleDisk2.size}`);
      expect(getTextContentForColumn(secondDiskRow, 4)).toBe(googleDisk2.status);
      expect(getTextContentForColumn(secondDiskRow, 5)).toBe(googleDisk2.zone);
      expect(getTextContentForColumn(secondDiskRow, 6)).toBe(formatDatetime(googleDisk2.auditInfo.createdDate));
      expect(getTextContentForColumn(secondDiskRow, 7)).toBe(formatDatetime(googleDisk2.auditInfo.dateAccessed));

      const thirdDiskRow: HTMLElement = tableRows[5];
      expect(getTextContentForColumn(thirdDiskRow, 0)).toBe(azureDisk1.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(thirdDiskRow, 1)).toBe(azureDisk1.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(thirdDiskRow, 3)).toBe(`${azureDisk1.size}`);
      expect(getTextContentForColumn(thirdDiskRow, 4)).toBe(azureDisk1.status);
      expect(getTextContentForColumn(thirdDiskRow, 5)).toBe(azureDisk1.zone);
      expect(getTextContentForColumn(thirdDiskRow, 6)).toBe(formatDatetime(azureDisk1.auditInfo.createdDate));
      expect(getTextContentForColumn(thirdDiskRow, 7)).toBe(formatDatetime(azureDisk1.auditInfo.dateAccessed));

      const fourthDiskRow: HTMLElement = tableRows[6];
      expect(getTextContentForColumn(fourthDiskRow, 0)).toBe(azureDisk2.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(fourthDiskRow, 1)).toBe(azureDisk2.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(fourthDiskRow, 3)).toBe(`${azureDisk2.size}`);
      expect(getTextContentForColumn(fourthDiskRow, 4)).toBe(azureDisk2.status);
      expect(getTextContentForColumn(fourthDiskRow, 5)).toBe(azureDisk2.zone);
      expect(getTextContentForColumn(fourthDiskRow, 6)).toBe(formatDatetime(azureDisk2.auditInfo.createdDate));
      expect(getTextContentForColumn(fourthDiskRow, 7)).toBe(formatDatetime(azureDisk2.auditInfo.dateAccessed));
    });

    it.each([
      { disk: generateTestDiskWithGoogleWorkspace({}, defaultGoogleWorkspace), workspace: defaultGoogleWorkspace },
      { disk: generateTestDiskWithAzureWorkspace({}, defaultAzureWorkspace), workspace: defaultAzureWorkspace },
    ])('Renders disk details view correctly', async ({ disk, workspace }) => {
      // Arrange
      const props = getEnvironmentsProps();
      asMockedFn(props.leoDiskData.list).mockResolvedValue([disk]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      await act(async () => {
        render(h(Environments, props));
      });

      // Act
      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const appRow: HTMLElement = tableRows[3];
      const appDetailsButtonCell = getAllByRole(appRow, 'cell')[2];
      const button = getAllByRole(appDetailsButtonCell, 'button');
      const foundButtonCount = button.length;
      const foundButtonText = button[0]?.textContent;
      fireEvent.click(button[0]);

      // Assert
      expect(foundButtonCount).toBe(1);
      expect(foundButtonText).toBe('view');
      screen.getByText(workspace.workspace.workspaceId);
      screen.getByText(disk.name);
      screen.getByText(disk.cloudContext.cloudResource);
    });

    it.each([
      { disk: generateTestDiskWithGoogleWorkspace({}, defaultGoogleWorkspace), workspace: defaultGoogleWorkspace },
      { disk: generateTestDiskWithAzureWorkspace({}, defaultAzureWorkspace), workspace: defaultAzureWorkspace },
    ])('Behaves properly when we click delete for azure/gce disk', async ({ disk, workspace }) => {
      // Arrange
      const user = userEvent.setup();
      const props = getEnvironmentsProps();
      asMockedFn(props.leoDiskData.list).mockResolvedValue([disk]);
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      await act(async () => {
        render(h(Environments, props));
      });

      // Act
      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const disk1Row: HTMLElement = tableRows[3];
      const disk1ButtonsCell = getAllByRole(disk1Row, 'cell')[9];
      const buttons1 = getAllByRole(disk1ButtonsCell, 'button');
      const foundButtons1Count = buttons1.length;
      const foundButtons1Text = buttons1[0]?.textContent;

      await user.click(buttons1[0]);

      // Assert
      expect(foundButtons1Count).toBe(1);
      expect(foundButtons1Text).toBe('Delete');
      screen.getByText('Delete persistent disk?');
    });
  });

  describe('Other - ', () => {
    it('Performs query properly with resources owner checkbox', async () => {
      // Arrange
      const user = userEvent.setup();
      const mockListRuntime = jest.fn();
      const mockListApp = jest.fn();
      const mockListDisk = jest.fn();
      const runtimeProvider = getMockLeoRuntimeProvider({ list: mockListRuntime });
      const appProvider = getMockLeoAppProvider({ listWithoutProject: mockListApp });
      const diskProvider = getMockLeoDiskProvider({ list: mockListDisk });
      const props = getEnvironmentsProps({
        leoAppData: appProvider,
        leoRuntimeData: runtimeProvider,
        leoDiskData: diskProvider,
      });

      await act(async () => {
        render(h(Environments, props));
      });

      // Assert

      // One time on page load
      expect(mockListRuntime).toBeCalledTimes(1);
      expect(mockListApp).toBeCalledTimes(1);
      expect(mockListDisk).toBeCalledTimes(1);

      const checkbox = screen.getByLabelText('Hide resources you did not create');
      await user.click(checkbox);

      // Second time on checkbox click
      expect(mockListRuntime).toBeCalledTimes(2);
      expect(mockListApp).toBeCalledTimes(2);
      expect(mockListDisk).toBeCalledTimes(2);

      // First call should filter by creator, second call should not
      expect(mockListRuntime.mock.calls).toEqual([
        [expect.objectContaining({ role: 'creator' }), expect.any(Object)],
        [{ includeLabels: 'saturnWorkspaceNamespace,saturnWorkspaceName' }, expect.any(Object)],
      ]);
      expect(mockListApp.mock.calls).toEqual([
        [expect.objectContaining({ role: 'creator' }), expect.any(Object)],
        [{ includeLabels: 'saturnWorkspaceNamespace,saturnWorkspaceName' }, expect.any(Object)],
      ]);
      expect(mockListDisk.mock.calls).toEqual([
        [expect.objectContaining({ role: 'creator' }), expect.any(Object)],
        [{ includeLabels: 'saturnApplication,saturnWorkspaceNamespace,saturnWorkspaceName' }, expect.any(Object)],
      ]);
    });
  });

  // TODO: Reenable once pause is re-enabled for apps
  // See https://broadworkbench.atlassian.net/browse/PROD-905
  // describe('PauseButton', () => {
  //   it.each([{ app: generateTestAppWithGoogleWorkspace() }, { app: generateTestAppWithAzureWorkspace() }])(
  //     'should enable pause for azure and google',
  //     async ({ app }) => {
  //       // Arrange
  //       const pauseComputeAndRefresh = jest.fn();
  //
  //       await act(async () => {
  //         render(
  //           h(PauseButton, {
  //             cloudEnvironment: app,
  //             permissions: {
  //               canPauseResource: () => true,
  //             },
  //             pauseComputeAndRefresh,
  //           })
  //         );
  //       });
  //       // Act
  //       const pauseButton = screen.getByText('Pause');
  //       // Assert
  //       expect(pauseButton).toBeEnabled();
  //       // Act
  //       await userEvent.click(pauseButton);
  //       // Assert
  //       expect(pauseComputeAndRefresh).toHaveBeenCalled();
  //     }
  //   );
  // });

  describe('onEvent', () => {
    it('calls onEvent[dataRefesh] with a runtime', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const runtime1 = generateTestListGoogleRuntime();
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([runtime1]);

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      expect(props.onEvent).toBeCalledTimes(1);
      expect(props.onEvent).toBeCalledWith('dataRefresh', {
        runtimes: 1,
        disks: 0,
        apps: 0,
        leoCallTimeMs: expect.any(Number),
        totalCallTimeMs: expect.any(Number),
      } satisfies DataRefreshInfo);
    });
  });

  describe('Workspaces - ', () => {
    it('refreshes workspaces when pausing compute', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const runtime1 = generateTestListGoogleRuntime();
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([runtime1]);
      const refreshWorkspaces = jest.fn();
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [],
        refresh: refreshWorkspaces,
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });
      const pauseButton = screen.getByText('Pause');

      // Assert
      expect(pauseButton).toBeEnabled();
      expect(refreshWorkspaces).not.toHaveBeenCalled();

      // Act
      await userEvent.click(pauseButton);

      // Assert
      expect(refreshWorkspaces).toHaveBeenCalled();
    });

    it('refreshes workspaces when deleting compute', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const runtime1 = generateTestListGoogleRuntime();
      asMockedFn(props.leoRuntimeData.list).mockResolvedValue([runtime1]);
      const refreshWorkspaces = jest.fn();
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [],
        refresh: refreshWorkspaces,
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });
      const deleteButton = screen.getByText('Delete');

      // Assert
      expect(deleteButton).toBeEnabled();
      expect(refreshWorkspaces).not.toHaveBeenCalled();

      // Act
      await userEvent.click(deleteButton);
      const okButton = screen.getByText('OK');
      await userEvent.click(okButton);

      // Assert
      expect(refreshWorkspaces).toHaveBeenCalled();
    });

    it('refreshes workspaces when deleting disks', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const disk = generateTestDiskWithGoogleWorkspace();
      asMockedFn(props.leoDiskData.list).mockResolvedValue([disk]);
      const refreshWorkspaces = jest.fn();
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace],
        refresh: refreshWorkspaces,
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });
      const deleteButton = screen.getByText('Delete');

      // Assert
      expect(deleteButton).toBeEnabled();
      expect(refreshWorkspaces).not.toHaveBeenCalled();

      // Act
      await userEvent.click(deleteButton);
      const okButton = screen.getByText('OK');
      await userEvent.click(okButton);

      // Assert
      expect(refreshWorkspaces).toHaveBeenCalled();
    });

    it('refreshes workspaces when filtering by creator', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const refreshWorkspaces = jest.fn();
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [],
        refresh: refreshWorkspaces,
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });
      const checkbox = screen.getByLabelText('Hide resources you did not create');

      // Assert
      expect(checkbox).toBeEnabled();
      expect(refreshWorkspaces).not.toHaveBeenCalled();

      // Act
      await userEvent.click(checkbox);

      // Assert
      expect(refreshWorkspaces).toHaveBeenCalled();
    });

    it('does not refresh workspaces when rendering the page', async () => {
      // Arrange
      const props = getEnvironmentsProps();
      const refreshWorkspaces = jest.fn();
      asMockedFn(props.useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [],
        refresh: refreshWorkspaces,
      });

      // Act
      await act(async () => {
        render(h(Environments, props));
      });

      // Assert
      expect(refreshWorkspaces).not.toHaveBeenCalled();
    });
  });
});

const getTextContentForColumn = (row, column) => getAllByRole(row, 'cell')[column].textContent;
