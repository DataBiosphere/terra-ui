import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';

import { preparePipelineRun } from './submission-utils';

jest.mock('src/libs/ajax/teaspoons/Teaspoons');

Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(),
  },
});

const mockTeaspoons = {
  preparePipelineRun: jest.fn(),
  startPipelineRun: jest.fn(),
};

describe('submission-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Teaspoons as jest.Mock).mockReturnValue(mockTeaspoons);
    (crypto.randomUUID as jest.Mock).mockReturnValue('test-job-id-123');
  });

  describe('preparePipelineRun', () => {
    const mockFileInputUploadUrls = {
      inputFile1: { signedUrl: 'https://example.com/1' },
      inputFile2: { signedUrl: 'https://example.com/2' },
    };

    beforeEach(() => {
      mockTeaspoons.preparePipelineRun.mockResolvedValue({
        fileInputUploadUrls: mockFileInputUploadUrls,
      });
    });

    it('generates a job ID and calls Teaspoons preparePipelineRun with correct parameters', async () => {
      const useInputs = {
        stringInput: 'testValue',
        fileInput: new File(['super cool test vcf!!!'], 'test.vcf.gz'),
        anotherStringInput: '  thisInputShouldBeTrimmedBeforeSendingToTheBackend  ',
      };

      const result = await preparePipelineRun('array_imputation', 1, useInputs, 'Test description');

      expect(crypto.randomUUID).toHaveBeenCalled();
      expect(mockTeaspoons.preparePipelineRun).toHaveBeenCalledWith(
        'test-job-id-123',
        'array_imputation',
        1,
        {
          stringInput: 'testValue',
          fileInput: 'test.vcf.gz',
          anotherStringInput: 'thisInputShouldBeTrimmedBeforeSendingToTheBackend',
        },
        'Test description'
      );
      expect(result).toEqual({
        jobId: 'test-job-id-123',
        fileInputUploadUrls: mockFileInputUploadUrls,
      });
    });
  });
});
