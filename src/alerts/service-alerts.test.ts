import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { Ajax, AjaxContract } from 'src/libs/ajax';

import { getServiceAlerts } from './service-alerts';

jest.mock('src/libs/ajax');

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
    asMockedFn(Ajax).mockReturnValue({
      FirecloudBucket: { getServiceAlerts: mockGetServiceAlerts },
    } as DeepPartial<AjaxContract> as AjaxContract);

    // Act
    await getServiceAlerts();

    // Assert
    expect(mockGetServiceAlerts).toHaveBeenCalled();
  });

  it('adds IDs to alerts using hashes of alert content', async () => {
    // Arrange
    asMockedFn(Ajax).mockReturnValue({
      FirecloudBucket: {
        getServiceAlerts: () =>
          Promise.resolve([
            {
              title: 'The systems are down!',
              message: 'Something is terribly wrong',
            },
            {
              title: 'Scheduled maintenance',
              message: 'Offline tomorrow',
            },
          ]),
      },
    } as AjaxContract);

    // Act
    const serviceAlerts = await getServiceAlerts();

    // Assert
    expect(serviceAlerts.map((alert) => alert.id)).toEqual([
      '94a2d01d8daeece88bce47cbfc702593005c5466dd021e677f3c293a62cec57e',
      '2e54894f36216834f591df1e1fb355789cf5622e02dd23e855c9639c3d080dc1',
    ]);
  });

  it('defaults severity to warning', async () => {
    // Arrange
    asMockedFn(Ajax).mockReturnValue({
      FirecloudBucket: {
        getServiceAlerts: () =>
          Promise.resolve([
            {
              title: 'The systems are down!',
              message: 'Something is terribly wrong',
            },
            {
              title: 'Scheduled maintenance',
              message: 'Offline tomorrow',
              severity: 'info',
            },
          ]),
      },
    } as AjaxContract);

    // Act
    const serviceAlerts = await getServiceAlerts();

    // Assert
    expect(serviceAlerts.map((alert) => alert.severity)).toEqual(['warn', 'info']);
  });
});
