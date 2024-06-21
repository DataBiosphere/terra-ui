import { createContext, createElement, PropsWithChildren, ReactNode, useContext } from 'react';

import { NotificationsProvider } from './notifications-provider';

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
/** Gets the current NotificationsProvider from React context. */
export const useNotificationsFromContext = (): NotificationsProvider => {
  const notifier = useContext(NotificationsContext);
  if (!notifier) {
    throw new Error(text.error.noProvider);
  }
  return notifier;
};
