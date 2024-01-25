import { asMockedFn } from '@terra-ui-packages/test-utils';
import { Ajax } from 'src/libs/ajax';

import { fetchWDS } from './ajax-common';

type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');

jest.mock('src/libs/ajax/ajax-common', (): AjaxCommonExports => {
  return {
    ...jest.requireActual<AjaxCommonExports>('src/libs/ajax/ajax-common'),
    fetchWDS: jest.fn(),
  };
});

describe('WorkspaceData', () => {
  describe('getCapabilities', () => {
    type SetupOptions = {
      stubbedCapabilitiesJson?: string;
      stubbedCapabilitiesResponse?: Response;
      stubbedCapabilitiesRejection?: any;
      wdsProxyUrl?: string;
    };
    type SetupResult = {
      wdsProxyUrl: string;
    };
    function setup({
      wdsProxyUrl = 'https://wds.test.proxy.url',
      stubbedCapabilitiesJson = '{"capabilities":true}',
      stubbedCapabilitiesResponse = new Response(stubbedCapabilitiesJson),
      stubbedCapabilitiesRejection = undefined,
    }: SetupOptions): SetupResult {
      asMockedFn(fetchWDS).mockImplementation((wdsProxyUrlRoot: string) => {
        if (wdsProxyUrlRoot !== wdsProxyUrl) {
          throw new Error(`Unexpected wdsProxyUrlRoot: ${wdsProxyUrlRoot}`);
        }
        return (path: RequestInfo | URL, _options: RequestInit | undefined) => {
          if (path === 'capabilities/v1') {
            if (stubbedCapabilitiesRejection !== undefined) {
              return Promise.reject(stubbedCapabilitiesRejection);
            }
            return Promise.resolve(stubbedCapabilitiesResponse);
          }
          throw new Error('Unexpected path');
        };
      });

      return {
        wdsProxyUrl,
      };
    }

    it('returns true for capabilities when present and true', async () => {
      // Arrange
      const { wdsProxyUrl } = setup({ stubbedCapabilitiesJson: '{ "capabilities": true }' });

      // Act
      const capabilities = await Ajax().WorkspaceData.getCapabilities(wdsProxyUrl);

      // Assert
      expect(fetchWDS).toHaveBeenCalledWith(wdsProxyUrl);
      expect(capabilities.capabilities).toEqual(true);
    });

    it('returns false for capabilities when present and false', async () => {
      // Arrange
      const { wdsProxyUrl } = setup({ stubbedCapabilitiesJson: '{ "capabilities": false }' });

      // Act
      const capabilities = await Ajax().WorkspaceData.getCapabilities(wdsProxyUrl);

      // Assert
      expect(fetchWDS).toHaveBeenCalledWith(wdsProxyUrl);
      expect(capabilities.capabilities).toEqual(false);
    });

    it('returns false for capabilities when present and non-boolean', async () => {
      // Arrange
      const { wdsProxyUrl } = setup({ stubbedCapabilitiesJson: '{ "capabilities": "false" }' });

      // Act
      const capabilities = await Ajax().WorkspaceData.getCapabilities(wdsProxyUrl);

      // Assert
      expect(fetchWDS).toHaveBeenCalledWith(wdsProxyUrl);
      expect(capabilities.capabilities).toEqual(false);
    });

    it('returns true for an unknown capability that is present and true', async () => {
      // Arrange
      const { wdsProxyUrl } = setup({ stubbedCapabilitiesJson: '{ "unknownCapability": true }' });

      // Act
      const capabilities = await Ajax().WorkspaceData.getCapabilities(wdsProxyUrl);

      // Assert
      expect(fetchWDS).toHaveBeenCalledWith(wdsProxyUrl);
      expect(capabilities.unknownCapability).toEqual(true);
    });

    it('returns false for capabilities when response is a 404', async () => {
      // Arrange
      const { wdsProxyUrl } = setup({
        stubbedCapabilitiesRejection: new Response('{ "message": "Not found"}', { status: 404 }),
      });
      // this scenario logs a message indicating that capabilities aren't enabled; this should not
      // appear in test output
      jest.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const capabilities = await Ajax().WorkspaceData.getCapabilities(wdsProxyUrl);

      // Assert
      expect(fetchWDS).toHaveBeenCalledWith(wdsProxyUrl);
      expect(capabilities.capabilities).toEqual(false);
    });

    it('throws on an unexpected error', async () => {
      // Arrange
      const { wdsProxyUrl } = setup({
        stubbedCapabilitiesRejection: new Response('{ "message": "Internal server error"}', { status: 500 }),
      });

      // Act
      const act = async () => Ajax().WorkspaceData.getCapabilities(wdsProxyUrl);

      // Assert
      await expect(act()).rejects.toEqual(
        expect.objectContaining({
          status: 500,
        })
      );
    });
  });
});
