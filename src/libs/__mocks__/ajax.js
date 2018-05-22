import _ from 'lodash/fp'


export const createWorkspace = overrides => {
  const workspaceId = _.uniqueId('workspace')

  return _.merge({
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

export const Rawls = {
  workspacesList() {
    return Promise.resolve([createWorkspace(), createWorkspace()])
  },

  workspace(namespace, name) {
    return {
      details() {
        return Promise.resolve(createWorkspace({ namespace, name }))
      }
    }
  }
}
