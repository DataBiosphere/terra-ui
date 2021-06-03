import _ from 'lodash/fp'
import { div, img } from 'react-hyperscript-helpers'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import iconDict from 'src/libs/icon-dict'


/**
 * Creates an icon: FA or custom.
 * @param {string} shape - see {@link https://fontawesome.com/icons?d=gallery}
 * @param {object} [props]
 */
export const icon = (shape, { size = 16, ...props } = {}) => _.invokeArgs(shape, [{ size, 'data-icon': shape, ...props }], iconDict)

export const spinner = props => icon('loadingSpinner', _.merge({ size: 24, style: { color: colors.primary() } }, props))

export const centeredSpinner = ({ size = 48, ...props } = {}) => spinner(_.merge({
  size, style: {
    display: 'block',
    position: 'sticky',
    top: `calc(50% - ${size / 2}px)`,
    bottom: `calc(50% - ${size / 2}px)`,
    left: `calc(50% - ${size / 2}px)`,
    right: `calc(50% - ${size / 2}px)`
  }
}, props))

export const profilePic = ({ size, style, ...props } = {}) => img({
  alt: 'Google profile image',
  src: getUser().imageUrl,
  height: size, width: size,
  style: { borderRadius: '100%', ...style },
  ...props
})

export const wdlIcon = ({ style = {}, ...props } = {}) => div({
  style: {
    color: 'white', fontSize: 6, fontWeight: 'bold',
    backgroundColor: colors.dark(),
    padding: '10px 2px 3px 2px',
    ...style
  },
  ...props
}, ['WDL'])
