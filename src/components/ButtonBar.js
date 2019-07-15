import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary } from 'src/components/common'


const ButtonBar = ({ onCancel, cancelText = 'Cancel', onOk, okText = 'Ok', ...props }) => {
  return div(props, [
    !!onCancel && h(ButtonSecondary, {
      style: { marginRight: '1rem' },
      onClick: onCancel
    }, [cancelText]),
    h(ButtonPrimary, { onClick: onOk }, [okText])
  ])
}

ButtonBar.propTypes = {
  onCancel: PropTypes.func,
  cancelText: PropTypes.string,
  onOk: PropTypes.func.isRequired,
  okText: PropTypes.string
}

export default ButtonBar
