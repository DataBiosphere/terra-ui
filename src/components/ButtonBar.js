import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary } from 'src/components/common'


const ButtonBar = props => {
  const { onCancel, cancelText, onOk, okText, style } = props

  return div({ style }, [
    onCancel ? h(ButtonSecondary, {
      style: { marginRight: '1rem' },
      onClick: onCancel
    }, [cancelText]) : null,
    h(ButtonPrimary, { onClick: onOk }, okText)
  ])
}

ButtonBar.defaultProps = {
  cancelText: 'Cancel',
  okText: 'Ok'
}

ButtonBar.propTypes = {
  onCancel: PropTypes.func,
  cancelText: PropTypes.string,
  onOk: PropTypes.func.isRequired,
  okText: PropTypes.string,
  style: PropTypes.object
}
export default ButtonBar
