import _ from 'lodash/fp';
import { Ajax } from 'src/libs/ajax';
import { getServiceAlerts } from 'src/libs/service-alerts';

jest.mock('src/libs/ajax');

jest.mock('src/libs/utils', () => {
  const originalModule = jest.requireActual('src/libs/utils');
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
    const mockGetServiceAlerts = jest.fn().mockReturnValue(Promise.resolve([]));
    Ajax.mockReturnValue({ FirecloudBucket: { getServiceAlerts: mockGetServiceAlerts } });

    await getServiceAlerts();
    expect(mockGetServiceAlerts).toHaveBeenCalled();
  });

  it('adds IDs to alerts using hashes of alert content', async () => {
    Ajax.mockReturnValue({
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
    });

    const serviceAlerts = await getServiceAlerts();
    expect(_.map('id', serviceAlerts)).toEqual([
      '94a2d01d8daeece88bce47cbfc702593005c5466dd021e677f3c293a62cec57e',
      '2e54894f36216834f591df1e1fb355789cf5622e02dd23e855c9639c3d080dc1',
    ]);
  });

  it('defaults severity to warning', async () => {
    Ajax.mockReturnValue({
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
    });

    const serviceAlerts = await getServiceAlerts();
    expect(_.map('severity', serviceAlerts)).toEqual(['warn', 'info']);
  });
});
