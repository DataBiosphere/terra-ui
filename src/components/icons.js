import '@webcomponents/custom-elements' // must be before icons
import { ClarityIcons } from '@clr/icons'
import '@clr/icons/clr-icons.css'
import '@clr/icons/shapes/essential-shapes'
import mixinDeep from 'mixin-deep'
import { h } from 'react-hyperscript-helpers'
import { logoIcon, table } from 'src/libs/custom-icons'


/**
 * Creates a Clarity icon.
 * @param {string} shape - see {@link https://vmware.github.io/clarity/icons/icon-sets}
 * @param {object} [props]
 */
export const icon = function(shape, props) {
  return h('clr-icon', mixinDeep({ shape }, props))
}

/**
 * Creates a breadcrumb icon.
 * @param {object} [props]
 */
export const breadcrumb = function(props) {
  return icon('angle right', mixinDeep({ size: 10, style: { padding: '0 0.25rem' } }, props))
}

export const logo = function(props) {
  return icon('logoIcon', mixinDeep({ size: 48, style: { marginRight: '0.5rem' } }, props))
}

ClarityIcons.add({ logoIcon, table })
