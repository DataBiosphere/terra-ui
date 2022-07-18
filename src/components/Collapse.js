import _ from 'lodash/fp'
import { useEffect, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import { useUniqueId } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'


const Collapse = ({ title, hover, tooltip, tooltipDelay, summaryStyle, detailsStyle, initialOpenState, children, titleFirst, afterToggle, onFirstOpen = () => {}, noTitleWrap, ...props }) => {
  const [isOpened, setIsOpened] = useState(initialOpenState)
  const angleIcon = icon(isOpened ? 'angle-down' : 'angle-right', {
    style: {
      flexShrink: 0,
      marginLeft: titleFirst ? 'auto' : undefined,
      marginRight: titleFirst ? undefined : '0.25rem'
    }
  })

  const firstOpenRef = useRef(_.once(onFirstOpen))
  const id = useUniqueId()

  useEffect(() => {
    if (isOpened) {
      firstOpenRef.current()
    }
  }, [firstOpenRef, isOpened])

  return div(props, [
    div({
      style: {
        position: 'relative',
        display: 'flex', alignItems: 'center',
        ...summaryStyle
      }
    }, [
      !titleFirst && angleIcon,
      h(Link, {
        'aria-expanded': isOpened,
        'aria-controls': isOpened ? id : undefined,
        style: {
          color: colors.dark(),
          ...(noTitleWrap ? Style.noWrapEllipsis : {})
        },
        onClick: () => setIsOpened(!isOpened),
        hover,
        tooltip,
        tooltipDelay
      }, [
        div({
          'aria-hidden': true,
          style: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, zIndex: 1 }
        }),
        title
      ]),
      afterToggle && div({ style: { display: 'flex', flex: 1, margin: '0 1ch', zIndex: 2 } }, [afterToggle]),
      titleFirst && angleIcon
    ]),
    isOpened && div({ id, style: detailsStyle }, [children])
  ])
}

export default Collapse
