import { Children, PropsWithChildren, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export const popupRootId = 'modal-root';

/**
 * Popups, modals, etc. are rendered into the popup root element.
 * This function returns that element, creating it if it does not exist.
 */
export const getPopupRoot = (): HTMLElement => {
  let popupRoot = document.getElementById(popupRootId);
  if (!popupRoot) {
    popupRoot = document.createElement('div');
    popupRoot.id = popupRootId;
    popupRoot.role = 'complementary';
    document.body.append(popupRoot);
  }
  return popupRoot;
};

export type PopupPortalProps = PropsWithChildren<{}>;

/**
 * Renders children in the popup root element.
 */
export const PopupPortal = (props: PopupPortalProps): ReactNode => {
  const { children } = props;
  const child = Children.only(children);
  return createPortal(child, getPopupRoot());
};
