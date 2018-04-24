import { Record } from 'immutable'
import _ from 'lodash'
import { workspaceAccessLevels } from 'src/libs/utils'


export const initialState = new (Record({
  workspaces: new (Record({
    filter: '',
    listView: false,
    itemsPerPage: 6,
    pageNumber: 1,
    workspaces: null,
    failure: undefined,
  }))()
}))()

export const reducers = {
  'Workspaces.setFilter': (state, { filter }) => {
    return state.mergeIn(['workspaces'], { filter })
  },

  'Workspaces.setListView': (state, { listView }) => {
    return state.mergeIn(['workspaces'], { listView })
  },

  'Workspaces.setItemsPerPage': (state, { itemsPerPage }) => {
    return state.mergeIn(['workspaces'], { itemsPerPage })
  },

  'Workspaces.setPageNumber': (state, { pageNumber }) => {
    return state.mergeIn(['workspaces'], { pageNumber })
  },

  'Workspaces.loadCompleted': (state, { workspaces }) => {
    return state.setIn(['workspaces', 'workspaces'], _.sortBy(_.filter(workspaces,
      ws => !ws.public || workspaceAccessLevels.indexOf(ws.accessLevel) > workspaceAccessLevels.indexOf('READER')),
      'workspace.name'))
  },

  'Workspaces.loadFailed': (state, { failure }) => {
    return state.mergeIn(['workspaces'], { failure })
  }
}
