import { CSSProperties, ReactNode, useEffect, useRef } from 'react';
import RModal, { Props as RModalProps } from 'react-modal';

import { ButtonPrimary, ButtonSecondary } from './buttons';
import { Clickable } from './Clickable';
import { useUniqueId } from './hooks/useUniqueId';
import { icon } from './icon';
import { getPopupRoot } from './internal/PopupPortal';

export const modalStyles = {
  overlay: {
    position: 'fixed',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflowY: 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '2rem 1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    position: 'relative',
    padding: '1.5rem 1.25rem',
    borderRadius: 5,
    backgroundColor: 'white',
    boxShadow: '0 0 8px 0 rgba(0,0,0,0.12), 0 8px 8px 0 rgba(0,0,0,0.24)',
    outline: 'none',
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    flex: 'none',
    marginBottom: '1rem',
  },
  title: {
    overflow: 'hidden',
    fontSize: 18,
    fontWeight: 600,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'baseline',
    marginTop: '1rem',
  },
} as const satisfies Record<string, CSSProperties>;

RModal.defaultStyles = { overlay: {}, content: {} };

export interface ModalProps
  extends Omit<
    RModalProps,
    | 'ariaHideApp' // Allowing this would require configuring RModal with an "app element".
    | 'isOpen' // Rendering Modal should always show the modal.
    | 'onRequestClose' // Modal renames this to "onDismiss".
  > {
  /** Text for the "Cancel" button. */
  cancelText?: string;

  /** Style the ok button as a "dangerous" operation. */
  danger?: boolean;

  /**
   * Controls the "OK" button.
   * If a string, text for the "OK" button, which will dismiss the modal.
   * If a function, onClick callback for the "OK" button.
   * If a ReactNode, the "OK" button itself.
   */
  okButton?: string | (() => void) | ReactNode;

  /** Whether or not to show the buttons at the end of the modal. */
  showButtons?: boolean;

  /** If buttons are shown, whether or not to show the "Cancel" button. */
  showCancel?: boolean;

  /** Whether or not to show an "X" dismiss button in the top right corner fo the modal. */
  showX?: boolean;

  /** Styles for modal elements. */
  styles?: {
    buttonRow?: CSSProperties;
    modal?: CSSProperties;
  };

  /** Title for the modal. */
  title?: ReactNode;

  /** Additional content for the modal header. */
  titleChildren?: ReactNode;

  /** Modal width. */
  width?: CSSProperties['width'];

  /** Called when the modal is dismissed (via the "OK", "Cancel", or "X" buttons or by clicking on the overlay). */
  onDismiss: RModalProps['onRequestClose'];
}

export const Modal = (props: ModalProps): ReactNode => {
  const {
    cancelText = 'Cancel',
    children,
    danger = false,
    okButton,
    showButtons = true,
    showCancel = true,
    showX = false,
    styles,
    title,
    titleChildren,
    width = 450,
    onDismiss,
    ...otherProps
  } = props;

  const hasTitle = !!title;
  const titleId = useUniqueId();

  const modalElement = useRef<HTMLDivElement | null>(null);

  /** Element that waas focused before the modal was opened. */
  const previouslyFocusedElement = useRef<Element | null>(null);
  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement;

    // When the modal is closed (unmounted), return focus to the previously focused element.
    return () => {
      if (previouslyFocusedElement.current instanceof HTMLElement) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, []);

  return (
    <RModal
      aria={{
        labelledby: hasTitle ? titleId : undefined,
        modal: true,
      }}
      // Adding aria-hidden to the app container is unnecessary with aria-modal set on the modal.
      // See https://github.com/DataBiosphere/terra-ui/pull/2541
      ariaHideApp={false}
      contentRef={(node: HTMLDivElement) => {
        modalElement.current = node;
      }}
      isOpen
      parentSelector={getPopupRoot}
      // Customize focus handling using onAfterOpen to properly manage focus where
      // react-modal and react-focus-lock interact.
      // See https://github.com/DataBiosphere/terra-ui/pull/1938
      shouldFocusAfterRender={false}
      shouldReturnFocusAfterClose={false}
      style={{
        overlay: modalStyles.overlay,
        content: {
          ...modalStyles.modal,
          width,
          ...styles?.modal,
        },
      }}
      onAfterOpen={() => {
        // Since this is called right after the Modal is mounted, modalElement.current should always be non-null here.
        const nodeToFocus = modalElement.current!.contains(document.activeElement)
          ? document.activeElement
          : modalElement.current;

        // Add the focus update to the end of the event queue.
        // Per react-focus-lock: https://github.com/theKashey/react-focus-lock#unmounting-and-focus-management
        setTimeout(() => {
          // Store the previously focused element so that focus can be returned to it after the modal is closed.
          previouslyFocusedElement.current = modalElement.current?.contains(document.activeElement)
            ? previouslyFocusedElement.current
            : document.activeElement;

          // modalElement.current may be null here if the modal has been unmounted before this is reached.
          // This is most likely to occur in tests.
          const isModalMounted = modalElement.current !== null;
          if (isModalMounted) {
            const isFocusWithinModal =
              !!document.activeElement &&
              (modalElement.current === document.activeElement ||
                modalElement.current!.contains(document.activeElement));

            // If focus is already within the modal, leave it alone.
            // This avoids issues in tests where focus is unexpectedly moved after an interaction.
            if (!isFocusWithinModal && document.contains(nodeToFocus) && nodeToFocus instanceof HTMLElement) {
              nodeToFocus.focus();
            }
          }
        }, 0);
      }}
      onRequestClose={onDismiss}
      {...otherProps}
    >
      {hasTitle && (
        <div style={modalStyles.header}>
          <div id={titleId} style={modalStyles.title}>
            {title}
          </div>
          {titleChildren}
          {showX && (
            <Clickable
              aria-label='Close modal'
              style={{ alignSelf: 'flex-start', marginLeft: 'auto' }}
              onClick={onDismiss}
            >
              {icon('times-circle')}
            </Clickable>
          )}
        </div>
      )}
      {children}
      {showButtons && (
        <div style={{ ...modalStyles.buttonRow, ...styles?.buttonRow }}>
          {showCancel && (
            <ButtonSecondary style={{ marginRight: '1rem' }} onClick={onDismiss}>
              {cancelText}
            </ButtonSecondary>
          )}
          {(() => {
            if (okButton === undefined) {
              return (
                <ButtonPrimary danger={danger} onClick={onDismiss}>
                  OK
                </ButtonPrimary>
              );
            }
            if (typeof okButton === 'string') {
              return (
                <ButtonPrimary danger={danger} onClick={onDismiss}>
                  {okButton}
                </ButtonPrimary>
              );
            }
            if (typeof okButton === 'function') {
              return (
                <ButtonPrimary danger={danger} onClick={okButton}>
                  OK
                </ButtonPrimary>
              );
            }
            return okButton;
          })()}
        </div>
      )}
    </RModal>
  );
};
