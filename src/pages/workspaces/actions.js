import { Rawls } from 'src/libs/ajax'


export const loadWorkspaces = () => (dispatch) => {
  dispatch({ type: 'Workspaces.load' })
  Rawls.workspacesList(
    workspaces => dispatch({ type: 'Workspaces.loadCompleted', workspaces }),
    failure => dispatch({ type: 'Workspaces.loadFailed', failure })
  )
}
