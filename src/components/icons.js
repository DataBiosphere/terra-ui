import '@webcomponents/custom-elements' // must be before icons
import { ClarityIcons } from '@clr/icons'
import '@clr/icons/clr-icons.css'
import '@clr/icons/shapes/essential-shapes'
import mixinDeep from 'mixin-deep'
import { h } from 'react-hyperscript-helpers'


/**
 * Creates a Clarity icon.
 * @param {string} shape - see {@link https://vmware.github.io/clarity/icons/icon-sets}
 * @param {object} [props]
 */
export const icon = function(shape, props) {
  return h('clr-icon', mixinDeep({ shape }, props))
}

/**
 * Creates a breadcrumb icon
 * @param {object} [props]
 */
export const breadcrumb = function(props) {
  return icon('angle right', mixinDeep({ size: 10, style: { padding: '0 0.25rem' } }, props))
}

const table = `<svg version="1.1" viewBox="0 0 17 17" preserveAspectRatio="xMidYMid meet"
     xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true" role="img">
    <style type="text/css">line {
      stroke: currentColor;
      stroke-width: 2;
    }</style>
    <path d="M15,2l0,13L2,15L2,2H15 M15,0H2C0.9,0,0,0.9,0,2v13c0,1.1,0.9,2,2,2h13c1.1,0,2-0.9,2-2V2C17,0.9,16.1,0,15,0L15,0z"/>
    <line x1="8.5" y1="17" x2="8.5" y2="0"/>
    <line x1="0" y1="6" x2="17" y2="6"/>
    <line x1="0" y1="11" x2="17" y2="11"/>
</svg>`

ClarityIcons.add({ table })
