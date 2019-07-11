import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import { buttonPrimary, buttonSecondary, Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '2rem 1rem',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, overflowY: 'auto'
  },
  modal: {
    borderRadius: 5, position: 'relative',
    padding: '1.5rem 1.25rem', outline: 'none',
    backgroundColor: 'white', boxShadow: Style.modalShadow
  },
  buttonRow: {
    marginTop: '1rem',
    display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'
  }
}

const Modal = ({ onDismiss, title, titleExtras, children, width = 450, showCancel = true, cancelText = 'Cancel', showX, showButtons = true, okButton, ...props }) => {
  return h(RModal, {
    parentSelector: () => document.getElementById('modal-root'),
    isOpen: true,
    onRequestClose: onDismiss,
    style: { overlay: styles.overlay, content: { ...styles.modal, width } },
    ariaHideApp: false,
    ...props
  }, [
    title && div({ style: { display: 'flex', alignItems: 'baseline', marginBottom: '1rem', flex: 'none' } }, [
      div({ style: { fontSize: 18, fontWeight: 600 } }, [title]),
      titleExtras,
      showX && h(Clickable, {
        style: { alignSelf: 'flex-start', marginLeft: 'auto' },
        onClick: onDismiss
      }, [icon('times-circle')])
    ]),
    children,
    showButtons && div({ style: styles.buttonRow }, [
      showCancel ?
        buttonSecondary({
          style: { marginRight: '1rem' },
          onClick: onDismiss
        }, [cancelText]) :
        null,
      Utils.cond(
        [okButton === undefined, () => buttonPrimary({ onClick: onDismiss }, 'OK')],
        [_.isString(okButton), () => buttonPrimary({ onClick: onDismiss }, okButton)],
        [_.isFunction(okButton), () => buttonPrimary({ onClick: okButton }, 'OK')],
        () => okButton
      )
    ])
  ])
}

Modal.propTypes = {
  onDismiss: PropTypes.func.isRequired,
  title: PropTypes.node,
  titleExtras: PropTypes.node,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  showCancel: PropTypes.bool,
  cancelText: PropTypes.string,
  showX: PropTypes.bool,
  showButtons: PropTypes.bool,
  okButton: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.node]),
  children: PropTypes.node
}

export default Modal
