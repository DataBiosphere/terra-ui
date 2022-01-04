import _ from 'lodash/fp'
import { useEffect, useRef, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'
import { useUniqueId } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'


const Collapse = ({ title, buttonStyle, buttonProps = {}, initialOpenState, children, titleFirst, afterToggle, onFirstOpen = () => {}, noTitleWrap, ...props }) => {
  const [isOpened, setIsOpened] = useState(initialOpenState)
  const angleIcon = icon(isOpened ? 'angle-down' : 'angle-right', { style: { marginRight: '0.25rem', flexShrink: 0 } })

  const firstOpenRef = useRef(_.once(onFirstOpen))
  const id = useUniqueId()

  useEffect(() => {
    if (isOpened) {
      firstOpenRef.current()
    }
  }, [firstOpenRef, isOpened])

  return div(props, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      h(Link, {
        'aria-expanded': isOpened,
        'aria-controls': isOpened ? id : undefined,
        'aria-owns': isOpened ? id : undefined,
        style: { display: 'flex', flex: 1, alignItems: 'center', marginBottom: '0.5rem', ...buttonStyle },
        onClick: () => setIsOpened(!isOpened),
        ...buttonProps
      }, [
        titleFirst && div({ style: { flexGrow: 1, ...(noTitleWrap ? Style.noWrapEllipsis : {}) } }, [title]),
        angleIcon,
        !titleFirst && title
      ]),
      afterToggle
    ]),
    isOpened && div({ id }, [children])
  ])
}

export default Collapse
