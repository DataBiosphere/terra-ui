import { faClipboard, faClock, faClone, faEye, faFolder, faFolderOpen, faListAlt, faSquare, faTimesCircle } from '@fortawesome/free-regular-svg-icons'
import {
  faAngleDoubleLeft, faAngleDoubleRight, faAngleDown, faAngleLeft, faAngleRight, faAngleUp, faArrowRight, faBan, faBars, faCaretDown, faCheck,
  faCheckCircle, faCheckSquare, faCloud, faCog, faCreditCard, faDownload, faEllipsisV, faExclamationCircle, faExclamationTriangle,
  faFileInvoiceDollar, faInfoCircle, faList, faMinusCircle, faPause, faPen, faPlay, faPlus, faPlusCircle, faQuestionCircle, faSearch, faShareAlt,
  faSortDown, faSortUp, faSync, faTerminal, faThLarge, faTimes, faTrashAlt
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import booksSolid from 'src/icons/books-solid'
import cardMenuIcon from 'src/icons/card-menu-icon'
import cloudUploadSolid from 'src/icons/cloud-upload-solid'
import columnGrabber from 'src/icons/column_grabber'
import externalLinkAltRegular from 'src/icons/external-link-alt-regular'
import fileExportRegular from 'src/icons/file-export-regular'
import loadingSpinner from 'src/icons/loading-spinner'
import renameIcon from 'src/icons/rename-icon'
import sortLight from 'src/icons/sort-light'


const fa = shape => ({ size, ...props }) => h(FontAwesomeIcon, _.merge({ icon: shape, style: { height: size, width: size } }, props))
const custom = shape => ({ size, ...props }) => h(shape, _.merge({ style: { height: size, width: size } }, props))

const iconDict = {
  'angle down': fa(faAngleDown),
  'angle left': fa(faAngleLeft),
  'angle right': fa(faAngleRight),
  'angle up': fa(faAngleUp),
  'angle-double left': fa(faAngleDoubleLeft),
  'angle-double right': fa(faAngleDoubleRight),
  'ban': fa(faBan),
  'bars': fa(faBars),
  'check': fa(faCheck),
  'clock': fa(faClock),
  'cloud': fa(faCloud),
  'cog': fa(faCog),
  'copy': fa(faClone),
  'copy-to-clipboard': fa(faClipboard),
  'download': fa(faDownload),
  'edit': fa(faPen),
  'ellipsis-vertical': fa(faEllipsisV),
  'error-standard': fa(faExclamationCircle),
  'export': custom(fileExportRegular),
  'eye': fa(faEye),
  'folder': fa(faFolder),
  'folder-open': fa(faFolderOpen),
  'help': fa(faQuestionCircle),
  'info-circle': fa(faInfoCircle),
  'library': custom(booksSolid),
  'minus-circle': fa(faMinusCircle),
  'pause': fa(faPause),
  'play': fa(faPlay),
  'plus': fa(faPlus),
  'plus-circle': fa(faPlusCircle),
  'pop-out': custom(externalLinkAltRegular),
  'search': fa(faSearch),
  'share': fa(faShareAlt),
  'sort': custom(sortLight),
  'sort-down': fa(faSortDown),
  'sort-up': fa(faSortUp),
  'success-standard': fa(faCheckCircle),
  'sync': fa(faSync),
  'terminal': fa(faTerminal),
  'times': fa(faTimes),
  'times-circle': fa(faTimesCircle),
  'trash': fa(faTrashAlt),
  'upload-cloud': custom(cloudUploadSolid),
  'view-cards': fa(faThLarge),
  'view-list': fa(faList),
  'warning-standard': fa(faExclamationTriangle),
  arrowRight: fa(faArrowRight),
  cardMenuIcon: custom(cardMenuIcon),
  caretDown: fa(faCaretDown),
  checkSquare: fa(faCheckSquare),
  columnGrabber: custom(columnGrabber),
  creditCard: fa(faCreditCard),
  listAlt: fa(faListAlt),
  loadingSpinner: custom(loadingSpinner),
  purchaseOrder: fa(faFileInvoiceDollar),
  renameIcon: custom(renameIcon),
  square: fa(faSquare)
}

export default iconDict
