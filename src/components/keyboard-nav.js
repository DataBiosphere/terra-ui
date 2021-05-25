import _ from 'lodash/fp'
import { useRef } from 'react'
import * as Utils from 'src/libs/utils'


export const withArrowKeyNavigation = ({ onKeyDown, children }) => {
  const count = children.length
  const refs = _.map(useRef, _.range(0, count))

  const focusOn = index => {
    // Wrap around the ends and ensure the number is positive
    const i = index % count + (index < 0 ? count : 0)
    refs[i].current?.focus()
  }

  // Pass a ref into each child, using an alternative property name
  return _.map(([i, child]) => {
    return child({ forwardedRef: refs[i], onKeyDown: onKeyDown(i, focusOn) })
  }, Utils.toIndexPairs(children))
}

/**
 * Sets up a collection of children to support horizontal navigation with the arrow keys as well as home/end.
 * This is particularly useful to support accessibility in compound ARIA components such as tablists and menus.
 *
 * @param children The children provided to this element.
 *  These must be functions which accept a props object containing `forwardedRef` and `onKeyDown` properties.
 * @returns An array of children for inclusion in higher-level elements
 */
export const withHorizontalNavigation = children => {
  return withArrowKeyNavigation({
    children,
    onKeyDown: (i, focusOn) => {
      return event => {
        switch (event.key) {
          case 'ArrowLeft':
            focusOn(i - 1); break
          case 'ArrowRight':
            focusOn(i + 1); break
          case 'Home':
            focusOn(0); break
          case 'End':
            focusOn(-1); break

          // Catch the click keys as well since this function will completely replace the default version in Interactive elements
          case 'Enter': case ' ':
            event.stopPropagation()
            event.target.click()
            break
          default:
            break
        }
      }
    }
  })
}

/**
 * Sets up a collection of children to support vertical navigation with the arrow keys as well as home/end and pgup/pgdn
 * This is particularly useful to support accessibility in compound ARIA components such as tablists and menus.
 *
 * @param children The children provided to this element.
 *  These must be functions which accept a props object containing `forwardedRef` and `onKeyDown` properties.
 * @returns An array of children for inclusion in higher-level elements
 */
export const withVerticalNavigation = children => {
  return withArrowKeyNavigation({
    children,
    onKeyDown: (i, focusOn) => {
      return event => {
        switch (event.key) {
          case 'ArrowUp':
            focusOn(i - 1); break
          case 'ArrowDown':
            focusOn(i + 1); break
          case 'Home': case 'PageDown':
            focusOn(0); break
          case 'End': case 'PageUp':
            focusOn(-1); break

          // Catch the click keys as well since this function will completely replace the default version in Interactive elements
          case 'Enter': case ' ':
            event.stopPropagation()
            event.target.click()
            break
          default:
            break
        }
      }
    }
  })
}
