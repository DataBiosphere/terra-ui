import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { act } from 'react-dom/test-utils'
import { h } from 'react-hyperscript-helpers'
import Alerts from 'src/components/Alerts'
import { Ajax } from 'src/libs/ajax'
import { forwardRefWithName } from 'src/libs/react-utils'
import { WorkspaceData } from 'src/pages/workspaces/workspace/Data'
import React from 'react';
import { authStore } from 'src/libs/state'
import { WorkspaceNotifications } from 'src/pages/workspaces/workspace/Dashboard'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


jest.mock('src/libs/ajax')

describe('Data', () => {
  const testWorkspaceDataProps = {
    workspace: {
      workspaceSubmissionStats: {
        runningSubmissionsCount: 0
      },
      accessLevel: 'OWNER',
      owners: [
        'userA@broadinstitute.org',
        'userB@broadinstitute.org'
      ],
      workspace: {
        attributes: {
          description: ''
        },
        authorizationDomain: [],
        billingAccount: 'billingAccounts/00708C-45D19D-27AAFA',
        bucketName: 'fc-937a6d2b-5bf7-451e-bd1c-166d45faf09d',
        cloudPlatform: 'Gcp',
        createdBy: 'userA@broadinstitute.org',
        createdDate: '2022-12-21T20:40:01.759Z',
        googleProject: 'terra-dev-ef59ff0b',
        googleProjectNumber: '468685965429',
        isLocked: false,
        lastModified: '2022-12-22T15:10:36.277Z',
        name: 'awesome-test-workspace-ame',
        namespace: 'awesome-dev-billing-account',
        workflowCollectionName: '5e847339-393e-4080-a69f-830e2aefbeac',
        workspaceId: '5e847339-393e-4080-a69f-830e2aefbeac',
        workspaceType: 'rawls',
        workspaceVersion: 'v2'
      },
      canShare: true,
      canCompute: true
    }
  }

  // WorkspaceData functions
  // {
  //   getSchema: [AsyncFunction: getSchema],
  //   getRecords: [AsyncFunction: getRecords],
  //   deleteTable: [AsyncFunction: deleteTable],
  //   downloadTsv: [AsyncFunction: downloadTsv],
  //   uploadTsv: [AsyncFunction: uploadTsv]
  // }

  it('this is a fun test', () => {
    const wrapWorkspaceParams = {"activeTab":"job history","title":"Job History"}
    const childUseRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: null });
    const controllerUseRefSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: null });
    const useOnMountUseEffectSpy = jest.spyOn(React, 'useEffect').mockReturnValueOnce({ current: null });
    const accessErrorUseStateSpy = jest.spyOn(React, 'useState').mockReturnValueOnce([false, false]);
    const accessNotificationIdSpy = jest.spyOn(React, 'useRef').mockReturnValueOnce({ current: null });
    const UseStoreUseStateSpy = jest.spyOn(React, 'useState').mockReturnValueOnce([false, false]);
    const useStoreUseEffectSpy = jest.spyOn(React, 'useEffect').mockReturnValueOnce({ current: null });
    const x = WorkspaceData(testWorkspaceDataProps)
    // console.log(render(y))
    expect(1).toBe(1)
  })
})
