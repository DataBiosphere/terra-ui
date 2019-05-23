import { faSquare } from '@fortawesome/free-regular-svg-icons'
import { faArrowRight, faCaretDown, faCheckSquare, faCreditCard, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import cardMenuIcon from 'src/icons/card-menu-icon'
import columnGrabber from 'src/icons/column_grabber'
import listAlt from 'src/icons/list-alt'
import loadingSpinner from 'src/icons/loading-spinner'
import renameIcon from 'src/icons/rename-icon'


const fa = shape => ({ size, ...props }) => h(FontAwesomeIcon, _.merge({ icon: shape, style: { height: size, width: size } }, props))
const custom = shape => ({ size, ...props }) => h(shape, _.merge({ style: { height: size, width: size } }, props))

const iconDict = {
  arrowRight: fa(faArrowRight),
  cardMenuIcon: custom(cardMenuIcon),
  caretDown: fa(faCaretDown),
  checkSquare: fa(faCheckSquare),
  columnGrabber: custom(columnGrabber),
  creditCard: fa(faCreditCard),
  listAlt: custom(listAlt),
  loadingSpinner: custom(loadingSpinner),
  purchaseOrder: fa(faFileInvoiceDollar),
  renameIcon: custom(renameIcon),
  square: fa(faSquare)
}

export default iconDict
