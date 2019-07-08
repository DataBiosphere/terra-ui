import PropTypes from 'prop-types'
import { div } from 'react-hyperscript-helpers'
import { buttonPrimary, buttonSecondary } from 'src/components/common'


const ButtonBar = props => {
  const { onCancel, cancelText, onOk, okText, style } = props

  return div({ style }, [
    onCancel ? buttonSecondary({
      style: { marginRight: '1rem' },
      onClick: onCancel
    }, [cancelText]) : null,
    buttonPrimary({ onClick: onOk }, okText)
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
