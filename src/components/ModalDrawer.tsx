import React, { CSSProperties, ReactNode } from 'react';
import RModal from 'react-modal';
import { Transition, TransitionStatus } from 'react-transition-group';
import { getPopupRoot } from 'src/components/popup-utils';
import colors from 'src/libs/colors';

const drawer = {
  overlay: (transitionState: TransitionStatus): CSSProperties =>
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
  container: (state: TransitionStatus): CSSProperties => ({
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
} as const;

export interface ModalDrawerProps extends RModal.Props {
  children?: ReactNode;
  isOpen: boolean;
  width?: CSSProperties['width'];
  onDismiss: () => void;
  onExited?: () => void;
}

const ModalDrawer = (props: ModalDrawerProps): ReactNode => {
  const { isOpen, onDismiss, width = 450, children, onExited, ...otherProps } = props;
  return (
    <Transition appear in={isOpen} mountOnEnter timeout={{ exit: 200 }} unmountOnExit onExited={onExited}>
      {(transitionState) => (
        <RModal
          aria={{
            // @ts-expect-error TODO: Is this valid?
            label: props['aria-label'],
            labelledby: props['aria-labelledby'],
            modal: true,
            hidden: transitionState !== 'entered',
          }}
          ariaHideApp={false}
          isOpen
          parentSelector={getPopupRoot}
          style={{
            content: { ...drawer.container(transitionState), width },
            overlay: drawer.overlay(transitionState),
          }}
          onRequestClose={onDismiss}
          {...otherProps}
        >
          {children}
        </RModal>
      )}
    </Transition>
  );
};

export const withModalDrawer =
  ({ width = undefined, ...modalProps } = {}) =>
  (WrappedComponent) => {
    const Wrapper = ({ isOpen, onDismiss, onExited, ...props }) => {
      return (
        <ModalDrawer isOpen={isOpen} width={width} onDismiss={onDismiss} onExited={onExited} {...modalProps}>
          {isOpen && <WrappedComponent {...{ onDismiss, ...props }} />}
        </ModalDrawer>
      );
    };
    return Wrapper;
  };

export default ModalDrawer;
