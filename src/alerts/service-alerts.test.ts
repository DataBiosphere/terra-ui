import { asMockedFn, partial } from '@terra-ui-packages/test-utils';
import { FirecloudBucket, FirecloudBucketAjaxContract } from 'src/libs/ajax/firecloud/FirecloudBucket';
import * as brandUtils from 'src/libs/brand-utils';

import { getServiceAlerts } from './service-alerts';

jest.mock('src/libs/ajax/firecloud/FirecloudBucket');

type UtilsExports = typeof import('src/libs/utils');
jest.mock('src/libs/utils', (): UtilsExports => {
  const originalModule = jest.requireActual<UtilsExports>('src/libs/utils');
  const crypto = jest.requireActual('crypto');
  return {
    ...originalModule,
    // The Web Crypto API used by Utils.sha256 is not available in Jest / JS DOM.
    // Replace it with an implementation using Node's crypto module.
    sha256: (message) => crypto.createHash('sha256').update(message).digest('hex'),
  };
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getServiceAlerts', () => {
  it('fetches service alerts from GCS', async () => {
    // Arrange
    const mockGetServiceAlerts = jest.fn().mockReturnValue(Promise.resolve([]));
    asMockedFn(FirecloudBucket).mockReturnValue(
      partial<FirecloudBucketAjaxContract>({
        getServiceAlerts: mockGetServiceAlerts,
      })
    );

    // Act
    await getServiceAlerts();

    // Assert
    expect(mockGetServiceAlerts).toHaveBeenCalled();
  });

  it('adds IDs to alerts using hashes of alert content', async () => {
    // Arrange
    asMockedFn(FirecloudBucket).mockReturnValue(
      partial<FirecloudBucketAjaxContract>({
        getServiceAlerts: async () => [
          {
            title: 'The systems are down!',
            message: 'Something is terribly wrong',
          },
          {
            title: 'Scheduled maintenance',
            message: 'Offline tomorrow',
          },
        ],
      })
    );

    // Act
    const serviceAlerts = await getServiceAlerts();

    // Assert
    expect(serviceAlerts.map((alert) => alert.id)).toEqual([
      '94a2d01d8daeece88bce47cbfc702593005c5466dd021e677f3c293a62cec57e',
      '2e54894f36216834f591df1e1fb355789cf5622e02dd23e855c9639c3d080dc1',
    ]);
  });

  it('map severity to alerts', async () => {
    // Arrange
    asMockedFn(FirecloudBucket).mockReturnValue(
      partial<FirecloudBucketAjaxContract>({
        getServiceAlerts: async () => [
          {
            title: 'The systems are down!',
            message: 'Something is terribly wrong',
            severity: 'blocker', // This should be mapped to 'error'
          },
          {
            title: 'The systems are down!',
            message: 'Something is terribly wrong',
            severity: 'critical', // This should be mapped to 'warn'
          },
          {
            title: 'The systems are down!',
            message: 'Something is terribly wrong', // This should be mapped to 'warn'
          },
          {
            title: 'Scheduled maintenance',
            message: 'Offline tomorrow',
            severity: 'info', // This should be mapped to 'info'
          },
        ],
      })
    );

    // Act
    const serviceAlerts = await getServiceAlerts();

    // Assert
    expect(serviceAlerts.map((alert) => alert.severity)).toEqual(['error', 'warn', 'warn', 'info']);
  });
});

describe('getServiceAlerts with brand variations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls getTeaspoonsServiceAlerts when isScientificServices is true', async () => {
    // Arrange
    const mockGetTeaspoonsServiceAlerts = jest.fn().mockReturnValue(Promise.resolve([]));
    const mockGetServiceAlerts = jest.fn().mockReturnValue(Promise.resolve([]));

    asMockedFn(FirecloudBucket).mockReturnValue(
      partial<FirecloudBucketAjaxContract>({
        getTeaspoonsServiceAlerts: mockGetTeaspoonsServiceAlerts,
        getServiceAlerts: mockGetServiceAlerts,
      })
    );

    // Mock isScientificServices to return true
    jest.spyOn(brandUtils, 'isScientificServices').mockReturnValue(true);

    // Act
    await getServiceAlerts();

    // Assert
    expect(mockGetTeaspoonsServiceAlerts).toHaveBeenCalled();
    expect(mockGetServiceAlerts).not.toHaveBeenCalled();
  });

  it('calls getServiceAlerts when isScientificServices is false', async () => {
    // Arrange
    const mockGetTeaspoonsServiceAlerts = jest.fn().mockReturnValue(Promise.resolve([]));
    const mockGetServiceAlerts = jest.fn().mockReturnValue(Promise.resolve([]));

    asMockedFn(FirecloudBucket).mockReturnValue(
      partial<FirecloudBucketAjaxContract>({
        getTeaspoonsServiceAlerts: mockGetTeaspoonsServiceAlerts,
        getServiceAlerts: mockGetServiceAlerts,
      })
    );

    // Mock isScientificServices to return false
    jest.spyOn(brandUtils, 'isScientificServices').mockReturnValue(false);

    // Act
    await getServiceAlerts();

    // Assert
    expect(mockGetServiceAlerts).toHaveBeenCalled();
    expect(mockGetTeaspoonsServiceAlerts).not.toHaveBeenCalled();
  });
});
