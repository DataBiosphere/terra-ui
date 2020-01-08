import PropTypes from 'prop-types'
import { h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import { Transition } from 'react-transition-group'
import colors from 'src/libs/colors'


const drawer = {
  overlay: transitionState => transitionState === 'entering' || transitionState === 'entered' ? {
    backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '2rem 1rem',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
    position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, overflowY: 'auto'
  } : {},
  container: state => ({
    ...(state === 'entered' ? {} : { opacity: 0, transform: 'translate(4rem)' }),
    top: 0, right: 0, outline: 'none',
    transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
    color: colors.dark(1), position: 'fixed', cursor: 'default',
    backgroundColor: colors.dark(0.09), height: '100%',
    boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
    display: 'flex', flexDirection: 'column',
    overflowY: 'auto'
  })
}

const ModalDrawer = ({ isOpen, onDismiss, width = 450, children, ...props }) => {
  return h(Transition, {
    in: isOpen,
    timeout: { exit: 200 },
    appear: true,
    mountOnEnter: true,
    unmountOnExit: true
  }, [transitionState => h(RModal, {
    parentSelector: () => document.getElementById('modal-root'),
    isOpen: true,
    onRequestClose: onDismiss,
    style: { overlay: drawer.overlay(transitionState), content: { ...drawer.container(transitionState), width } },
    ariaHideApp: false,
    ...props
  }, [children])])
}

export const withModalDrawer = ({ width } = {}) => WrappedComponent => {
  const Wrapper = ({ isOpen, onDismiss, ...props }) => {
    return h(ModalDrawer, { isOpen, width, onDismiss }, [
      isOpen && h(WrappedComponent, { onDismiss, ...props })
    ])
  }
  return Wrapper
}

ModalDrawer.propTypes = {
  isOpen: PropTypes.bool,
  onDismiss: PropTypes.func.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  children: PropTypes.node
}

export default ModalDrawer
