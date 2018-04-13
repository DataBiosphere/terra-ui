import React from 'react'
import { configure, mount } from 'enzyme'
import { WorkspaceList } from './List'
import Adapter from 'enzyme-adapter-react-16'
import * as Main from 'src/pages/Main'

configure({ adapter: new Adapter() });

Main.initNavPaths()

const mockRawls = {
  workspacesList(success, _) {
    success([
      {
        'workspaceSubmissionStats': { 'runningSubmissionsCount': 0 },
        'accessLevel': 'PROJECT_OWNER', 'owners': ['mbemis.firecloud@gmail.com'], 'public': false,
        'workspace': {
          'workspaceId': '7cf335a0-1ff4-4236-95d4-71b122f93223', 'name': 'large_sample_copy',
          'isLocked': false, 'lastModified': '2018-02-11T16:17:33.779Z', 'attributes': {
            'tag:tags': { 'itemsType': 'AttributeValue', 'items': ['asdf'] }, 'description': ''
          }, 'createdBy': 'mbemis.firecloud@gmail.com', 'authDomainACLs': {
            'OWNER': { 'groupName': '7cf335a0-1ff4-4236-95d4-71b122f93223-OWNER' },
            'PROJECT_OWNER': { 'groupName': 'owner@broad-dsde-dev@billing-project' },
            'READER': { 'groupName': '7cf335a0-1ff4-4236-95d4-71b122f93223-READER' },
            'WRITER': { 'groupName': '7cf335a0-1ff4-4236-95d4-71b122f93223-WRITER' }
          }, 'bucketName': 'fc-7cf335a0-1ff4-4236-95d4-71b122f93223', 'namespace': 'broad-dsde-dev',
          'authorizationDomain': [], 'createdDate': '2017-08-03T15:21:09.245Z', 'accessLevels': {
            'OWNER': { 'groupName': '7cf335a0-1ff4-4236-95d4-71b122f93223-OWNER' },
            'PROJECT_OWNER': { 'groupName': 'owner@broad-dsde-dev@billing-project' },
            'READER': { 'groupName': '7cf335a0-1ff4-4236-95d4-71b122f93223-READER' },
            'WRITER': { 'groupName': '7cf335a0-1ff4-4236-95d4-71b122f93223-WRITER' }
          }
        }
      }, {
        'workspaceSubmissionStats': { 'runningSubmissionsCount': 0 }, 'accessLevel': 'NO ACCESS',
        'owners': ['mbemis.firecloud@gmail.com'], 'public': false, 'workspace': {
          'workspaceId': 'c93dc6ce-c059-41f4-9173-a30831f8c96f', 'name': 'test-mine',
          'isLocked': false, 'lastModified': '2016-09-01T12:37:25.114Z',
          'attributes': { 'test': 'test', 'description': '' },
          'createdBy': 'mbemis.firecloud@gmail.com', 'authDomainACLs': {
            'OWNER': { 'groupName': 'I_c93dc6ce-c059-41f4-9173-a30831f8c96f-OWNER' },
            'PROJECT_OWNER': { 'groupName': 'I_c93dc6ce-c059-41f4-9173-a30831f8c96f-PROJECT_OWNER' },
            'READER': { 'groupName': 'I_c93dc6ce-c059-41f4-9173-a30831f8c96f-READER' },
            'WRITER': { 'groupName': 'I_c93dc6ce-c059-41f4-9173-a30831f8c96f-WRITER' }
          }, 'bucketName': 'fc-c93dc6ce-c059-41f4-9173-a30831f8c96f', 'namespace': 'broad-dsde-dev',
          'authorizationDomain': [{ 'membersGroupName': 'TCGA-dbGaP-Authorized' }],
          'createdDate': '2016-09-01T12:37:25.114Z', 'accessLevels': {
            'OWNER': { 'groupName': 'c93dc6ce-c059-41f4-9173-a30831f8c96f-OWNER' },
            'PROJECT_OWNER': { 'groupName': 'owner@broad-dsde-dev@billing-project' },
            'READER': { 'groupName': 'c93dc6ce-c059-41f4-9173-a30831f8c96f-READER' },
            'WRITER': { 'groupName': 'c93dc6ce-c059-41f4-9173-a30831f8c96f-WRITER' }
          }
        }
      }
    ])
  }
}

describe('WorkspaceList', () => {
  it('should render a TopBar and DataGrid', () => {
    const wrapper = mount(React.createElement(WorkspaceList, { Rawls: mockRawls }))
    expect(wrapper.find('TopBar').length).toEqual(1)
    expect(wrapper.find('DataGrid').length).toEqual(1)
  })

  it('should switch between Grid and list view', () => {
    const wrapper = mount(React.createElement(WorkspaceList, { Rawls: mockRawls }))
    expect(wrapper.find('DataGrid').length).toEqual(1)
    expect(wrapper.find('DataGrid[cardsPerRow=1]').length).toEqual(0)

    wrapper.find('clr-icon[shape="view-list"]').simulate('click')
    expect(wrapper.find('DataGrid').length).toEqual(1)
    expect(wrapper.find('DataGrid[cardsPerRow=1]').length).toEqual(1)

    wrapper.find('clr-icon[shape="view-cards"]').simulate('click')
    expect(wrapper.find('DataGrid').length).toEqual(1)
    expect(wrapper.find('DataGrid[cardsPerRow=1]').length).toEqual(0)
  })
})
