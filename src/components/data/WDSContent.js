import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import DataTable from 'src/components/data/DataTable'
import { WDSDataTableProvider } from 'src/libs/ajax/data-table-providers/WDSDataTableProvider'
import { isRadX } from 'src/libs/brand-utils'
import colors from 'src/libs/colors'

// map the WDS schema response payload to the Entity Service metadata response
const asEntityMetadata = wdsSchema => _.mapValues(typeDef => {
  return { count: typeDef.count, attributeNames: _.map(attr => attr.name, typeDef.attributes), idName: 'sys_name' }
}, _.keyBy(typeDef => typeDef.name, wdsSchema))


const WDSContent = ({
  workspace,
  workspace: {
    workspace: { namespace, name, googleProject, workspaceId }
  },
  recordType,
  wdsSchema

}) => {
  // State
  const [refreshKey] = useState(0)

  // TODO: something in state management, setEntityMetadata, and/or loadMetadata need to change; reloading the page causes errors

  // Render
  const entityMetadata = asEntityMetadata(wdsSchema)
  const dataProvider = new WDSDataTableProvider(workspaceId)

  return h(Fragment, [
    h(DataTable, {
      dataProvider,
      persist: true,
      refreshKey,
      editable: false,
      entityType: recordType,
      activeCrossTableTextFilter: false,
      entityMetadata,
      setEntityMetadata: () => entityMetadata,
      loadMetadata: () => entityMetadata,
      googleProject,
      workspaceId: { namespace, name },
      workspace,
      snapshotName: undefined,
      selectionModel: {
        selected: [],
        setSelected: () => []
      },
      childrenBefore: undefined,
      enableSearch: false,
      controlPanelStyle: {
        background: colors.light(isRadX() ? 0.3 : 1),
        borderBottom: `1px solid ${colors.grey(0.4)}`
      },
      border: false
    })
  ])
}

export default WDSContent
