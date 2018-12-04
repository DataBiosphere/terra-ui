import '@webcomponents/custom-elements' // must be before icons

import { ClarityIcons } from '@clr/icons'
import '@clr/icons/clr-icons.css'
import '@clr/icons/shapes/all-shapes'
import _ from 'lodash/fp'
import { h, img } from 'react-hyperscript-helpers'
import browse from 'src/icons/browse.svg'
import caretDown from 'src/icons/caret-down.svg'
import checkSquare from 'src/icons/check-square.svg'
import columnGrabber from 'src/icons/column_grabber.svg'
import explore from 'src/icons/explore.svg'
import home from 'src/icons/home.svg'
import jupyterIcon from 'src/icons/jupyter.svg'
import listAlt from 'src/icons/list-alt.svg'
import loadingSpinner from 'src/icons/loading-spinner.svg'
import logoWhite from 'src/icons/logo-grey.svg'
import logoIcon from 'src/icons/logo.svg'
import notebooks from 'src/icons/notebooks.svg'
import square from 'src/icons/square.svg'
import table from 'src/icons/table.svg'
import cardMenuIcon from 'src/icons/card-menu-icon.svg'
import renameIcon from 'src/icons/rename-icon.svg'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'


ClarityIcons.add({
  browse, caretDown, checkSquare, columnGrabber, explore, home, jupyterIcon, listAlt, loadingSpinner, logoWhite, logoIcon, notebooks, square, table, cardMenuIcon, renameIcon
})

/**
 * Creates a Clarity icon.
 * @param {string} shape - see {@link https://vmware.github.io/clarity/icons/icon-sets}
 * @param {object} [props]
 */
export const icon = function(shape, { className, ...props } = {}) {
  return h('clr-icon', _.merge({ shape, class: className }, props))
}

export const breadcrumb = function(props) {
  return icon('angle right', _.merge({ size: 10, style: { margin: '0 0.25rem' } }, props))
}

export const logo = function(props) {
  return icon('logoIcon', _.merge({ size: 63, style: { marginRight: '0.5rem' } }, props))
}

export const spinner = function(props) {
  return icon('loadingSpinner',
    _.merge({ size: 24, style: { color: colors.blue[1] } }, props))
}

export const centeredSpinner = function(props) {
  return spinner(_.merge({ size: 48, style: { display: 'block', margin: 'auto' } }, props))
}

export const profilePic = ({ size, style, ...props } = {}) => img({
  src: getUser().imageUrl,
  height: size, width: size,
  style: { borderRadius: '100%', ...style },
  ...props
})
