import { asMockedFn } from '@terra-ui-packages/test-utils';
import { fireEvent, screen } from '@testing-library/react';
import { addDays } from 'date-fns/fp';
import React, { ReactNode } from 'react';
import { Store } from 'react-notifications-component';
import {
  clearMatchingNotifications,
  clearNotification,
  isNotificationMuted,
  muteNotification,
  notify,
} from 'src/libs/notifications';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';
import { notificationStore } from 'src/libs/state';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

type ReactNotificationsComponentExports = typeof import('react-notifications-component');
type NotificationsStore = ReactNotificationsComponentExports['Store'];
jest.mock('react-notifications-component', (): ReactNotificationsComponentExports => {
  const actual = jest.requireActual<ReactNotificationsComponentExports>('react-notifications-component');
  return {
    ...actual,
    Store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    } as Partial<NotificationsStore> as NotificationsStore,
  };
});

jest.mock('src/libs/prefs');

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

let notificationContent: ReactNode;

beforeEach(() => {
  asMockedFn(getLocalPref).mockReturnValue(undefined);
  notificationContent = '';
  asMockedFn(Store.addNotification).mockImplementation((n): string => {
    notificationContent = n.content ? (n.content as ReactNode) : '';
    return n.id ? n.id : '';
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  notificationStore.reset();
});

describe('notify', () => {
  it('adds notification to stores', () => {
    // Act
    notify('info', 'Test notification', {
      id: 'test-notification',
      message: 'This is only a test',
    });

    // Assert
    expect(notificationStore.get()).toEqual([
      expect.objectContaining({
        id: 'test-notification',
        type: 'info',
        title: 'Test notification',
        message: 'This is only a test',
      }),
    ]);
    expect(Store.addNotification).toHaveBeenCalledWith(expect.objectContaining({ id: 'test-notification' }));
  });

  it('does not add notification to store if notification is muted', () => {
    // Arrange
    asMockedFn(getLocalPref).mockImplementation((key) => {
      return key === 'mute-notification/test-notification' ? Date.now() + 1 : undefined;
    });

    // Act
    notify('info', 'Test notification', { id: 'test-notification' });

    // Assert
    expect(notificationStore.get()).toEqual([]);
    expect(Store.addNotification).not.toHaveBeenCalled();
  });

  it('renders info notification', () => {
    // Arrange
    notify('info', 'Test notification', {
      id: 'test-notification',
      message: 'This is only a test',
    });

    // Act
    render(<div>{notificationContent}</div>);

    // Assert
    screen.getByText('This is only a test');
    screen.getByLabelText('info notification');
  });

  it('renders warning notification', () => {
    // Arrange
    notify('warn', 'Test notification', {
      id: 'test-notification',
      message: 'This is only a warning',
    });

    // Act
    render(<div>{notificationContent}</div>);

    // Assert
    screen.getByText('This is only a warning');
    screen.getByLabelText('warning notification');
  });

  it('renders error notification', () => {
    // Arrange
    notify('error', 'Test notification', {
      id: 'test-notification',
      message: 'This is an error',
    });

    // Act
    render(<div>{notificationContent}</div>);

    // Assert
    screen.getByText('This is an error');
    screen.getByLabelText('error notification');
  });

  it('renders error notification details', () => {
    // Arrange
    notify('error', 'Test notification', {
      id: 'test-notification',
      message: 'This is an error',
      detail: 'Things went BOOM!',
    });
    render(<div>{notificationContent}</div>);

    // Act
    fireEvent.click(screen.getByText('Details'));

    // Assert
    screen.getByText('Things went BOOM!');
  });

  it('renders navigation buttons if needed', () => {
    // Arrange
    notify('error', 'Test notification', {
      id: 'test-notification',
      message: 'first message',
    });
    notify('error', 'Test notification', {
      id: 'test-notification',
      message: 'second message',
    });
    render(<div>{notificationContent}</div>);

    // Act and Assert
    screen.getByText('first message');
    screen.getByText('1/2');
    const nextButton = screen.getByLabelText('Next notification');
    const previousButton = screen.getByLabelText('Previous notification');
    expect(nextButton).toHaveAttribute('aria-disabled', 'false');
    expect(previousButton).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(nextButton);
    screen.getByText('second message');
    screen.getByText('2/2');
    expect(nextButton).toHaveAttribute('aria-disabled', 'true');
    expect(previousButton).toHaveAttribute('aria-disabled', 'false');

    fireEvent.click(previousButton);
    screen.getByText('first message');
    screen.getByText('1/2');
  });
});

describe('clearNotification', () => {
  it('removes notification from react-notifications-component store', () => {
    // Act
    clearNotification('test-notification');

    // Assert
    expect(Store.removeNotification).toHaveBeenCalledWith('test-notification');
  });
});

describe('clearMatchingNotifications', () => {
  it('clears all notifications in store with IDs matching prefix', () => {
    // Arrange
    notificationStore.set([{ id: 'category1/foo' }, { id: 'category1/bar' }, { id: 'category2/foo' }]);

    // Act
    clearMatchingNotifications('category1/');

    // Assert
    expect(asMockedFn(Store.removeNotification).mock.calls).toEqual([['category1/foo'], ['category1/bar']]);
  });
});

describe('isNotificationMuted', () => {
  it('reads mute preference', () => {
    // Act
    isNotificationMuted('test-notification');

    // Assert
    expect(getLocalPref).toHaveBeenCalledWith('mute-notification/test-notification');
  });

  it('returns false if no mute preference is set', () => {
    // Act
    const isMuted = isNotificationMuted('test-notification');

    // Assert
    expect(isMuted).toBe(false);
  });

  it('returns true if mute preference is set to -1', () => {
    // Arrange
    asMockedFn(getLocalPref).mockReturnValue(-1);

    // Act
    const isMuted = isNotificationMuted('test-notification');

    // Assert
    expect(isMuted).toBe(true);
  });

  it('returns false if mute preference is before current time', () => {
    // Arrange
    asMockedFn(getLocalPref).mockReturnValue(Date.now() - 1);

    // Act
    const isMuted = isNotificationMuted('test-notification');

    // Assert
    expect(isMuted).toBe(false);
  });

  it('returns true if mute preference is after current time', () => {
    // Arrange
    asMockedFn(getLocalPref).mockReturnValue(Date.now() + 1);

    // Act
    const isMuted = isNotificationMuted('test-notification');

    // Assert
    expect(isMuted).toBe(true);
  });
});

describe('muteNotification', () => {
  it('sets preference', () => {
    // Arrange
    const tomorrow = addDays(1, new Date()).getTime();

    // Act
    muteNotification('test-notification', tomorrow);

    // Assert
    expect(setLocalPref).toHaveBeenCalledWith('mute-notification/test-notification', tomorrow);
  });

  it('defaults to -1 if no until argument is provided', () => {
    // Act
    muteNotification('test-notification');

    // Assert
    expect(setLocalPref).toHaveBeenCalledWith('mute-notification/test-notification', -1);
  });
});
