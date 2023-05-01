import PropTypes from 'prop-types';
import { h } from 'react-hyperscript-helpers';
import RModal from 'react-modal';
import { Transition } from 'react-transition-group';
import { getPopupRoot } from 'src/components/popup-utils';
import colors from 'src/libs/colors';
import { useLabelAssert } from 'src/libs/react-utils';

const drawer = {
  overlay: (transitionState) =>
    transitionState === 'entering' || transitionState === 'entered'
      ? {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          padding: '2rem 1rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          position: 'fixed',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          overflowY: 'auto',
        }
      : {},
  container: (state) => ({
    ...(state === 'entered' ? {} : { opacity: 0, transform: 'translate(4rem)' }),
    top: 0,
    right: 0,
    outline: 'none',
    transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
    color: colors.dark(1),
    position: 'fixed',
    cursor: 'default',
    backgroundColor: colors.dark(0.1),
    height: '100%',
    boxShadow: '3px 0 13px 0 rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  }),
};

function ModalDrawer({ isOpen, onDismiss, width = 450, children, onExited, ...props }) {
  useLabelAssert('ModalDrawer', props);

  return h(
    Transition,
    {
      in: isOpen,
      timeout: { exit: 200 },
      appear: true,
      mountOnEnter: true,
      unmountOnExit: true,
      onExited,
    },
    [
      (transitionState) =>
        h(
          RModal,
          {
            aria: { label: props['aria-label'], labelledby: props['aria-labelledby'], modal: true, hidden: transitionState !== 'entered' },
            ariaHideApp: false,
            parentSelector: getPopupRoot,
            isOpen: true,
            onRequestClose: onDismiss,
            style: { overlay: drawer.overlay(transitionState), content: { ...drawer.container(transitionState), width } },
            ...props,
          },
          [children]
        ),
    ]
  );
}

export const withModalDrawer =
  ({ width, ...modalProps } = {}) =>
  (WrappedComponent) => {
    const Wrapper = ({ isOpen, onDismiss, onExited, ...props }) => {
      return h(ModalDrawer, { isOpen, width, onDismiss, onExited, ...modalProps }, [isOpen && h(WrappedComponent, { onDismiss, ...props })]);
    };
    return Wrapper;
  };

ModalDrawer.propTypes = {
  isOpen: PropTypes.bool,
  onDismiss: PropTypes.func.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  children: PropTypes.node,
};

export default ModalDrawer;
