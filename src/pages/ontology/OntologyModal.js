import { div } from 'react-hyperscript-helpers'
import { withModalDrawer } from 'src/components/ModalDrawer'


export const OntologyModal = withModalDrawer({ width: 675 })(() => {
  return div('hello world!')
})
