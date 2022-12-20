import { div, h } from 'react-hyperscript-helpers'
import Clickable from 'src/components/common/Clickable'
import Link from 'src/components/common/Link'
import { MiniSortable } from 'src/components/table'
import * as Utils from 'src/libs/utils'


export * from 'src/components/common/buttons'
export * from 'src/components/common/Checkbox'
export * from 'src/components/common/DeleteConfirmationModal'
export * from 'src/components/common/FocusTrapper'
export * from 'src/components/common/IdContainer'
export * from 'src/components/common/RadioButton'
export * from 'src/components/common/Select'
export * from 'src/components/common/spinners'
export * from 'src/components/common/Switch'
export { Clickable, Link }


export const HeaderRenderer = ({ name, label, sort, onSort, style, ...props }) => h(MiniSortable, { sort, field: name, onSort }, [
  div({ style: { fontWeight: 600, ...style }, ...props }, [label || Utils.normalizeLabel(name)])
])
