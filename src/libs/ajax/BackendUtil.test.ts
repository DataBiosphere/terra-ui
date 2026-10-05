import { authOpts } from 'src/auth/auth-session';
import { fetchOrchestration } from 'src/libs/ajax/ajax-common';
import { BackendUtil, UrlSizeResponse } from 'src/libs/ajax/BackendUtil';
import { asMockedFn } from 'src/testing/test-utils';

type AjaxCommonExports = typeof import('src/libs/ajax/ajax-common');
jest.mock('src/libs/ajax/ajax-common', (): AjaxCommonExports => {
  return {
    ...jest.requireActual<AjaxCommonExports>('src/libs/ajax/ajax-common'),
    fetchOrchestration: jest.fn(),
  };
});

type AuthSessionExports = typeof import('src/auth/auth-session');
jest.mock('src/auth/auth-session', (): AuthSessionExports => {
  return {
    ...jest.requireActual<AuthSessionExports>('src/auth/auth-session'),
    authOpts: jest.fn(),
  };
});

const manifestUrlString = 'https://gen3-export.s3.amazonaws.com/exports/abc/manifest.json?X-Amz-Signature=mmm';

/** Identical to the JSON body in the shared contract: one entry per URL in the manifest. */
const manifestUrlSizeResponse: UrlSizeResponse = {
  originalUrl: manifestUrlString,
  files: [
    {
      signed_url: 'https://gen3-export.s3.amazonaws.com/exports/abc/part-1.avro?X-Amz-Signature=aaa',
      sizeBytes: 104857600,
    },
    {
      signed_url: 'https://gen3-export.s3.amazonaws.com/exports/abc/part-2.avro?X-Amz-Signature=bbb',
      sizeBytes: 52428800,
    },
  ],
};

/** A single AVRO URL. cWDS resolves this to a one-entry list, the same shape a manifest resolves to. */
const singleAvroUrlString = 'https://gen3-export.s3.amazonaws.com/exports/abc/part-1.avro?X-Amz-Signature=aaa';

const singleAvroUrlSizeResponse: UrlSizeResponse = {
  originalUrl: singleAvroUrlString,
  files: [{ signed_url: singleAvroUrlString, sizeBytes: 104857600 }],
};

describe('BackendUtil', () => {
  beforeEach(() => {
    asMockedFn(authOpts).mockReturnValue({ headers: { Authorization: 'Bearer token' } });
    asMockedFn(fetchOrchestration).mockResolvedValue(new Response(JSON.stringify(manifestUrlSizeResponse)));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('preprocess', () => {
    it('posts the url to Orchestration', async () => {
      // Act
      await BackendUtil().preprocess(manifestUrlString);

      // Assert
      expect(fetchOrchestration).toHaveBeenCalledTimes(1);
      const [path, options] = asMockedFn(fetchOrchestration).mock.calls[0];
      expect(path).toBe('api/import/getUrlSize');
      expect(options).toMatchObject({
        method: 'POST',
        headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' },
      });
      // The query string carries the signature and must be passed through unchanged.
      expect(JSON.parse(options!.body as string)).toEqual({ url: manifestUrlString });
    });

    it('passes the abort signal through', async () => {
      // Arrange
      const { signal } = new AbortController();

      // Act
      await BackendUtil(signal).preprocess(manifestUrlString);

      // Assert
      expect(asMockedFn(fetchOrchestration).mock.calls[0][1]).toMatchObject({ signal });
    });

    it('returns the parsed response', async () => {
      // Act
      const result = await BackendUtil().preprocess(manifestUrlString);

      // Assert
      expect(result).toEqual(manifestUrlSizeResponse);
    });

    it('returns a one-entry list for a single AVRO url', async () => {
      // Arrange
      asMockedFn(fetchOrchestration).mockResolvedValue(new Response(JSON.stringify(singleAvroUrlSizeResponse)));

      // Act
      const result = await BackendUtil().preprocess(singleAvroUrlString);

      // Assert
      // The response shape does not change for a single file; only the length of files does.
      expect(result).toEqual(singleAvroUrlSizeResponse);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].signed_url).toBe(singleAvroUrlString);
    });

    it('propagates a non-2xx Response', async () => {
      // Arrange
      const errorResponse = new Response('{"message":"x"}', { status: 400 });
      asMockedFn(fetchOrchestration).mockRejectedValue(errorResponse);

      // Act / Assert
      await expect(BackendUtil().preprocess(manifestUrlString)).rejects.toBe(errorResponse);
    });
  });
});
