import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import colors from 'src/libs/colors'
import { forwardRefWithName } from 'src/libs/utils'


export const SkipNavLink = forwardRefWithName('SkipNavLink', (props, ref) => {
  return div({
    role: 'nav'
  }, [
    h(Link, {
      as: 'a',
      href: '#',
      className: 'reveal-on-focus',
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        background: 'white',
        color: colors.accent(),
        border: '1px solid black',
        borderColor: colors.accent(),
        padding: '1em',
        boxShadow: 'rgba(0, 0, 0, 0.5) 0px 0px 4px 0px',
        zIndex: 9998
      },
      onClick: event => {
        event.preventDefault()
        event.stopPropagation()
        ref.current && ref.current.focus()
      },
      ...props
    }, 'Skip to main content')
  ])
})

export const SkipNavTarget = forwardRefWithName('SkipNavTarget', (props, ref) => {
  return div({
    ref,
    className: 'skip-navigation-content',
    tabIndex: -1,
    'aria-label': 'main content',
    ...props
  })
})
