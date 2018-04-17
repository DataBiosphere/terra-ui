import mixinDeep from 'mixin-deep'


// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4()
}

function createWorkspace(overrides) {
  let workspaceId = guid()

  return mixinDeep({
    accessLevel: 'NO ACCESS',
    owners: ['bob@example.com'],
    public: false,
    workspace: {
      workspaceId: workspaceId,
      bucketName: `fc-${workspaceId}`,
      namespace: 'broad-dsde-dev',
      name: 'large_sample_copy',
      createdBy: 'alice@example.com',
      createdDate: '2017-08-03T15:21:09.245Z',
      lastModified: '2018-02-11T16:17:33.779Z',
      isLocked: false,
      attributes: { description: '' },
      authorizationDomain: [],
      authDomainACLs: {
        OWNER: { groupName: `${workspaceId}-OWNER` },
        PROJECT_OWNER: { groupName: 'owner@broad-dsde-dev@billing-project' },
        READER: { groupName: `${workspaceId}-READER` },
        WRITER: { groupName: `${workspaceId}-WRITER` }
      },
      accessLevels: {
        OWNER: { groupName: `${workspaceId}-OWNER` },
        PROJECT_OWNER: { groupName: 'owner@broad-dsde-dev@billing-project' },
        READER: { groupName: `${workspaceId}-READER` },
        WRITER: { groupName: `${workspaceId}-WRITER` }
      }
    },
    workspaceSubmissionStats: { runningSubmissionsCount: 0 }
  }, overrides)
}

export const mockListWorkspacesResponse = {
  workspacesList(success, _) {
    success([
      createWorkspace(),
      createWorkspace()
    ])
  }
}

export const mockWorkspaceDetailsResponse = {
  workspaceDetails(namespace, name, success, _) {
    success(createWorkspace({ namespace, name }))
  }
}
