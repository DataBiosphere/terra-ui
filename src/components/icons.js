import _ from 'lodash/fp'
import { Children } from 'react'
import { div, img } from 'react-hyperscript-helpers'
import { getUser } from 'src/libs/auth'
import colors from 'src/libs/colors'
import iconDict from 'src/libs/icon-dict'


/**
 * Returns true if an element with the given set of children and properties contains a single icon
 * which does not already have a label. This can be used, for example, to determine whether a tooltip
 * should be used as a aria-label.
 *
 * @param children
 * @param props
 * @returns {boolean}
 */
export const containsUnlabelledIcon = ({ children, ...props }) => {
  if (!('aria-label' in props) && Children.count(children) === 1 && typeof children !== 'string') {
    try {
      const onlyChild = Children.only(children)

      // Is there a better way to test for this other than duck-typing?
      if ('data-icon' in onlyChild.props && 'icon' in onlyChild.props && onlyChild.props['aria-hidden'] === true) {
        return true
      }
    } catch (e) { /* do nothing */ }
  }
  return false
}

/**
 * Creates an icon: FA or custom.
 * @param {string} shape - see {@link https://fontawesome.com/icons?d=gallery}
 * @param {object} [props]
 * @param {number} [props.size] The size of the icon
 * @param {string} [props.aria-label] An optional accessible label to apply to the icon.
 *    If not specified 'aria-hidden' will be set to true.
 */
export const icon = (shape, { size = 16, ...props } = {}) => {
  // Unless we have a label, we need to hide the icon from screen readers
  props['aria-hidden'] = !props['aria-label'] && !props['aria-labelledby']

  return _.invokeArgs(shape, [{ size, 'data-icon': shape, ...props }], iconDict)
}

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
