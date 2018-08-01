import { h, div } from 'react-hyperscript-helpers'
import onClickOutside from 'react-onclickoutside'
import { Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'


const styles = {
  button: (open, disabled) => ({
    width: '2rem',
    height: '2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: open ? `1px solid ${colors.gray[3]}` : undefined,
    color: disabled ? colors.gray[2] : (open ? colors.blue[1] : colors.blue[0]),
    backgroundColor: open ? 'white' : undefined,
    borderRadius: '5px 5px 0 0',
    cursor: disabled ? 'not-allowed' : 'pointer'
  }),
  box: {
    position: 'absolute',
    right: 0,
    border: `1px solid ${colors.gray[3]}`,
    backgroundColor: 'white',
    borderRadius: '5px 0 5px 5px',
    zIndex: 1
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

const DropdownBody = onClickOutside(({ width, children }) => {
  return div({ style: { ...styles.box, width, children } }, [
    children,
    div({ style: styles.bridge })
  ])
})

const DropdownBox = ({ open, onToggle, children, outsideClickIgnoreClass = 'dropdown-box-opener', width = 500, disabled, ...props }) => {
  return div({ style: { position: 'relative' } }, [
    h(Clickable, {
      className: outsideClickIgnoreClass,
      style: styles.button(open, disabled),
      onClick: () => onToggle(!open),
      disabled,
      ...props
    }, [
      icon('caretDown', { size: 18 })
    ]),
    open && h(DropdownBody, {
      width,
      children,
      handleClickOutside: () => onToggle(!open),
      outsideClickIgnoreClass
    })
  ])
}

export default DropdownBox
