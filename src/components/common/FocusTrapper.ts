import _ from 'lodash/fp'
import FocusLock from 'react-focus-lock'
import { h } from 'react-hyperscript-helpers'


type FocusLockProps = Parameters<typeof FocusLock>[0]

export type FocusTrapperProps = FocusLockProps & {
  onBreakout: () => void
}

export const FocusTrapper = ({ children, onBreakout, ...props }: FocusTrapperProps) => {
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
    }, props)
  }, [children])
}
