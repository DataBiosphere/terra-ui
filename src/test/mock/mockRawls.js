export const mockRawls = {
  workspacesList(success, _) {
    success([
      {
        accessLevel: 'PROJECT_OWNER',
        owners: ['alice@example.com'],
        public: false,
        workspace: {
          workspaceId: '7cf335a0-1ff4-4236-95d4-71b122f93223',
          bucketName: 'fc-7cf335a0-1ff4-4236-95d4-71b122f93223',
          namespace: 'broad-dsde-dev',
          name: 'large_sample_copy',
          createdBy: 'alice@example.com',
          createdDate: '2017-08-03T15:21:09.245Z',
          lastModified: '2018-02-11T16:17:33.779Z',
          isLocked: false,
          attributes: {
            'tag:tags': { itemsType: 'AttributeValue', items: ['asdf'] },
            description: ''
          },
          authorizationDomain: [],
          authDomainACLs: {
            OWNER: { groupName: '7cf335a0-1ff4-4236-95d4-71b122f93223-OWNER' },
            PROJECT_OWNER: { groupName: 'owner@broad-dsde-dev@billing-project' },
            READER: { groupName: '7cf335a0-1ff4-4236-95d4-71b122f93223-READER' },
            WRITER: { groupName: '7cf335a0-1ff4-4236-95d4-71b122f93223-WRITER' }
          },
          accessLevels: {
            OWNER: { groupName: '7cf335a0-1ff4-4236-95d4-71b122f93223-OWNER' },
            PROJECT_OWNER: { groupName: 'owner@broad-dsde-dev@billing-project' },
            READER: { groupName: '7cf335a0-1ff4-4236-95d4-71b122f93223-READER' },
            WRITER: { groupName: '7cf335a0-1ff4-4236-95d4-71b122f93223-WRITER' }
          }
        },
        workspaceSubmissionStats: { runningSubmissionsCount: 0 }
      },
      {
        accessLevel: 'NO ACCESS',
        owners: ['bob@example.com'],
        public: false,
        workspace: {
          workspaceId: 'c93dc6ce-c059-41f4-9173-a30831f8c96f',
          bucketName: 'fc-c93dc6ce-c059-41f4-9173-a30831f8c96f',
          namespace: 'broad-dsde-dev',
          name: 'test-mine',
          createdBy: 'bob@example.com',
          createdDate: '2016-09-01T12:37:25.114Z',
          lastModified: '2016-09-01T12:37:25.114Z',
          isLocked: false,
          attributes: { test: 'test', description: '' },
          authorizationDomain: [{ membersGroupName: 'TCGA-dbGaP-Authorized' }],
          authDomainACLs: {
            OWNER: { groupName: 'I_c93dc6ce-c059-41f4-9173-a30831f8c96f-OWNER' },
            PROJECT_OWNER: { groupName: 'I_c93dc6ce-c059-41f4-9173-a30831f8c96f-PROJECT_OWNER' },
            READER: { groupName: 'I_c93dc6ce-c059-41f4-9173-a30831f8c96f-READER' },
            WRITER: { groupName: 'I_c93dc6ce-c059-41f4-9173-a30831f8c96f-WRITER' }
          },
          accessLevels: {
            OWNER: { groupName: 'c93dc6ce-c059-41f4-9173-a30831f8c96f-OWNER' },
            PROJECT_OWNER: { groupName: 'owner@broad-dsde-dev@billing-project' },
            READER: { groupName: 'c93dc6ce-c059-41f4-9173-a30831f8c96f-READER' },
            WRITER: { groupName: 'c93dc6ce-c059-41f4-9173-a30831f8c96f-WRITER' }
          }
        },
        workspaceSubmissionStats: { runningSubmissionsCount: 0 }
      }
    ])
  }
}
