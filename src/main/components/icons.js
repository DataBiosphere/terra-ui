import '@webcomponents/custom-elements' // must be before icons
import { ClarityIcons } from '@clr/icons'
import '@clr/icons/clr-icons.css'
import '@clr/icons/shapes/essential-shapes'
import mixinDeep from 'mixin-deep'
import { h } from 'react-hyperscript-helpers'
import { jupyterIcon, loadingSpinner, logoIcon, table } from 'src/main/libs/custom-icons'
import * as Style from 'src/main/libs/style'


/**
 * Creates a Clarity icon.
 * @param {string} shape - see {@link https://vmware.github.io/clarity/icons/icon-sets}
 * @param {object} [props]
 */
export const icon = function(shape, props) {
  return h('clr-icon', mixinDeep({ shape }, props))
}

export const breadcrumb = function(props) {
  return icon('angle right', mixinDeep({ size: 10, style: { padding: '0 0.25rem' } }, props))
}

export const logo = function(props) {
  return icon('logoIcon', mixinDeep({ size: 48, style: { marginRight: '0.5rem' } }, props))
}

export const spinner = function(props) {
  return icon('loadingSpinner',
    mixinDeep(
      { size: 48, style: { color: Style.colors.primary, display: 'block', margin: 'auto' } },
      props))
}

ClarityIcons.add({ loadingSpinner, logoIcon, table, jupyterIcon })
