import _ from 'lodash/fp'
import { img } from 'react-hyperscript-helpers'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import iconDict from 'src/libs/icon-dict'


/**
 * Creates an icon: Clarity, FA, or custom.
 * @param {string} shape - see {@link https://fontawesome.com/icons?d=gallery}
 * @param {object} [props]
 */
export const icon = (shape, { size = 16, className, ...props } = {}) => iconDict[shape]({ size, className, ...props })

export const breadcrumb = props => icon('angle right', _.merge({ size: 10, style: { margin: '0 0.25rem' } }, props))

export const spinner = props => icon('loadingSpinner', _.merge({ size: 24, style: { color: colors.primary() } }, props))

export const centeredSpinner = props => spinner(_.merge({ size: 48, style: { display: 'block', margin: 'auto' } }, props))

export const profilePic = ({ size, style, ...props } = {}) => img({
  src: getUser().imageUrl,
  height: size, width: size,
  style: { borderRadius: '100%', ...style },
  ...props
})
