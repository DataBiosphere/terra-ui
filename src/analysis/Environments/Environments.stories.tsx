import React, {useState, useEffect, Fragment} from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import {atom, delay} from '@terra-ui-packages/core-utils';

import {Environments, EnvironmentsProps} from 'src/analysis/Environments/Environments';
import {GetAppItem} from "src/libs/ajax/leonardo/models/app-models";
import { defaultAzureWorkspace, defaultGoogleWorkspace } from 'src/testing/workspace-fixtures';
import {
  azureRuntime,
  generateTestDiskWithGoogleWorkspace,
  generateTestListGoogleRuntime
} from "src/analysis/_testData/testData";
import {ListRuntimeItem} from "src/libs/ajax/leonardo/models/runtime-models";
import {RuntimeBasics} from "src/libs/ajax/leonardo/providers/LeoRuntimeProvider";
import {RuntimeWrapper} from "src/libs/ajax/leonardo/Runtimes";
import {UseWorkspaces} from "src/workspaces/useWorkspaces.models";
import {WorkspaceWrapper} from "src/libs/workspace-utils";
import {PersistentDisk} from "src/libs/ajax/leonardo/models/disk-models";
import {DiskBasics} from "src/libs/ajax/leonardo/providers/LeoDiskProvider";
import {NotificationsContract, NotificationsProvider} from "@terra-ui-packages/notifications";

const meta: Meta<typeof Environments> = {
  title: 'Packages/Analysis/Environments',
  component: Environments,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Environments>;

const actionLogAsyncFn = (name: string) => {
  const storyAlert = async (...args: any[]) => {
    const log = [name + ' method called with:', ...args];
    action(name)(log);
    //alert(JSON.stringify(log));
    console.log(log);
  }
  return storyAlert
}

const runtimesStore = atom<ListRuntimeItem[]>([]);
const disksStore = atom<PersistentDisk[]>([]);

const getMockLeoApps = (): EnvironmentsProps['leoAppData'] => {
  return ({
    listWithoutProject: async () => Promise.resolve([]),
    get: async () => Promise.resolve({} as GetAppItem),
    pause: actionLogAsyncFn('leoAppData.pause'),
    delete: actionLogAsyncFn('leoAppData.delete'),
  })
}

const getMockLeoRuntimes = (): EnvironmentsProps['leoRuntimeData'] => {
  action('useMockLeoRuntimes hook hit')();
  return ({
    list: async () => {
      await actionLogAsyncFn('leoRuntimeData.list')(runtimesStore.get());
      return runtimesStore.get();
    },
    stop: async(runtime: RuntimeWrapper) => {
      const copy: ListRuntimeItem[] = [];
      runtimesStore.get().forEach((r) => copy.push({
        ...r,
        status: (r.runtimeName === runtime.runtimeName) ? 'Stopped' : r.status
      }))
      runtimesStore.set(copy);
      await actionLogAsyncFn('leoRuntimeData.stop')(runtime);
    } ,
    delete: async(runtime: RuntimeBasics) => {
      const updated = runtimesStore.get().filter((item) => item.runtimeName !== runtime.runtimeName);
      runtimesStore.set(updated);
      await actionLogAsyncFn('leoRuntimeData.delete')(runtime);
    }
  })
}

const getMockLeoDisks = (): EnvironmentsProps['leoDiskData'] => {
  return ({
    list: async () => Promise.resolve(disksStore.get()),
    delete: async(disk: DiskBasics) => {
      const updated = disksStore.get().filter((d: PersistentDisk) => d.name !== disk.name);
      disksStore.set(updated);
      actionLogAsyncFn('leoDiskData.delete')(disk);
    },
  })
}

const getMockUseWorkspaces = (mockResults: WorkspaceWrapper[]): EnvironmentsProps['useWorkspaces'] => {
  const mockHook: UseWorkspaces = () => {
    const [loading, setLoading] = useState<boolean>(false);

    return ({
      workspaces: mockResults,
      loading,
      refresh: async () => {
        setLoading(true);
        await delay(1000);
        setLoading(false)
      }
    })
  }
  return mockHook;
}

const getMockMetrics = (): EnvironmentsProps['metrics']  => ({
  captureEvent: actionLogAsyncFn('metrics.captureEvent')
});

const getMockNav = (): EnvironmentsProps['nav'] => ({
  navTo: (navKey) => alert(navKey),
  getUrl: (navKey, args) =>
      `javascript:alert('nav to ${navKey} with: ${JSON.stringify(args)}')`
});

const mockNotifications: NotificationsContract = {
  notify: actionLogAsyncFn('Notifications.notify')
}

export const HappyEnvironments: Story = {
  render: () => {
    action('Environments render')();
    useEffect(() => {
      runtimesStore.set([ generateTestListGoogleRuntime(), azureRuntime ])
      disksStore.set([ generateTestDiskWithGoogleWorkspace() ])
    }, [])
    return (
      <NotificationsProvider notifications={mockNotifications}>
        <Environments
          nav={getMockNav()}
          useWorkspaces={getMockUseWorkspaces([ defaultGoogleWorkspace, defaultAzureWorkspace ])}
          leoAppData={getMockLeoApps()}
          leoRuntimeData={getMockLeoRuntimes()}
          leoDiskData={getMockLeoDisks()}
          metrics={getMockMetrics()}
          permissions={{
            canDeleteDisk: () => true,
            canPauseResource: () => true
          }}
        />
      </NotificationsProvider>)
  },
};

export const NoEnvironments: Story = {
  render: () => {
    action('Environments render')();
    useEffect(() => {
      runtimesStore.set([])
      disksStore.set([])
    }, [])
    return (
      <NotificationsProvider notifications={mockNotifications}>
        <Environments
        nav={getMockNav()}
        useWorkspaces={getMockUseWorkspaces([ defaultGoogleWorkspace, defaultAzureWorkspace ])}
        leoAppData={getMockLeoApps()}
        leoRuntimeData={getMockLeoRuntimes()}
        leoDiskData={getMockLeoDisks()}
        metrics={getMockMetrics()}
        permissions={{
          canDeleteDisk: () => true,
          canPauseResource: () => true
        }}
      />
    </NotificationsProvider>)
  },
};

export const DeleteError: Story = {
  render: () => {
    action('Environments render')();
    useEffect(() => {
      runtimesStore.set([ generateTestListGoogleRuntime(), azureRuntime ])
      disksStore.set([ generateTestDiskWithGoogleWorkspace() ])
    }, [])
    return (
      <NotificationsProvider notifications={mockNotifications}>
        <Environments
        nav={getMockNav()}
        useWorkspaces={getMockUseWorkspaces([ defaultGoogleWorkspace, defaultAzureWorkspace ])}
        leoAppData={getMockLeoApps()}
        leoRuntimeData={{
          ...getMockLeoRuntimes(),
          delete: () => Promise.reject(Error('BOOM!'))
        }}
        leoDiskData={getMockLeoDisks()}
        metrics={getMockMetrics()}
        permissions={{
          canDeleteDisk: () => true,
          canPauseResource: () => true
        }}
      />
    </NotificationsProvider>)
  },
};
