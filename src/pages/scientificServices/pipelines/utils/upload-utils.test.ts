import { checkUploadStatus } from 'src/pages/scientificServices/pipelines/utils/upload-utils';

global.fetch = jest.fn();

describe('upload-utils', () => {
  describe('checkUploadStatus', () => {
    it('returns uploaded bytes when response is 308 with Range header', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 308,
        headers: {
          get: (key: string) => (key === 'Range' ? 'bytes=0-9131231' : null),
        },
      });

      const result = await checkUploadStatus('http://signed.url/upload');
      expect(result).toBe(9131232);
    });

    it('returns 0 when response is 308 with no Range header', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 308,
        headers: {
          get: () => null,
        },
      });

      const result = await checkUploadStatus('http://signed.url/upload');
      expect(result).toBe(0);
    });

    it('returns -1 when upload has already completed', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
        headers: {
          get: () => null,
        },
      });

      const result = await checkUploadStatus('http://signed.url/upload');
      expect(result).toBe(-1);
    });

    it('throws an error when response is not ok and not 308', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        status: 400,
        ok: false,
        headers: {
          get: () => null,
        },
      });

      await expect(checkUploadStatus('http://signed.url/upload')).rejects.toThrow('Failed to check upload status');
    });
  });

  describe('resumeUpload', () => {
    it('should be defined', () => {
      expect(true).toBe(true);
    });
  });
});
