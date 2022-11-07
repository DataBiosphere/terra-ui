import _ from 'lodash/fp'
import { h } from 'react-hyperscript-helpers'
import Clickable from 'src/components/common/Clickable'
import colors from 'src/libs/colors'
import { forwardRefWithName } from 'src/libs/react-utils'


const Link = forwardRefWithName('Link', ({ disabled, variant, children, baseColor = colors.accent, ...props }, ref) => {
  return h(Clickable, _.merge({
    ref,
    style: {
      color: disabled ? colors.disabled() : baseColor(variant === 'light' ? 0.3 : 1),
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 500, display: 'inline'
    },
    hover: disabled ? undefined : { color: baseColor(variant === 'light' ? 0.1 : 0.8) },
    disabled
  }, props), [children])
})

export default Link
