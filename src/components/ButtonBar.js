import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary } from 'src/components/common'
import * as Utils from 'src/libs/utils'


const ButtonBar = ({ onCancel, cancelText = 'Cancel', onOk, okText = 'Ok', okButton, ...props }) => {
  return div(props, [
    onCancel ? h(ButtonSecondary, {
      style: { marginRight: '2.5rem' },
      onClick: onCancel
    }, [cancelText]) : null,
    Utils.cond(
      [!!okButton, () => okButton],
      () => h(ButtonPrimary, { onClick: onOk }, okText)
    )
  ])
}

ButtonBar.propTypes = {
  onCancel: PropTypes.func,
  cancelText: PropTypes.string,
  onOk: PropTypes.func,
  okText: PropTypes.string,
  style: PropTypes.object
}

export default ButtonBar
