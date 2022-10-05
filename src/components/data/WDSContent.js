import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import DataTable from 'src/components/data/DataTable'
import { isRadX } from 'src/libs/brand-utils'
import colors from 'src/libs/colors'

// This was copied from EntitiesContent, then I deleted lots and lots of stuff

// map the WDS schema response payload to the Entity Service metadata response
const asEntityMetadata = wdsSchema => _.mapValues(typeDef => {
  return { count: typeDef.count, attributeNames: _.map(attr => attr.name, typeDef.attributes), idName: 'sys_name' }
}, _.keyBy(typeDef => typeDef.name, wdsSchema))


const WDSContent = ({
  workspace,
  workspace: {
    workspace: { namespace, name, googleProject }
  },
  recordType,
  wdsSchema

}) => {
  // State
  const [refreshKey] = useState(0)

  // const [selectedEntities, setSelectedEntities] = useState({})
  // const [refreshKey, setRefreshKey] = useState(0)

  // Render

  const entityMetadata = asEntityMetadata(wdsSchema)


  return h(Fragment, [
    h(DataTable, {
      persist: true,
      refreshKey,
      editable: false,
      entityType: recordType,
      activeCrossTableTextFilter: false,
      entityMetadata,
      setEntityMetadata: () => entityMetadata,
      loadMetadata: () => entityMetadata,
      loadRowDataStrategy: 'wds',
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
