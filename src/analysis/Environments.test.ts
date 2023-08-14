import { DeepPartial } from '@terra-ui-packages/core-utils';
import { act, fireEvent, getAllByRole, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import _ from 'lodash/fp';
import { h } from 'react-hyperscript-helpers';
import {
  azureRuntime,
  dataprocRuntime,
  defaultAzureWorkspace,
  defaultGoogleWorkspace,
  generateAzureWorkspace,
  generateGoogleWorkspace,
  generateTestAppWithAzureWorkspace,
  generateTestAppWithGoogleWorkspace,
  generateTestDiskWithAzureWorkspace,
  generateTestDiskWithGoogleWorkspace,
  generateTestGoogleRuntime,
} from 'src/analysis/_testData/testData';
import { Environments } from 'src/analysis/Environments';
import { defaultComputeZone } from 'src/analysis/utils/runtime-utils';
import { appToolLabels } from 'src/analysis/utils/tool-utils';
import { useWorkspaces } from 'src/components/workspace-utils';
import { Ajax, useReplaceableAjaxExperimental } from 'src/libs/ajax';
import { authOpts, fetchLeo } from 'src/libs/ajax/ajax-common';
import { ListRuntimeItem, Runtime, runtimeStatuses } from 'src/libs/ajax/leonardo/models/runtime-models';
import { getUser } from 'src/libs/state';
import * as Utils from 'src/libs/utils';
import { WorkspaceWrapper } from 'src/libs/workspace-utils';
import { asMockedFn } from 'src/testing/test-utils';

import { ListAppResponse } from '../libs/ajax/leonardo/models/app-models';
import { ListDiskItem } from '../libs/ajax/leonardo/models/disk-models';

type ModalMockExports = typeof import('src/components/Modal.mock');

jest.mock('src/components/Modal', () => {
  const mockModal = jest.requireActual<ModalMockExports>('src/components/Modal.mock');
  return mockModal.mockModalModule();
});

jest.mock('src/libs/ajax');
type NavExports = typeof import('src/libs/nav');
jest.mock(
  'src/libs/nav',
  (): NavExports => ({
    ...jest.requireActual('src/libs/nav'),
    getLink: jest.fn(),
  })
);

type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');
jest.mock(
  'src/libs/ajax/ajax-common',
  (): AjaxCommonExports => ({
    ...jest.requireActual('src/libs/ajax/ajax-common'),
    fetchLeo: jest.fn(),
    authOpts: jest.fn(),
    jsonBody: jest.fn(),
  })
);

type WorkspaceUtilsExports = typeof import('src/components/workspace-utils');
jest.mock(
  'src/components/workspace-utils',
  (): WorkspaceUtilsExports => ({
    ...jest.requireActual('src/components/workspace-utils'),
    useWorkspaces: jest.fn(),
  })
);

jest.mock('src/libs/ajax/leonardo/Runtimes');

jest.mock('src/libs/state', () => ({
  ...jest.requireActual('src/libs/state'),
  getUser: jest.fn(),
}));

const listRuntimesV2: () => Promise<ListRuntimeItem[]> = jest.fn();

// Transform a given list of mock Runtime objects into mock ListRuntimeItem objects (omit workspaceId)
const mockListRuntimesReturn = (...runtimes: Runtime[]): Promise<ListRuntimeItem[]> => {
  const isListRuntimeItem = (runtime: Runtime): runtime is ListRuntimeItem => 'workspaceId' in runtime;
  return Promise.resolve(runtimes.filter(isListRuntimeItem));
};

const listWithoutProject: () => Promise<ListAppResponse[]> = jest.fn();
const list: () => Promise<ListDiskItem[]> = jest.fn();
const mockFetchLeo = jest.fn();
const defaultNav = {
  getLink: jest.fn().mockReturnValue(''),
};

jest.mock('src/libs/notifications', () => ({
  notify: jest.fn(),
}));

const defaultUseWorkspacesProps = {
  workspaces: [defaultGoogleWorkspace] as WorkspaceWrapper[],
  refresh: () => Promise.resolve(),
  loading: false,
};

type AjaxContract = ReturnType<typeof Ajax>;
type AjaxAppsContract = AjaxContract['Apps'];

const mockRuntimes: Partial<AjaxContract['Runtimes']> = {
  listV2: listRuntimesV2,
};
const mockApps: Partial<AjaxAppsContract> = {
  listWithoutProject,
};
const mockDisks: DeepPartial<AjaxContract['Disks']> = {
  disksV1: () => ({
    list,
  }),
};
const mockMetrics: Partial<AjaxContract['Metrics']> = {
  captureEvent: () => Promise.resolve(),
};
const defaultMockAjax: Partial<AjaxContract> = {
  Apps: mockApps as AjaxAppsContract,
  Runtimes: mockRuntimes as AjaxContract['Runtimes'],
  Disks: mockDisks as AjaxContract['Disks'],
  Metrics: mockMetrics as AjaxContract['Metrics'],
};

describe('Environments', () => {
  beforeEach(() => {
    asMockedFn(useWorkspaces).mockReturnValue(defaultUseWorkspacesProps);

    asMockedFn(Ajax).mockImplementation(() => defaultMockAjax as AjaxContract);
    asMockedFn(useReplaceableAjaxExperimental).mockReturnValue(() => defaultMockAjax as AjaxContract);

    asMockedFn(fetchLeo).mockImplementation(mockFetchLeo);
    asMockedFn(authOpts).mockImplementation(jest.fn());

    asMockedFn(listRuntimesV2).mockReturnValue(Promise.resolve([]));
    asMockedFn(listWithoutProject).mockReturnValue(Promise.resolve([]));
    asMockedFn(list).mockReturnValue(Promise.resolve([]));

    asMockedFn(getUser).mockReturnValue({
      email: 'testuser123@broad.com',
    });
  });

  describe('Runtimes - ', () => {
    it('Renders page correctly with runtimes and no found workspaces', async () => {
      const runtime1 = generateTestGoogleRuntime();
      asMockedFn(listRuntimesV2).mockReturnValue(mockListRuntimesReturn(runtime1));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row').slice(1); // skip header row
      const firstRuntimeRow: HTMLElement = tableRows[0];
      const workspaceForFirstRuntimeCell = getAllByRole(firstRuntimeRow, 'cell')[1].textContent;
      expect(workspaceForFirstRuntimeCell).toBe(`${runtime1.labels.saturnWorkspaceName} (unavailable)`);
    });

    it('Renders page correctly with a runtime', async () => {
      const runtime1 = generateTestGoogleRuntime();
      asMockedFn(listRuntimesV2).mockReturnValue(mockListRuntimesReturn(runtime1));

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row').slice(1); // skip header row
      const firstRuntimeRow: HTMLElement = tableRows[0];
      const workspaceForFirstRuntimeCell = getTextContentForColumn(firstRuntimeRow, 1);

      expect(getTextContentForColumn(firstRuntimeRow, 0)).toBe(runtime1.labels.saturnWorkspaceNamespace);
      expect(workspaceForFirstRuntimeCell).toBe(`${runtime1.labels.saturnWorkspaceName}`);
      expect(getTextContentForColumn(firstRuntimeRow, 2)).toBe(runtime1.runtimeConfig.cloudService);
      expect(getTextContentForColumn(firstRuntimeRow, 3)).toBe(runtime1.labels.tool);
      expect(getTextContentForColumn(firstRuntimeRow, 5)).toBe(runtime1.status);
      // @ts-expect-error ignore this ts error here, we know what type of runtime config it is since it is test data (therefore, we know zone exists)
      expect(getTextContentForColumn(firstRuntimeRow, 6)).toBe(runtime1.runtimeConfig.zone);
      expect(getTextContentForColumn(firstRuntimeRow, 7)).toBe(Utils.makeCompleteDate(runtime1.auditInfo.createdDate));
      expect(getTextContentForColumn(firstRuntimeRow, 8)).toBe(Utils.makeCompleteDate(runtime1.auditInfo.dateAccessed));
    });

    it('Renders page correctly with multiple runtimes and workspaces', async () => {
      const runtime1 = generateTestGoogleRuntime();
      const runtime2 = azureRuntime;

      asMockedFn(listRuntimesV2).mockReturnValue(mockListRuntimesReturn(runtime1, runtime2));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace, defaultAzureWorkspace],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');

      const firstRuntimeRow: HTMLElement = tableRows[1];
      expect(getTextContentForColumn(firstRuntimeRow, 0)).toBe(`${runtime2.labels.saturnWorkspaceNamespace}`);
      expect(getTextContentForColumn(firstRuntimeRow, 1)).toBe(`${runtime2.labels.saturnWorkspaceName}`);
      expect(getTextContentForColumn(firstRuntimeRow, 2)).toBe(runtime2.runtimeConfig.cloudService);
      expect(getTextContentForColumn(firstRuntimeRow, 3)).toBe(_.capitalize(runtime2.labels.tool));
      expect(getTextContentForColumn(firstRuntimeRow, 5)).toBe(runtime2.status);
      // @ts-expect-error ignore this ts error here, we know what type of runtime config it is since it is test data (therefore, we know zone exists)
      expect(getTextContentForColumn(firstRuntimeRow, 6)).toBe(runtime2.runtimeConfig.region);
      expect(getTextContentForColumn(firstRuntimeRow, 7)).toBe(Utils.makeCompleteDate(runtime2.auditInfo.createdDate));
      expect(getTextContentForColumn(firstRuntimeRow, 8)).toBe(Utils.makeCompleteDate(runtime2.auditInfo.dateAccessed));

      expect(getTextContentForColumn(tableRows[2], 0)).toBe(`${runtime1.labels.saturnWorkspaceNamespace}`);
      expect(getTextContentForColumn(tableRows[2], 1)).toBe(`${runtime1.labels.saturnWorkspaceName}`);
      expect(getTextContentForColumn(tableRows[2], 2)).toBe(runtime1.runtimeConfig.cloudService);
      expect(getTextContentForColumn(tableRows[2], 3)).toBe(runtime1.labels.tool);
      expect(getTextContentForColumn(tableRows[2], 5)).toBe(runtime1.status);
      // @ts-expect-error ignore this ts error here, we know what type of runtime config it is since it is test data (therefore, we know zone exists)
      expect(getTextContentForColumn(tableRows[2], 6)).toBe(runtime1.runtimeConfig.zone);
      expect(getTextContentForColumn(tableRows[2], 7)).toBe(Utils.makeCompleteDate(runtime1.auditInfo.createdDate));
      expect(getTextContentForColumn(tableRows[2], 8)).toBe(Utils.makeCompleteDate(runtime1.auditInfo.dateAccessed));
    });

    it('Renders page correctly for a Dataproc Runtime', async () => {
      asMockedFn(listRuntimesV2).mockReturnValue(Promise.resolve([dataprocRuntime]));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

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
      expect(getTextContentForColumn(firstRuntimeRow, 7)).toBe(
        Utils.makeCompleteDate(dataprocRuntime.auditInfo.createdDate)
      );
      expect(getTextContentForColumn(firstRuntimeRow, 8)).toBe(
        Utils.makeCompleteDate(dataprocRuntime.auditInfo.dateAccessed)
      );
    });

    it('Renders buttons for runtimes properly', async () => {
      const runtime1 = generateTestGoogleRuntime();
      const runtime2 = generateTestGoogleRuntime({ status: runtimeStatuses.deleting.leoLabel });
      const runtime3 = azureRuntime;
      const runtime4: Runtime = { ...azureRuntime, status: runtimeStatuses.error.leoLabel };

      // the order in the below array is the default sort order of the table
      asMockedFn(listRuntimesV2).mockReturnValue(mockListRuntimesReturn(runtime3, runtime4, runtime1, runtime2));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace, defaultAzureWorkspace],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

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
      const runtime1 = generateTestGoogleRuntime();

      // the order in the below array is the default sort order of the table
      asMockedFn(listRuntimesV2).mockReturnValue(mockListRuntimesReturn(runtime1));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace, defaultAzureWorkspace],
      });
      asMockedFn(getUser).mockReturnValue({
        email: 'different@broad.com',
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

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
        runtime: { ...generateTestGoogleRuntime(), workspaceId: defaultGoogleWorkspace.workspace.workspaceId },
        workspace: defaultGoogleWorkspace,
      },
      { runtime: azureRuntime, workspace: defaultAzureWorkspace },
    ])('Renders runtime details view correctly', async ({ runtime, workspace }) => {
      asMockedFn(listRuntimesV2).mockReturnValue(mockListRuntimesReturn(runtime));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const runtime1Row: HTMLElement = tableRows[1];
      const runtime1ButtonsCell = getAllByRole(runtime1Row, 'cell')[4];
      const button = getAllByRole(runtime1ButtonsCell, 'button');
      expect(button.length).toBe(1);
      expect(button[0].textContent).toBe('view');
      fireEvent.click(button[0]);

      screen.getByText(workspace.workspace.workspaceId);
      screen.getByText(runtime.cloudContext.cloudResource);
      screen.getByText(runtime.runtimeName);
    });

    it.each([
      { runtime: azureRuntime, workspace: defaultAzureWorkspace },
      { runtime: generateTestGoogleRuntime(), workspace: defaultGoogleWorkspace },
    ])('Behaves properly when we click pause/delete for azure/gce vm', async ({ runtime, workspace }) => {
      const user = userEvent.setup();

      asMockedFn(listRuntimesV2).mockReturnValue(mockListRuntimesReturn(runtime));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      const mockRuntimesStopFn = jest.fn();
      const mockRuntimeWrapper = jest.fn(() => ({
        stop: mockRuntimesStopFn,
      }));

      const newMockAjax: Partial<AjaxContract> = {
        ...defaultMockAjax,
        Runtimes: { ...mockRuntimes, runtimeWrapper: mockRuntimeWrapper } as unknown as AjaxContract['Runtimes'],
      };
      asMockedFn(useReplaceableAjaxExperimental).mockReturnValue(() => newMockAjax as AjaxContract);

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const runtime1Row: HTMLElement = tableRows[1];
      const runtime1ButtonsCell = getAllByRole(runtime1Row, 'cell')[10];
      const buttons1 = getAllByRole(runtime1ButtonsCell, 'button');

      // Assert
      expect(buttons1.length).toBe(2);
      expect(buttons1[0].textContent).toBe('Pause');

      // Pause button
      await user.click(buttons1[0]);
      expect(mockRuntimeWrapper).toHaveBeenCalledWith(
        expect.objectContaining({
          runtimeName: runtime.runtimeName,
        })
      );
      expect(mockRuntimesStopFn).toHaveBeenCalled();

      // Delete Button
      await user.click(buttons1[1]);
      screen.getByText('Delete cloud environment?');
    });

    it.each([
      {
        runtime: { ...generateTestGoogleRuntime(), status: runtimeStatuses.error.leoLabel },
        workspace: defaultGoogleWorkspace,
      },
      { runtime: { ...azureRuntime, status: runtimeStatuses.error.leoLabel }, workspace: defaultAzureWorkspace },
    ])('Renders the error message properly for azure and gce vms', async ({ runtime, workspace }) => {
      asMockedFn(listRuntimesV2).mockReturnValue(mockListRuntimesReturn(runtime));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

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
      const galaxyApp = generateTestAppWithGoogleWorkspace({}, defaultGoogleWorkspace);
      asMockedFn(listWithoutProject).mockReturnValue(Promise.resolve([galaxyApp]));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row').slice(1); // skip header row
      const firstAppRow: HTMLElement = tableRows[0];
      const workspaceForFirstRuntimeCell = getTextContentForColumn(firstAppRow, 1);

      expect(getTextContentForColumn(firstAppRow, 0)).toBe(galaxyApp.labels.saturnWorkspaceNamespace);
      expect(workspaceForFirstRuntimeCell).toBe(galaxyApp.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(firstAppRow, 2)).toBe('Kubernetes');
      expect(getTextContentForColumn(firstAppRow, 3)).toBe(_.capitalize(galaxyApp.appType));
      expect(getTextContentForColumn(firstAppRow, 5)).toBe(_.capitalize(galaxyApp.status));
      expect(getTextContentForColumn(firstAppRow, 6)).toBe(defaultComputeZone.toLowerCase());
      expect(getTextContentForColumn(firstAppRow, 7)).toBe(Utils.makeCompleteDate(galaxyApp.auditInfo.createdDate));
      expect(getTextContentForColumn(firstAppRow, 8)).toBe(Utils.makeCompleteDate(galaxyApp.auditInfo.dateAccessed));
    });

    it('Renders page correctly with multiple apps and workspaces', async () => {
      const googleApp1 = generateTestAppWithGoogleWorkspace({}, defaultGoogleWorkspace);
      // the page sorts alphabetically by workspace initially
      const googleWorkspace2 = generateGoogleWorkspace();
      const googleApp2 = generateTestAppWithGoogleWorkspace({}, googleWorkspace2);

      const azureApp1 = generateTestAppWithAzureWorkspace({ appType: appToolLabels.CROMWELL }, defaultAzureWorkspace);
      const azureWorkspace2 = generateAzureWorkspace();
      const azureApp2 = generateTestAppWithAzureWorkspace({ appType: appToolLabels.CROMWELL }, azureWorkspace2);
      asMockedFn(listWithoutProject).mockReturnValue(Promise.resolve([googleApp1, googleApp2, azureApp1, azureApp2]));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace, googleWorkspace2, defaultAzureWorkspace, azureWorkspace2],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row').slice(1); // skip header row
      const firstAppRow: HTMLElement = tableRows[0];
      expect(getTextContentForColumn(firstAppRow, 0)).toBe(googleApp1.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(firstAppRow, 1)).toBe(googleApp1.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(firstAppRow, 2)).toBe('Kubernetes');
      expect(getTextContentForColumn(firstAppRow, 3)).toBe(_.capitalize(googleApp1.appType));
      expect(getTextContentForColumn(firstAppRow, 5)).toBe(_.capitalize(googleApp1.status));
      expect(getTextContentForColumn(firstAppRow, 6)).toBe(defaultComputeZone.toLowerCase());
      expect(getTextContentForColumn(firstAppRow, 7)).toBe(Utils.makeCompleteDate(googleApp1.auditInfo.createdDate));
      expect(getTextContentForColumn(firstAppRow, 8)).toBe(Utils.makeCompleteDate(googleApp1.auditInfo.dateAccessed));

      const secondAppRow: HTMLElement = tableRows[1];
      expect(getTextContentForColumn(secondAppRow, 0)).toBe(googleApp2.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(secondAppRow, 1)).toBe(googleApp2.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(secondAppRow, 2)).toBe('Kubernetes');
      expect(getTextContentForColumn(secondAppRow, 3)).toBe(_.capitalize(googleApp2.appType));
      expect(getTextContentForColumn(secondAppRow, 5)).toBe(_.capitalize(googleApp2.status));
      expect(getTextContentForColumn(secondAppRow, 6)).toBe(defaultComputeZone.toLowerCase());
      expect(getTextContentForColumn(secondAppRow, 7)).toBe(Utils.makeCompleteDate(googleApp2.auditInfo.createdDate));
      expect(getTextContentForColumn(secondAppRow, 8)).toBe(Utils.makeCompleteDate(googleApp1.auditInfo.dateAccessed));

      const thirdAppRow: HTMLElement = tableRows[2];
      expect(getTextContentForColumn(thirdAppRow, 0)).toBe(azureApp1.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(thirdAppRow, 1)).toBe(azureApp1.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(thirdAppRow, 2)).toBe('Kubernetes');
      expect(getTextContentForColumn(thirdAppRow, 3)).toBe(_.capitalize(azureApp1.appType));
      expect(getTextContentForColumn(thirdAppRow, 5)).toBe(_.capitalize(azureApp1.status));
      expect(getTextContentForColumn(thirdAppRow, 6)).toBe(defaultComputeZone.toLowerCase());
      expect(getTextContentForColumn(thirdAppRow, 7)).toBe(Utils.makeCompleteDate(azureApp1.auditInfo.createdDate));
      expect(getTextContentForColumn(thirdAppRow, 8)).toBe(Utils.makeCompleteDate(azureApp1.auditInfo.dateAccessed));

      const fourthAppRow: HTMLElement = tableRows[3];
      expect(getTextContentForColumn(fourthAppRow, 0)).toBe(azureApp2.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(fourthAppRow, 1)).toBe(azureApp2.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(fourthAppRow, 2)).toBe('Kubernetes');
      expect(getTextContentForColumn(fourthAppRow, 3)).toBe(_.capitalize(azureApp2.appType));
      expect(getTextContentForColumn(fourthAppRow, 5)).toBe(_.capitalize(azureApp2.status));
      expect(getTextContentForColumn(fourthAppRow, 6)).toBe(defaultComputeZone.toLowerCase());
      expect(getTextContentForColumn(fourthAppRow, 7)).toBe(Utils.makeCompleteDate(azureApp2.auditInfo.createdDate));
      expect(getTextContentForColumn(fourthAppRow, 8)).toBe(Utils.makeCompleteDate(azureApp2.auditInfo.dateAccessed));
    });

    it.each([
      { app: generateTestAppWithGoogleWorkspace({}, defaultGoogleWorkspace), workspace: defaultGoogleWorkspace },
      { app: generateTestAppWithAzureWorkspace({}, defaultAzureWorkspace), workspace: defaultAzureWorkspace },
    ])('Renders app details view correctly', async ({ app, workspace }) => {
      asMockedFn(listWithoutProject).mockReturnValue(Promise.resolve([app]));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const appRow: HTMLElement = tableRows[1];
      const appDetailsButtonCell = getAllByRole(appRow, 'cell')[4];
      const button = getAllByRole(appDetailsButtonCell, 'button');
      expect(button.length).toBe(1);
      expect(button[0].textContent).toBe('view');
      fireEvent.click(button[0]);

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
    ])('Behaves properly when we click pause/delete for azure/gce app', async ({ app, workspace, isAzure }) => {
      const user = userEvent.setup();

      asMockedFn(listWithoutProject).mockReturnValue(Promise.resolve([app]));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      asMockedFn(getUser).mockReturnValue({
        email: app.auditInfo.creator,
      });

      const mockAppPauseFn = jest.fn();
      const mockAppWrapper = jest.fn(() => ({
        pause: mockAppPauseFn,
      }));

      const newMockAjax: Partial<AjaxContract> = {
        ...defaultMockAjax,
        Apps: { ...mockApps, app: mockAppWrapper } as unknown as AjaxContract['Apps'],
      };
      asMockedFn(useReplaceableAjaxExperimental).mockReturnValue(() => newMockAjax as AjaxContract);

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const app1Row: HTMLElement = tableRows[1];
      const app1ButtonsCell = getAllByRole(app1Row, 'cell')[10];
      const buttons1 = getAllByRole(app1ButtonsCell, 'button');

      // Assert
      expect(buttons1.length).toBe(2);
      expect(buttons1[0].textContent).toBe('Pause');

      // Pause button
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await user.click(buttons1[0]);
      if (!isAzure) {
        expect(mockAppWrapper).toHaveBeenCalledWith(expect.anything(), app.appName);
        expect(mockAppPauseFn).toHaveBeenCalled();
      } else {
        expect(consoleSpy).toHaveBeenCalledWith('Pause is not currently implemented for azure apps');
      }

      // Delete Button
      expect(buttons1[1].textContent).toBe('Delete');
      await user.click(buttons1[1]);
      screen.getByText('Delete cloud environment?');
    });
  });

  describe('Disks - ', () => {
    it('Renders page correctly with a disk', async () => {
      const disk = generateTestDiskWithGoogleWorkspace();
      asMockedFn(list).mockReturnValue(Promise.resolve([disk]));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const firstDiskRow: HTMLElement = tableRows[3];

      expect(getTextContentForColumn(firstDiskRow, 0)).toBe(disk.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(firstDiskRow, 1)).toBe(disk.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(firstDiskRow, 3)).toBe(`${disk.size}`);
      expect(getTextContentForColumn(firstDiskRow, 4)).toBe(disk.status);
      expect(getTextContentForColumn(firstDiskRow, 5)).toBe(disk.zone);
      expect(getTextContentForColumn(firstDiskRow, 6)).toBe(Utils.makeCompleteDate(disk.auditInfo.createdDate));
      expect(getTextContentForColumn(firstDiskRow, 7)).toBe(Utils.makeCompleteDate(disk.auditInfo.dateAccessed));
    });

    it('Renders page correctly with multiple workspaces/disks', async () => {
      const googleDisk1 = generateTestDiskWithGoogleWorkspace({}, defaultGoogleWorkspace);
      // the page sorts alphabetically by workspace initially
      const googleWorkspace2 = generateGoogleWorkspace();
      const googleDisk2 = generateTestDiskWithGoogleWorkspace({}, googleWorkspace2);

      const azureDisk1 = generateTestDiskWithAzureWorkspace({}, defaultAzureWorkspace);
      const azureWorkspace2 = generateAzureWorkspace();
      const azureDisk2 = generateTestDiskWithAzureWorkspace({}, azureWorkspace2);
      asMockedFn(list).mockReturnValue(Promise.resolve([googleDisk1, googleDisk2, azureDisk1, azureDisk2]));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [defaultGoogleWorkspace, googleWorkspace2, defaultAzureWorkspace, azureWorkspace2],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');

      const firstDiskRow: HTMLElement = tableRows[3];
      expect(getTextContentForColumn(firstDiskRow, 0)).toBe(googleDisk1.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(firstDiskRow, 1)).toBe(googleDisk1.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(firstDiskRow, 3)).toBe(`${googleDisk1.size}`);
      expect(getTextContentForColumn(firstDiskRow, 4)).toBe(googleDisk1.status);
      expect(getTextContentForColumn(firstDiskRow, 5)).toBe(googleDisk1.zone);
      expect(getTextContentForColumn(firstDiskRow, 6)).toBe(Utils.makeCompleteDate(googleDisk1.auditInfo.createdDate));
      expect(getTextContentForColumn(firstDiskRow, 7)).toBe(Utils.makeCompleteDate(googleDisk1.auditInfo.dateAccessed));

      const secondDiskRow: HTMLElement = tableRows[4];
      expect(getTextContentForColumn(secondDiskRow, 0)).toBe(googleDisk2.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(secondDiskRow, 1)).toBe(googleDisk2.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(secondDiskRow, 3)).toBe(`${googleDisk2.size}`);
      expect(getTextContentForColumn(secondDiskRow, 4)).toBe(googleDisk2.status);
      expect(getTextContentForColumn(secondDiskRow, 5)).toBe(googleDisk2.zone);
      expect(getTextContentForColumn(secondDiskRow, 6)).toBe(Utils.makeCompleteDate(googleDisk2.auditInfo.createdDate));
      expect(getTextContentForColumn(secondDiskRow, 7)).toBe(
        Utils.makeCompleteDate(googleDisk2.auditInfo.dateAccessed)
      );

      const thirdDiskRow: HTMLElement = tableRows[5];
      expect(getTextContentForColumn(thirdDiskRow, 0)).toBe(azureDisk1.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(thirdDiskRow, 1)).toBe(azureDisk1.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(thirdDiskRow, 3)).toBe(`${azureDisk1.size}`);
      expect(getTextContentForColumn(thirdDiskRow, 4)).toBe(azureDisk1.status);
      expect(getTextContentForColumn(thirdDiskRow, 5)).toBe(azureDisk1.zone);
      expect(getTextContentForColumn(thirdDiskRow, 6)).toBe(Utils.makeCompleteDate(azureDisk1.auditInfo.createdDate));
      expect(getTextContentForColumn(thirdDiskRow, 7)).toBe(Utils.makeCompleteDate(azureDisk1.auditInfo.dateAccessed));

      const fourthDiskRow: HTMLElement = tableRows[6];
      expect(getTextContentForColumn(fourthDiskRow, 0)).toBe(azureDisk2.labels.saturnWorkspaceNamespace);
      expect(getTextContentForColumn(fourthDiskRow, 1)).toBe(azureDisk2.labels.saturnWorkspaceName);
      expect(getTextContentForColumn(fourthDiskRow, 3)).toBe(`${azureDisk2.size}`);
      expect(getTextContentForColumn(fourthDiskRow, 4)).toBe(azureDisk2.status);
      expect(getTextContentForColumn(fourthDiskRow, 5)).toBe(azureDisk2.zone);
      expect(getTextContentForColumn(fourthDiskRow, 6)).toBe(Utils.makeCompleteDate(azureDisk2.auditInfo.createdDate));
      expect(getTextContentForColumn(fourthDiskRow, 7)).toBe(Utils.makeCompleteDate(azureDisk2.auditInfo.dateAccessed));
    });

    it.each([
      { disk: generateTestDiskWithGoogleWorkspace({}, defaultGoogleWorkspace), workspace: defaultGoogleWorkspace },
      { disk: generateTestDiskWithAzureWorkspace({}, defaultAzureWorkspace), workspace: defaultAzureWorkspace },
    ])('Renders disk details view correctly', async ({ disk, workspace }) => {
      asMockedFn(list).mockReturnValue(Promise.resolve([disk]));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const appRow: HTMLElement = tableRows[3];
      const appDetailsButtonCell = getAllByRole(appRow, 'cell')[2];
      const button = getAllByRole(appDetailsButtonCell, 'button');
      expect(button.length).toBe(1);
      expect(button[0].textContent).toBe('view');
      fireEvent.click(button[0]);

      screen.getByText(workspace.workspace.workspaceId);
      screen.getByText(disk.name);
      screen.getByText(disk.cloudContext.cloudResource);
    });

    it.each([
      { disk: generateTestDiskWithGoogleWorkspace({}, defaultGoogleWorkspace), workspace: defaultGoogleWorkspace },
      { disk: generateTestDiskWithAzureWorkspace({}, defaultAzureWorkspace), workspace: defaultAzureWorkspace },
    ])('Behaves properly when we click delete for azure/gce disk', async ({ disk, workspace }) => {
      const user = userEvent.setup();

      asMockedFn(list).mockReturnValue(Promise.resolve([disk]));
      asMockedFn(useWorkspaces).mockReturnValue({
        ...defaultUseWorkspacesProps,
        workspaces: [workspace],
      });

      const mockDeleteDiskV1 = jest.fn();
      const mockDeleteDiskV2 = jest.fn();
      const mockDisks = {
        disksV1: () => ({
          disk: () => ({
            delete: mockDeleteDiskV1,
          }),
          list,
        }),
        diskV2: () => ({
          delete: mockDeleteDiskV2,
        }),
      };

      const newMockAjax: Partial<AjaxContract> = {
        ...defaultMockAjax,
        Disks: mockDisks as unknown as AjaxContract['Disks'],
      };
      asMockedFn(useReplaceableAjaxExperimental).mockReturnValue(() => newMockAjax as AjaxContract);

      await act(async () => {
        render(h(Environments, { nav: defaultNav }));
      });

      const tableRows: HTMLElement[] = screen.getAllByRole('row');
      const disk1Row: HTMLElement = tableRows[3];
      const disk1ButtonsCell = getAllByRole(disk1Row, 'cell')[9];
      const buttons1 = getAllByRole(disk1ButtonsCell, 'button');

      // Assert
      expect(buttons1.length).toBe(1);

      // Delete Button
      expect(buttons1[0].textContent).toBe('Delete');
      await user.click(buttons1[0]);
      screen.getByText('Delete persistent disk?');
    });
  });
});

const getTextContentForColumn = (row, column) => getAllByRole(row, 'cell')[column].textContent;
