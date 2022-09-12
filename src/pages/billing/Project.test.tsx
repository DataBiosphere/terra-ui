import React from 'react'
import ProjectDetail from "./Project"
import {
  Ajax,
  AjaxContract,
  BillingContract,
  MetricsContract,
  BillingProjectUser,
  BillingProject,
  Workspace
} from "src/libs/ajax"
import { asMockedFn } from "src/libs/test-utils";
import * as StateHistory from "src/libs/state-history";
import { render, screen } from "@testing-library/react";
import { useWorkspaces } from "src/components/workspace-utils";
import { notify } from "src/libs/notifications";
import { h } from "src/libs/ts-hyperscript";

const metricsListener = jest.fn()

type NavExports = typeof import ('src/libs/nav')
jest.mock('src/libs/nav', (): NavExports => {
  const contract: Partial<NavExports> = {
    useRoute: jest.fn().mockReturnValue({
      query: { tab: 'members' }
    }),
    history: {
      location: {
        search: ''
      },
      replace: jest.fn()
    }
  }
  return contract as NavExports
})

type NotificationExports = typeof import ('src/libs/notifications')
jest.mock('src/libs/notifications', (): NotificationExports => {
  const contract: Partial<NotificationExports> = {
    notify: jest.fn().mockImplementation((...args) => {
      console.log("######################### notify")
      console.log({method: "notify", args: [...args] })
    })
  }
  return contract as NotificationExports;
})

// example of auto-mocking all exports to jest.fn() no-ops
jest.mock('src/libs/ajax')

jest.mock('src/libs/state-history')

type AuthExports = typeof import ('src/libs/auth')
jest.mock('src/libs/auth', (): AuthExports => {
  const contract: Partial<AuthExports> = {
    hasBillingScope: jest.fn(() => true),
    signOut: jest.fn(() => undefined),
    reloadAuthToken: jest.fn().mockResolvedValue(true)
  }
  return contract as AuthExports
})

// helpers

const mockAjax = (mock: Partial<AjaxContract>): AjaxContract => {
  const contract: Partial<AjaxContract> = {
    ...{
      Metrics: {
        captureEvent: metricsListener
      } as Partial<MetricsContract> as MetricsContract
    },
    ...mock
  }
  asMockedFn(Ajax).mockReturnValue(contract as AjaxContract)

  return contract as AjaxContract
}

type WorkspacesUtilsExports = typeof import('src/components/workspace-utils')
jest.mock('src/components/workspace-utils', (): WorkspacesUtilsExports => {
  const contract: Partial<WorkspacesUtilsExports> = {
    useWorkspaces: jest.fn(() => ({
      workspaces: [],
      loading: false,
      refresh: jest.fn()
    }))
  }
  return contract as WorkspacesUtilsExports
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Billing Project Detail', () => {
  it ('renders basics', async () => {
    // ARRANGE
    // testing a large component, so lots of arranging to do...

    const mockWorkspaces: Workspace[] = []

    const mockUsers: BillingProjectUser[] = [
      { email: 'testuser1@example.com', role: 'Owner' },
      { email: 'testuser2@example.com', role: 'Owner' },
      { email: 'testuser3@example.com', role: 'User' }
    ]
    const mockProjects: BillingProject[] = [
      {
        projectName: "test project 1",
        billingAccount: "b-acct-001",
        invalidBillingAccount: false,
        status: 'Ready',
        roles: ['Owner']
      }
    ]

    const mockedAjax = mockAjax({
      Workspaces: {
        // not needed because we are mocking useWorkspace hook, but shown here as example
        list: jest.fn(() => Promise.resolve(mockWorkspaces))
      } as Partial<AjaxContract['Workspaces']> as AjaxContract['Workspaces'],
      Billing: {
        listProjectUsers: jest.fn((): Promise<BillingProjectUser[]> => {
          console.log("############ listProjectUsers mock called")
          return Promise.resolve(mockUsers)
        }),
        listProjects: jest.fn((): Promise<BillingProject[]> => Promise.resolve(mockProjects)),
        // removeBillingAccount: jest.fn(),
        removeProjectUser: jest.fn(() => Promise.resolve([])),
      } as Partial<BillingContract> as BillingContract
    })

    asMockedFn(StateHistory.get).mockReturnValue({
      projectUsers: [
        { email: 'testuser1@example.com', roles: ['Owner'] },
        { email: 'testuser2@example.com', roles: ['Owner'] },
        { email: 'testuser3@example.com', roles: ['User'] }
      ]
    })

    asMockedFn(useWorkspaces).mockReturnValue({
      workspaces: mockWorkspaces,
      loading: false,
      refresh: jest.fn()
    })

    // watchers so we can assert calls if we want
    const watchAuth = jest.fn();
    const watchReload = jest.fn();

    // ACT
    render(h(ProjectDetail, {
      billingAccounts: {},
      billingProject: mockProjects[0],
      isOwner: true,
      isAlphaSpendReportUser: true,
      authorizeAndLoadAccounts: watchAuth,
      reloadBillingProject: watchReload
    }))

    // ASSERT
    // wait for component to process various data calls, etc. (initialization)
    let title = await screen.findByText('test project 1')

    expect(title).toBeTruthy()
    screen.getByText('testuser1@example.com')
    screen.getByText('testuser2@example.com')
    screen.getByText('testuser3@example.com')

    expect(mockedAjax.Billing.listProjectUsers).toBeCalledTimes(1);
  })
})
