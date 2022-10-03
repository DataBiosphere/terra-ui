import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import DataTable from 'src/components/data/DataTable'
import { isRadX } from 'src/libs/brand-utils'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'


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
  const [selectedEntities] = useState({})
  const [refreshKey] = useState(0)

  // const [selectedEntities, setSelectedEntities] = useState({})
  // const [refreshKey, setRefreshKey] = useState(0)

  // Render
  const selectedKeys = _.keys(selectedEntities)
  const selectedLength = selectedKeys.length

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
      childrenBefore: () => div({ style: { display: 'flex', alignItems: 'center', flex: 'none' } }, [
        div({ style: { margin: '0 1.5rem', height: '100%', borderLeft: Style.standardLine } }),
        div({
          role: 'status',
          'aria-atomic': true,
          style: { marginRight: '0.5rem' }
        }, [`${selectedLength} row${selectedLength === 1 ? '' : 's'} selected`])
      ]),
      controlPanelStyle: {
        background: colors.light(isRadX() ? 0.3 : 1),
        borderBottom: `1px solid ${colors.grey(0.4)}`
      },
      border: false
    })
  ])
}

export default WDSContent
