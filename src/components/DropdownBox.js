import Interactive from 'react-interactive'
import { h, div } from 'react-hyperscript-helpers'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'


const styles = {
  button: open => ({
    width: '2rem',
    height: '2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: open ? `1px solid ${Style.colors.border}` : undefined,
    color: open ? Style.colors.primary : Style.colors.secondary,
    backgroundColor: '#ffffff',
    borderRadius: '5px 5px 0 0',
    cursor: 'pointer'
  }),
  box: {
    position: 'absolute',
    right: 0,
    border: `1px solid ${Style.colors.border}`,
    backgroundColor: '#ffffff',
    borderRadius: '5px 0 5px 5px'
  },
  bridge: {
    position: 'absolute',
    right: 0,
    height: 2,
    top: -2,
    width: 30,
    backgroundColor: 'white'
  }
}

const DropdownBox = ({ open, onToggle, children, width = 500 }) => {
  return div({ style: { position: 'relative' } }, [
    h(Interactive, { as: 'div', style: styles.button(open), onClick: () => onToggle(!open) }, [
      icon('caretDown', { size: 18 })
    ]),
    open && div({ style: { ...styles.box, width } }, [
      children,
      div({ style: styles.bridge })
    ])
  ])
}

export default DropdownBox
