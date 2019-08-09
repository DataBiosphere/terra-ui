import {
  faClipboard, faClock, faClone, faEye, faFolder, faFolderOpen, faListAlt, faSquare as faSquareRegular, faTimesCircle
} from '@fortawesome/free-regular-svg-icons'
import {
  faArrowLeft, faArrowRight, faBan, faCaretDown, faCheck, faCheckCircle, faCheckSquare, faCloud, faCog, faCreditCard, faDownload, faExclamationCircle,
  faExclamationTriangle, faFileInvoiceDollar, faGripHorizontal, faInfoCircle, faLongArrowAltDown, faLongArrowAltUp, faMinusCircle, faPause, faPen,
  faPlay, faPlus, faPlusCircle, faQuestionCircle, faSearch, faShareAlt, faSquare as faSquareSolid, faTerminal, faTrashAlt
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import angleDoubleUp from 'src/icons/angle-double-up-regular.svg'
import angleUp from 'src/icons/angle-up-regular.svg'
import bars from 'src/icons/bars-light.svg'
import books from 'src/icons/books-solid.svg'
import cardMenuIcon from 'src/icons/card-menu-icon.svg'
import cloudUpload from 'src/icons/cloud-upload-solid.svg'
import columnGrabber from 'src/icons/column_grabber.svg'
import externalLinkAlt from 'src/icons/external-link-alt-regular.svg'
import fileExport from 'src/icons/file-export-regular.svg'
import list from 'src/icons/list-regular.svg'
import loadingSpinner from 'src/icons/loading-spinner.svg'
import renameIcon from 'src/icons/rename-icon.svg'
import syncAlt from 'src/icons/sync-alt-regular.svg'
import times from 'src/icons/times-light.svg'


const fa = _.curry((shape, { size, ...props }) => h(FontAwesomeIcon, _.merge({ icon: shape, style: { height: size, width: size } }, props)))
const custom = _.curry((shape, { size, className = '', ...props }) => h(shape,
  _.merge({ className: `svg-inline--fa ${className}`, 'aria-hidden': true, focusable: false, style: { height: size, width: size } }, props)))

const rotate = _.curry((rotation, shape, props) => shape(_.merge({ style: { transform: `rotate(${rotation}deg)` } }, props)))

const iconDict = {
  'angle-down': rotate(180, custom(angleUp)),
  'angle-left': rotate(-90, custom(angleUp)),
  'angle-right': rotate(90, custom(angleUp)),
  'angle-up': custom(angleUp),
  'angle-double-left': rotate(-90, custom(angleDoubleUp)),
  'angle-double-right': rotate(90, custom(angleDoubleUp)),
  ban: fa(faBan),
  bars: custom(bars),
  check: fa(faCheck),
  clock: fa(faClock),
  cloud: fa(faCloud),
  cog: fa(faCog),
  copy: fa(faClone),
  'copy-to-clipboard': fa(faClipboard),
  download: fa(faDownload),
  edit: fa(faPen),
  'error-standard': fa(faExclamationCircle),
  export: custom(fileExport),
  eye: fa(faEye),
  folder: fa(faFolder),
  'folder-open': fa(faFolderOpen),
  help: fa(faQuestionCircle),
  'info-circle': fa(faInfoCircle),
  library: custom(books),
  'long-arrow-alt-down': fa(faLongArrowAltDown),
  'long-arrow-alt-up': fa(faLongArrowAltUp),
  'minus-circle': fa(faMinusCircle),
  pause: fa(faPause),
  play: fa(faPlay),
  plus: fa(faPlus),
  'plus-circle': fa(faPlusCircle),
  'pop-out': custom(externalLinkAlt),
  search: fa(faSearch),
  share: fa(faShareAlt),
  'success-standard': fa(faCheckCircle),
  sync: custom(syncAlt),
  terminal: props => fa(faTerminal, { mask: faSquareSolid, transform: 'shrink-8', ...props }),
  times: custom(times),
  'times-circle': fa(faTimesCircle),
  trash: fa(faTrashAlt),
  'upload-cloud': custom(cloudUpload),
  'view-cards': fa(faGripHorizontal),
  'view-list': custom(list),
  'warning-standard': fa(faExclamationTriangle),
  arrowLeft: fa(faArrowLeft),
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
  square: fa(faSquareRegular)
}

export default iconDict
