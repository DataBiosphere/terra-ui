import _ from 'lodash/fp'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import { Transition } from 'react-transition-group'
import { buttonPrimary, buttonSecondary, Clickable } from 'src/components/common'
import { icon } from 'src/components/icons'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


RModal.defaultStyles = { overlay: {}, content: {} }

const drawer ={
  overlay: transitionState => transitionState === 'entering' || transitionState === 'entered' ? {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '2rem 1rem',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, overflowY: 'auto'
  } : {},
  container: state => ({
    ...(state === 'entered' ? {} : { opacity: 0, transform: 'translate(4rem)' }),
    top: 0, right: 0, outline: 'none',
    transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
    color: colors.dark(1), position: 'absolute', cursor: 'default',
    backgroundColor: colors.light(0.4), height: '100%',
    boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
    display: 'flex', flexDirection: 'column'
  }),
  title: {
    display: 'flex', alignItems: 'baseline', marginBottom: '1rem', flex: 'none', padding: '1.5rem 1.25rem'
  },
  body: {
    display: 'flex', alignItems: 'baseline', marginBottom: '1rem', flex: 1, padding: '1.5rem 1.25rem', overflow: 'auto'
  },
  buttonRow: {
    marginTop: 'auto', backgroundColor: colors.dark(0.2), padding: '1.75rem 1.25rem',
    display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline'
  },
  titleAlign: showPrevArrow => ({ marginLeft: showPrevArrow ? 'auto' : undefined })
}

const Modal = ({
  onPrevious = () => {}, showPreviousArrow = false, transitionState = false,
  ...props
}) => {
  const { onDismiss, title, titleExtras, children, width, showCancel, cancelText, showX, showButtons, okButton, ...restProps } = props

  return h(RModal, {
    parentSelector: () => document.getElementById('modal-root'),
    isOpen: true,
    onRequestClose: onDismiss,
    style: { overlay: drawer.overlay(transitionState), content: { ...drawer.container(transitionState), width } },
    ariaHideApp: false,
    ...restProps
  }, [
    title && div({ style: drawer.title }, [
      showPreviousArrow && h(Clickable, {
        onClick: onPrevious
      }, [icon('arrowLeft')]),
      div({ style: { fontSize: 18, fontWeight: 600, ...drawer.titleAlign(showPreviousArrow) } }, [title]),
      titleExtras,
      showX && h(Clickable, {
        style: { marginLeft: 'auto' },
        onClick: onDismiss
      }, [icon('times')])
    ]),
    div({ style: drawer.body }, [children]),
    showButtons && div({ style: drawer.buttonRow }, [
      showCancel ?
        buttonSecondary({
          style: { marginRight: '3rem' },
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

const propTypes = {
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

const defaultProps = {
  width: 450,
  showCancel: true,
  cancelText: 'Cancel',
  showX: false,
  showButtons: false,
  showPreviousArrow: false,
  openDrawer: false
}

export const ModalDrawer = props => {
  const { openDrawer, onDismiss } = props
  const [closeDrawer, setCloseDrawer] = useState(false)

  const transitionModal = h(Transition, {
    in: openDrawer && !closeDrawer,
    timeout: { exit: 200 },
    appear: true,
    mountOnEnter: true,
    unmountOnExit: true,
    onExited: () => {
      onDismiss()
      setCloseDrawer(false)
    }
  }, [transitionState => h(Modal, { ...props, onDismiss: () => setCloseDrawer(true), transitionState })])

  return transitionModal
}

ModalDrawer.propTypes = propTypes
Modal.defaultProps = defaultProps

export default ModalDrawer
