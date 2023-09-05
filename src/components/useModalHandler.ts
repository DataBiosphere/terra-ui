import { ReactNode, useState } from 'react';

export interface ModalHandler<OpenArgs> {
  /**
   * consumer can call this method to open the modal with a given args value.
   * @param args
   */
  open: (args: OpenArgs) => void;

  /**
   * closes the modal, and resets current modal args to undefined
   */
  close: () => void;

  /**
   * can be referenced by consuming component to know if modal is currently open
   */
  isOpen: Readonly<boolean>;

  /**
   * holds the current modal args for reference by the consuming component
   */
  args: Readonly<OpenArgs> | undefined;

  /**
   * A render function that consuming component should call in their render
   * block so that the modal is rendered if and when open(arg) is called.
   */
  maybeRender: () => ReactNode;
}

export type ModalFactoryFn<OpenArgs> = (args: OpenArgs, close: () => void) => ReactNode;

/**
 * A hook that returns a modal handler object.  Open/close state is handled
 * internally, and the modal is associated with a current args value when opened.
 * @param modalFactory
 */
export const useModalHandler = <OpenArgs>(modalFactory: ModalFactoryFn<OpenArgs>): ModalHandler<OpenArgs> => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [openArgs, setOpenArgs] = useState<OpenArgs>();

  const handler: ModalHandler<OpenArgs> = {
    open: (args: OpenArgs) => {
      setOpenArgs(args);
      setIsOpen(true);
    },
    close: () => {
      setOpenArgs(undefined);
      setIsOpen(false);
    },
    isOpen,
    args: openArgs,
    maybeRender: () => {
      // openArgs will be given value as part of open() call above,
      // so it's safe to assume OpenArgs typing when isOpen is true
      return isOpen && modalFactory(openArgs as OpenArgs, handler.close);
    },
  };
  return handler;
};
