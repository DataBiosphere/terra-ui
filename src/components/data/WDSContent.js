import { Fragment, useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import DataTable from 'src/components/data/DataTable'
import { wdsToEntityServiceMetadata } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider'
import { isRadX } from 'src/libs/brand-utils'
import colors from 'src/libs/colors'


const WDSContent = ({
  workspace,
  workspace: {
    workspace: { namespace, name, googleProject }
  },
  recordType,
  wdsSchema,
  dataProvider
}) => {
  // State
  const [refreshKey] = useState(0)

  // Render
  const entityMetadata = wdsToEntityServiceMetadata(wdsSchema)

  return h(Fragment, [
    h(DataTable, {
      dataProvider,
      persist: true,
      refreshKey,
      editable: false,
      entityType: recordType,
      activeCrossTableTextFilter: false,
      entityMetadata,
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
