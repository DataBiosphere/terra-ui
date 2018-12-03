import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { div, h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import { buttonPrimary, buttonSecondary, Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


RModal.defaultStyles = { overlay: {}, content: {} }

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

export default class Modal extends Component {
  static propTypes = {
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

  static defaultProps = {
    width: 450,
    showCancel: true,
    cancelText: 'Cancel',
    showX: false,
    showButtons: true
  }

  render() {
    const { onDismiss, title, titleExtras, children, width, showCancel, cancelText, showX, showButtons, okButton } = this.props

    return h(RModal, {
      parentSelector: () => document.getElementById('modal-root'),
      isOpen: true,
      onRequestClose: onDismiss,
      style: { overlay: styles.overlay, content: { ...styles.modal, width } },
      ariaHideApp: false
    }, [
      title && div({ style: { display: 'flex', alignItems: 'baseline', marginBottom: '1rem' } }, [
        div({ style: { fontSize: 18, fontWeight: 'bold', color: colors.darkBlue[0] } }, [title]),
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
}
