import '@webcomponents/custom-elements' // must be before icons
import '@clr/icons'
import '@clr/icons/clr-icons.css'
import '@clr/icons/shapes/essential-shapes'
import mixinDeep from 'mixin-deep'
import { h } from 'react-hyperscript-helpers'

/*
*  See {@link https://vmware.github.io/clarity/icons/icon-sets#core-shapes}
*/
const icon = function(shape, props = {}) {
  return h('clr-icon', mixinDeep({ shape }, props))
}

const breadcrumb = function(props = {}) {
  return icon('angle right', mixinDeep({ size: 10, style: { padding: '0 0.25rem' } }, props))
}

export { icon, breadcrumb }
