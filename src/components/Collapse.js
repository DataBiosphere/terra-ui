import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { icon } from 'src/components/icons'


const Collapse = ({ title, buttonStyle, children, ...props }) => {
  const [isOpened, setIsOpened] = useState(false)

  return div(props, [
    h(Link, {
      'aria-expanded': isOpened,
      style: { display: 'flex', alignItems: 'center', marginBottom: '0.5rem', ...buttonStyle },
      onClick: () => setIsOpened(!isOpened)
    }, [
      icon(isOpened ? 'angle-down' : 'angle-right', { style: { marginRight: '0.25rem', flexShrink: 0 } }),
      title
    ]),
    isOpened && div([children])
  ])
}

export default Collapse
