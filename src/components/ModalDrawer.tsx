import React, { ComponentType, CSSProperties, FunctionComponent, ReactNode } from 'react';
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

export interface ModalDrawerProps
  extends Omit<RModal.Props, 'aria' | 'ariaHideApp' | 'isOpen' | 'parentSelector' | 'style' | 'onRequestClose'> {
  'aria-label'?: string;
  'aria-labelledby'?: string;
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
            // Type definitions do not include all ARIA attributes (label and hidden), but react-modal does pass them through.
            // https://github.com/reactjs/react-modal/blob/a275399059cc37aa02cac7e9385512b02ff5cf15/src/components/ModalPortal.js#L408
            // @ts-expect-error
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

/**
 * Factory for a higher-order component that wraps a component in a ModalDrawer.
 *
 * @param modalDrawerProps - Props to pass to the ModalDrawer.
 * @returns A higher-order component that wraps a component in a ModalDrawer.
 * The wrapped component must accept an onDismiss prop.
 * The wrapper component accepts the same props as the wrapped component as well as
 * isOpen and onExited, which are passed to the ModalDrawer.
 */
export const withModalDrawer =
  (modalDrawerProps: Partial<ModalDrawerProps> = {}) =>
  <P extends { onDismiss: () => void }>(
    WrappedComponent: ComponentType<P>
  ): FunctionComponent<P & Pick<ModalDrawerProps, 'isOpen' | 'onExited'>> => {
    const Wrapper = (props: P & Pick<ModalDrawerProps, 'isOpen' | 'onExited'>): ReactNode => {
      const { isOpen, onDismiss, onExited } = props;
      return (
        <ModalDrawer isOpen={isOpen} onDismiss={onDismiss} onExited={onExited} {...modalDrawerProps}>
          {/*
           * WrappedComponent doesn't necessarily accept isOpen and onExited props.
           *
           * Thus, passing them through here could result in unintended behavior if the WrappedComponent
           * does not accept isOpen and/or onExited and passes through unknown props to a child component
           * that does accept isOpen and/or onExited. Given that withModalDrawer is used to wrap fairly
           * high level components (which generally do _not_ pass through props), this is unlikely to be
           * an issue.
           *
           * If WrappedComponent _does_ accept isOpen and/or onExited, they must match the types in
           * Pick<ModalDrawerProps, 'isOpen' | 'onExited'>. If they do not, then Wrapper's props will
           * be typed as never and attempting to render Wrapper will result in a type error like:
           * Types of parameters 'props' and 'props' are incompatible.
           * Type 'any' is not assignable to type 'never'.
           * The intersection 'ComponentProps & Pick<ModalDrawerProps, "isOpen" | "onExited">' was reduced
           * to 'never' because property 'isOpen' has conflicting types in some constituents.
           */}
          {isOpen && <WrappedComponent {...props} />}
        </ModalDrawer>
      );
    };
    return Wrapper;
  };

export default ModalDrawer;
