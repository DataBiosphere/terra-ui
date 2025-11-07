import {
  checkUploadStatus,
  initiateResumableUpload,
  uploadTimeRemainingDisplayText,
} from 'src/pages/scientificServices/pipelines/utils/upload-utils';
import * as uploadUtils from 'src/pages/scientificServices/pipelines/utils/upload-utils';

global.fetch = jest.fn();

class MockXMLHttpRequest {
  upload = {
    addEventListener: jest.fn(),
  };

  addEventListener = jest.fn();

  open = jest.fn();

  setRequestHeader = jest.fn();

  send = jest.fn();
}

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
    const mockSetUploadState = jest.fn();
    const inputName = 'testInput';
    const sessionUrl = 'http://signed.url/session';
    const inputFile = new File(['abcdefghij'], 'foo.txt'); // 10 bytes

    it('returns immediately if upload is already complete', async () => {
      const mockXHR = new MockXMLHttpRequest();
      global.XMLHttpRequest = jest.fn(() => mockXHR) as any;

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 200,
        ok: true,
        headers: {
          get: () => null,
        },
      });

      await uploadUtils.resumeUpload(inputName, inputFile, sessionUrl, mockSetUploadState);

      // upload was already complete, so we shouldnt have transmitted any data
      expect(global.XMLHttpRequest).not.toHaveBeenCalled();
      expect(mockXHR.open).not.toHaveBeenCalled();
      expect(mockXHR.send).not.toHaveBeenCalled();
    });

    it('resumes upload from the correct byte', async () => {
      const mockXHR = new MockXMLHttpRequest();

      mockXHR.addEventListener = jest.fn((event, callback) => {
        if (event === 'load') {
          setTimeout(() => callback({ status: 200 }), 0);
        }
      });

      Object.defineProperty(mockXHR, 'status', {
        value: 200,
        writable: true,
      });

      global.XMLHttpRequest = jest.fn(() => mockXHR) as any;

      (global.fetch as jest.Mock).mockResolvedValue({
        status: 308,
        headers: {
          get: (key: string) => (key === 'Range' ? 'bytes=0-4' : null),
        },
      });

      await uploadUtils.resumeUpload(inputName, inputFile, sessionUrl, mockSetUploadState);

      expect(global.XMLHttpRequest).toHaveBeenCalled();
      expect(mockXHR.open).toHaveBeenCalledWith('PUT', sessionUrl);
      expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
      expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Range', 'bytes 5-9/10');
      expect(mockXHR.send).toHaveBeenCalledWith(inputFile.slice(5));
    });
  });

  describe('initiateResumableUpload', () => {
    it('initiates a resumable upload session', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: {
          get: () => 'http://signed.url/session',
        },
      });

      const mockSetUploadState = jest.fn();
      const inputName = 'testInput';
      const inputFile = new File(['abcdefghij'], 'foo.txt');
      const signedUrl = 'http://signed.url/upload';

      const mockXHR = new MockXMLHttpRequest();
      mockXHR.addEventListener = jest.fn((event, callback) => {
        if (event === 'load') {
          setTimeout(() => callback({ status: 200 }), 0);
        }
      });

      Object.defineProperty(mockXHR, 'status', {
        value: 200,
        writable: true,
      });

      global.XMLHttpRequest = jest.fn(() => mockXHR) as any;

      await initiateResumableUpload(inputName, inputFile, signedUrl, mockSetUploadState);

      expect(global.fetch).toHaveBeenCalledWith(
        signedUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'x-goog-resumable': 'start', 'Content-Type': 'application/octet-stream' },
        })
      );

      expect(global.XMLHttpRequest).toHaveBeenCalled();
      expect(mockXHR.open).toHaveBeenCalledWith('PUT', 'http://signed.url/session');
      expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'application/octet-stream');
      expect(mockXHR.setRequestHeader).toHaveBeenCalledWith('Content-Range', 'bytes 0-9/10');
      expect(mockXHR.send).toHaveBeenCalledWith(inputFile);
    });
  });

  describe('uploadTimeRemainingDisplayText', () => {
    it('returns "Calculating..." when eta is undefined', () => {
      expect(uploadTimeRemainingDisplayText(undefined)).toBe('Calculating...');
    });

    it('returns minutes (rounded to the nearest minute) when ETA is greater than 60 seconds', () => {
      expect(uploadTimeRemainingDisplayText(61)).toBe('1 minute');
      expect(uploadTimeRemainingDisplayText(125)).toBe('2 minutes');
      expect(uploadTimeRemainingDisplayText(160)).toBe('3 minutes');
    });

    it('returns only seconds value when ETA is less than 60 seconds', () => {
      expect(uploadTimeRemainingDisplayText(45)).toBe('45 seconds');
      expect(uploadTimeRemainingDisplayText(1)).toBe('1 second');
    });
  });
});
