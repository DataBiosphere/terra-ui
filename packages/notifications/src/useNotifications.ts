import { AnyPromiseFn } from '@terra-ui-packages/core-utils';
import { createContext, createElement, PropsWithChildren, ReactNode, useContext } from 'react';

export type NotificationType = 'error' | 'warn' | 'info' | 'success' | 'welcome';
export interface NotificationOptions {
  /**
   * string, Error(unknown), or json object to be displayed in detail section
   */
  detail?: unknown;
}

export interface Notifier {
  notify: (type: NotificationType, title: string, options?: NotificationOptions) => void;
}

export interface NotificationsContract extends Notifier {
  reportError: (title: string, obj?: unknown) => Promise<void>;
  reportErrorAndRethrow: <F extends AnyPromiseFn>(title: string) => (fn: F) => F;
  withErrorReportingInModal: <F extends AnyPromiseFn>(title: string, onDismiss: () => void) => (fn: F) => F;
  withErrorReporting: <F extends AnyPromiseFn>(title: string) => (fn: F) => F;
}

const NotificationsContext = createContext<NotificationsContract | null>(null);

export type NotificationsProviderProps = PropsWithChildren<{
  notifications: NotificationsContract;
}>;

export const text = {
  error: {
    noProvider:
      'No NotificationsProvider provided. Components (or hooks within them) using useNotificationsFromContext must be descendants of NotificationsProvider.',
  },
};

/** Provides notifications to descendents via React Context. */
export const NotificationsProvider = (props: NotificationsProviderProps): ReactNode => {
  const { children, notifications } = props;
  return createElement(NotificationsContext.Provider, { value: notifications }, children);
};
/** Gets the current NotificationsProvider from React context. */
export const useNotificationsFromContext = (): NotificationsContract => {
  const notifier = useContext(NotificationsContext);
  if (!notifier) {
    throw new Error(text.error.noProvider);
  }
  return notifier;
};
