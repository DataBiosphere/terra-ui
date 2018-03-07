import '@clr/icons/clr-icons.css'
import '@webcomponents/custom-elements'
import '@clr/icons/clr-icons-lite.min'
import { h } from 'react-hyperscript-helpers'
import mixinDeep from 'mixin-deep'

/*
*  See {@link https://vmware.github.io/clarity/icons/icon-sets#core-shapes}
*/
const icon = function(shape, props = {}) {
  return h('clr-icon', mixinDeep({ shape }, props))
}

export { icon }
