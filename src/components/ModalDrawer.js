import PropTypes from 'prop-types'
import { h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import { Transition } from 'react-transition-group'
import colors from 'src/libs/colors'


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
  })
}

const Modal = ({ transitionState = false, ...props }) => {
  const { onDismiss, children, width, ...restProps } = props

  return h(RModal, {
    parentSelector: () => document.getElementById('modal-root'),
    isOpen: true,
    onRequestClose: onDismiss,
    style: { overlay: drawer.overlay(transitionState), content: { ...drawer.container(transitionState), width } },
    ariaHideApp: false,
    ...restProps
  }, [children])
}

const propTypes = {
  onDismiss: PropTypes.func.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  openDrawer: PropTypes.bool
}

const defaultProps = {
  width: 450,
  openDrawer: false
}

export const ModalDrawer = props => {
  const { openDrawer } = props

  const transitionModal = h(Transition, {
    in: openDrawer,
    timeout: { exit: 200 },
    appear: true,
    mountOnEnter: true,
    unmountOnExit: true
  }, [transitionState => h(Modal, { ...props, transitionState })])

  return transitionModal
}

ModalDrawer.propTypes = propTypes
Modal.defaultProps = defaultProps

export default ModalDrawer
