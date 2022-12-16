import _ from 'lodash/fp'
import { div } from 'react-hyperscript-helpers'
import { isRadX } from 'src/libs/brand-utils'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


export const PageBoxVariants = {
  LIGHT: 'light'
}

export const PageBox = ({ children, variant, style = {}, ...props }) => {
  return div(_.merge({
    style: {
      margin: '1.5rem', padding: '1.5rem 1.5rem 0', minHeight: 125, flex: 'none', zIndex: 0,
      ...Utils.switchCase(variant,
        [PageBoxVariants.LIGHT, () => ({ backgroundColor: colors.light(isRadX() ? 0.3 : 1), margin: 0, padding: '3rem 3rem 1.5rem' })],
        [Utils.DEFAULT, () => ({})]
      ),
      ...style
    }
  }, props), [children])
}
