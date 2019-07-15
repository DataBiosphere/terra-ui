import PropTypes from 'prop-types'
import { div } from 'react-hyperscript-helpers'
import { buttonPrimary, buttonSecondary } from 'src/components/common'


const ButtonBar = ({ onCancel, cancelText = 'Cancel', onOk, okText = 'Ok', ...props }) => {
  return div(props, [
    !!onCancel && buttonSecondary({
      style: { marginRight: '1rem' },
      onClick: onCancel
    }, [cancelText]),
    buttonPrimary({ onClick: onOk }, [okText])
  ])
}

ButtonBar.propTypes = {
  onCancel: PropTypes.func,
  cancelText: PropTypes.string,
  onOk: PropTypes.func.isRequired,
  okText: PropTypes.string
}

export default ButtonBar
