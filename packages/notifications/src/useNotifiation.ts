import { createContext, createElement, PropsWithChildren, useContext } from 'react';

export type NotificationType = 'error' | 'warn' | 'info' | 'success' | 'welcome';
export interface NotificationOptions {
  detail: string | unknown;
}

export interface NotificationsContract {
  notify: (type: NotificationType, title: string, options?: NotificationOptions) => void;
}
const NotificationsContext = createContext<NotificationsContract | null>(null);

export type NotificationsProviderProps = PropsWithChildren<{
  notifications: NotificationsContract;
}>;

/** Provides notifications to descendents via React Context. */
export const NotificationsProvider = (props: NotificationsProviderProps) => {
  const { children, notifications } = props;
  return createElement(NotificationsContext.Provider, { value: notifications }, children);
};
/** Gets the current NotificationsProvider from React context. */
export const useNotificationsFromContext = (): NotificationsContract => {
  const notifier = useContext(NotificationsContext);
  if (!notifier) {
    throw new Error(
      'No NotificationsProvider provided. Components (or hooks within them) using useNotificationsFromContext must be descendants of NotificationsProvider.'
    );
  }
  return notifier;
};
