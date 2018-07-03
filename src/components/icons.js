import { ClarityIcons } from '@clr/icons'
import '@clr/icons/clr-icons.css'
import { ClrShapeBan, ClrShapeSync, ClrShapeTimesCircle, ClrShapeViewCards, ClrShapeViewList } from '@clr/icons/shapes/essential-shapes'
import { ClrShapePause, ClrShapePlay } from '@clr/icons/shapes/media-shapes'
import '@webcomponents/custom-elements'
import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import caretDown from 'src/icons/caret-down.svg'
import checkSquare from 'src/icons/check-square.svg'
import jupyterIcon from 'src/icons/jupyter.svg'
import loadingSpinner from 'src/icons/loading-spinner.svg'
import logoGrey from 'src/icons/logo-grey.svg'
import logoIcon from 'src/icons/logo.svg'
import square from 'src/icons/square.svg'
import table from 'src/icons/table.svg'
import * as Style from 'src/libs/style'


ClarityIcons.add({
  'ban': ClrShapeBan, 'sync': ClrShapeSync, 'times-circle': ClrShapeTimesCircle, 'view-cards': ClrShapeViewCards, 'view-list': ClrShapeViewList,
  'play': ClrShapePlay, 'pause': ClrShapePause,
  loadingSpinner, logoIcon, logoGrey, table, jupyterIcon, checkSquare, caretDown, square
})

/**
 * Creates a Clarity icon.
 * @param {string} shape - see {@link https://vmware.github.io/clarity/icons/icon-sets}
 * @param {object} [props]
 */
export const icon = function(shape, props) {
  return h('clr-icon', _.merge({ shape }, props))
}

export const breadcrumb = function(props) {
  return icon('angle right', _.merge({ size: 10, style: { margin: '0 0.25rem' } }, props))
}

export const logo = function(props) {
  return icon('logoIcon', _.merge({ size: 48, style: { marginRight: '0.5rem' } }, props))
}

export const spinner = function(props) {
  return icon('loadingSpinner',
    _.merge({ size: 24, style: { color: Style.colors.primary } }, props))
}

export const centeredSpinner = function(props) {
  return spinner(_.merge({ size: 48, style: { display: 'block', margin: 'auto' } }, props))
}
