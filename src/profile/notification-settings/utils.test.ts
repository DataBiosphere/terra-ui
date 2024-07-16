import { asMockedFn } from '@terra-ui-packages/test-utils';
import { refreshSamUserAttributes, refreshTerraProfile } from 'src/auth/user-profile/user';
import { Ajax } from 'src/libs/ajax';
import Events, { EventWorkspaceAttributes, extractWorkspaceDetails } from 'src/libs/events';

import { notificationEnabled, updateNotificationPreferences, updateUserAttributes } from './utils';

type AjaxContract = ReturnType<typeof Ajax>;

jest.mock('src/auth/auth');
jest.mock('src/auth/user-profile/user');
jest.mock('src/libs/ajax');

describe('utils', () => {
  describe('notificationEnabled', () => {
    it('returns true if any key is not present', () => {
      const prefsData = {
        key1: 'false',
        key2: 'false',
      };
      expect(notificationEnabled(['missing'], prefsData)).toBeTruthy();
      expect(notificationEnabled(['key1', 'missing'], prefsData)).toBeTruthy();
    });

    it('returns false if all keys are present with value false', () => {
      const prefsData = {
        key1: 'false',
        key2: 'false',
        key3: 'true',
      };
      expect(notificationEnabled(['key1'], prefsData)).toBeFalsy();
      expect(notificationEnabled(['key1', 'key2'], prefsData)).toBeFalsy();
      expect(notificationEnabled(['key2', 'key3'], prefsData)).toBeTruthy();
    });
  });

  describe('updateNotificationPreferences', () => {
    const setPreferences = jest.fn().mockReturnValue(Promise.resolve());
    const captureEvent = jest.fn();
    const keys = ['key1', 'key2'];
    const workspace = { namespace: 'ns', name: 'name' } as EventWorkspaceAttributes;

    beforeEach(() => {
      jest.resetAllMocks();
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: {
              captureEvent,
            } as Partial<AjaxContract['Metrics']>,
            User: {
              profile: {
                setPreferences,
              } as Partial<AjaxContract['User']['profile']>,
            } as Partial<AjaxContract['User']>,
          } as Partial<AjaxContract> as AjaxContract)
      );
    });

    it('updates preferences, refreshes the profile, and sends an event when a preference is disabled', async () => {
      // Arrange
      const expectedEventDetails = {
        notificationKeys: ['key1', 'key2'],
        enabled: false,
        notificationType: 'WorkspaceChanged',
      };

      // Act
      await updateNotificationPreferences(keys, false, 'WorkspaceChanged', workspace);

      // Assert
      expect(refreshTerraProfile).toHaveBeenCalled();
      expect(setPreferences).toHaveBeenCalledWith({ key1: 'false', key2: 'false' });
      expect(captureEvent).toHaveBeenCalledWith(Events.notificationToggle, {
        ...expectedEventDetails,
        ...extractWorkspaceDetails(workspace),
      });
    });

    it('updates preferences, refreshes the profile, and sends an event when a preference is enabled', async () => {
      // Arrange
      const expectedEventDetails = {
        notificationKeys: ['key1', 'key2'],
        enabled: true,
        notificationType: 'WorkspaceChanged',
      };

      // Act
      await updateNotificationPreferences(keys, true, 'WorkspaceChanged', workspace);

      // Assert
      expect(refreshTerraProfile).toHaveBeenCalled();
      expect(setPreferences).toHaveBeenCalledWith({ key1: 'true', key2: 'true' });
      expect(captureEvent).toHaveBeenCalledWith(Events.notificationToggle, {
        ...expectedEventDetails,
        ...extractWorkspaceDetails(workspace),
      });
    });
  });

  describe('updateUserAttributes', () => {
    const setUserAttributes = jest.fn().mockReturnValue(Promise.resolve());
    const captureEvent = jest.fn();
    const keys = ['key1', 'key2'];

    beforeEach(() => {
      jest.resetAllMocks();
      asMockedFn(Ajax).mockImplementation(
        () =>
          ({
            Metrics: {
              captureEvent,
            } as Partial<AjaxContract['Metrics']>,
            User: {
              setUserAttributes,
            } as Partial<AjaxContract['User']>,
          } as Partial<AjaxContract> as AjaxContract)
      );
    });

    it('updates user attributes, refreshes the sam profile, and sends an event when the preference is disabled', async () => {
      // Arrange
      const expectedEventDetails = {
        notificationKeys: ['key1', 'key2'],
        enabled: false,
        notificationType: 'Marketing',
      };

      // Act
      await updateUserAttributes(keys, false, 'Marketing');

      // Assert
      expect(refreshSamUserAttributes).toHaveBeenCalled();
      expect(setUserAttributes).toHaveBeenCalledWith({ marketingConsent: false });
      expect(captureEvent).toHaveBeenCalledWith(Events.notificationToggle, expectedEventDetails);
    });

    it('updates user attributes, refreshes the sam profile, and sends an event when the preference is enabled', async () => {
      // Arrange
      const expectedEventDetails = {
        notificationKeys: ['key1', 'key2'],
        enabled: true,
        notificationType: 'Marketing',
      };

      // Act
      await updateUserAttributes(keys, true, 'Marketing');

      // Assert
      expect(refreshSamUserAttributes).toHaveBeenCalled();
      expect(setUserAttributes).toHaveBeenCalledWith({ marketingConsent: true });
      expect(captureEvent).toHaveBeenCalledWith(Events.notificationToggle, expectedEventDetails);
    });
  });
});
