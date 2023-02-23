import _ from 'lodash/fp'
import FocusLock from 'react-focus-lock'
import { h } from 'react-hyperscript-helpers'


// react-focus-lock does not export a type for FocusLock's props, but since FocusLock
// is a function component, we can get the type from its parameters.
type FocusLockProps = Parameters<typeof FocusLock>[0]

export type FocusTrapperProps = FocusLockProps & {
  onBreakout: () => void
}

export const FocusTrapper = (props: FocusTrapperProps) => {
  const { children, onBreakout, ...otherProps } = props

  return h(FocusLock, {
    returnFocus: true,
    lockProps: _.merge({
      tabIndex: 0,
      style: { outline: 'none' },
      onKeyDown: e => {
        if (e.key === 'Escape') {
          onBreakout()
          e.stopPropagation()
        }
      }
    }, otherProps)
  }, [children])
}
