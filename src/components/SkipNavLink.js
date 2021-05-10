import { h } from 'react-hyperscript-helpers'
import { Clickable } from 'src/components/common'
import colors from 'src/libs/colors'


const SkipNavLink = () => {
  return h(Clickable, {
    as: 'a',
    href: '#',
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      opacity: 0,
      background: colors.accent(1.5),
      color: colors.light(),
      padding: '1em',
      border: '1px solid white',
      zIndex: 9999
    },
    hover: {
      opacity: 1,
      boxShadow: 'rgba(0, 0, 0, 0.5) 0px 0px 4px 0px'
    },
    onClick: event => {
      event.preventDefault()

      const main = document.querySelector('[role="main"]')
      if (main && main.tabIndex === undefined) {
        main.tabIndex = -1;
      }
      main && main.focus()
    }
  }, 'Skip navigation')
}

export default SkipNavLink
