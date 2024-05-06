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

export interface ErrorReportingOptions {
  rethrow?: boolean; // default: false
  onReported?: () => void;
}

export interface ErrorReporter {
  /**
   * Reports the error visually to the user using the app's notification system
   * @param title - error title
   * @param obj - an error, response, or arbitrary json-style object
   */
  reportError: (title: string, obj?: unknown) => Promise<void>;

  /**
   * Returns a function augmenter (HoF).
   * If provided function fails when called, report the error to the user with `title` as a side effect.
   * Use options arg to give onReported callback, and/or rethrow on error.
   */
  withErrorReporting: <F extends AnyPromiseFn>(title: string, options?: ErrorReportingOptions) => (fn: F) => F;
}

export interface NotificationsProvider extends Notifier, ErrorReporter {}

const NotificationsContext = createContext<NotificationsProvider | null>(null);

export type NotificationsContextProviderProps = PropsWithChildren<{
  notifications: NotificationsProvider;
}>;

export const text = {
  error: {
    noProvider:
      'No NotificationsContextProvider provided. Components (or hooks within them) using useNotificationsFromContext must be descendants of NotificationsContextProvider.',
  },
};

/** Provides notifications to descendents via React Context. */
export const NotificationsContextProvider = (props: NotificationsContextProviderProps): ReactNode => {
  const { children, notifications } = props;
  return createElement(NotificationsContext.Provider, { value: notifications }, children);
};
/** Gets the current NotificationsContextProvider from React context. */
export const useNotificationsFromContext = (): NotificationsProvider => {
  const notifier = useContext(NotificationsContext);
  if (!notifier) {
    throw new Error(text.error.noProvider);
  }
  return notifier;
};
