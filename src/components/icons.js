import { ClarityIcons } from '@clr/icons'
import '@clr/icons/clr-icons.css'
import '@clr/icons/shapes/essential-shapes'
import '@clr/icons/shapes/media-shapes'
import '@webcomponents/custom-elements' // must be before icons
import _ from 'lodash'
import { h } from 'react-hyperscript-helpers'
import checkSquare from 'src/icons/check-square.svg'
import jupyterIcon from 'src/icons/jupyter.svg'
import loadingSpinner from 'src/icons/loading-spinner.svg'
import logoIcon from 'src/icons/logo.svg'
import square from 'src/icons/square.svg'
import table from 'src/icons/table.svg'
import * as Style from 'src/libs/style'


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
    _.merge(
      { size: 48, style: { color: Style.colors.primary, display: 'block', margin: 'auto' } },
      props))
}

ClarityIcons.add({ loadingSpinner, logoIcon, table, jupyterIcon, checkSquare, square })
