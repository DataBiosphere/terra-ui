import { DeepPartial } from '@terra-ui-packages/core-utils';
import { asMockedFn } from '@terra-ui-packages/test-utils';
import { act, render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { Ajax } from 'src/libs/ajax';
import { notify } from 'src/libs/notifications';
import { asyncImportJobStore } from 'src/libs/state';

import ImportStatus from './ImportStatus';

jest.mock('src/libs/ajax');
type AjaxExports = typeof import('src/libs/ajax');
type AjaxContract = ReturnType<AjaxExports['Ajax']>;

jest.mock('src/libs/notifications');
/*
Shape of getImportJobStatus result"
filetype: "pfb"
jobId: "21c589b4-216e-47e7-aa6e-dd3f67076461"
message: "Error translating file (eid: 17d82709-15ee-4aa1-b58b-6c2808984567). This file could be too large or contains illegal syntax. Please check your file for validity before trying again. Underlying error message: File too large to download or did not report its size for file https://s3.amazonaws.com/edu-ucsc-gi-platform-anvil-dev-storage-anvildev.us-east-1/manifests/a00082db-fc36-51ab-8e17-4739cf3414ab.ad14b32b-dea0-555e-b745-8ebe5bb0958d.avro?response-content-disposition=attachment%3Bfilename%3D%22hca-manifest-a00082db-fc36-51ab-8e17-4739cf3414ab.ad14b32b-dea0-555e-b745-8ebe5bb0958d.avro%22&AWSAccessKeyId=ASIAUHATKQ7O57GILV65&Signature=BjkLf2JZzSa23zWMDhzxvHrXy%2Bk%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEFQaCXVzLWVhc3QtMSJHMEUCIQDmo7KuvAjfadsm6WOhLPt3RJhMa8A43oQ5hNwzpjXGcQIgd5en%2BCLk9GE67ipIiG2GSUJZ7OP5LWHHdyB5u9DWS28qhwMIrf%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgwyODk5NTA4Mjg1MDkiDFqbgwZEPGaG39pQSCrbAuQENBcTgFsV2M0Rg7t619W5w3N7QFN7PJ%2Bl%2FHkp%2Bf1lE987HppR%2F5eBUnzDuHT2A2CL9q%2BU9HVOzC6VakEls93Xk7mJDHd4QAPdphbJtkudsl1nTxaNmfrsh7Sz0GtIr7fN3EC%2B1cAg2w5dcFO%2B60UDCAT82S4pY63ulbW3sWoJ4W9jMBW9GSALWf%2FYwte%2B5fTXGpHziDvVgBOt3V1%2FTxTN92unHOORhUuz8ogVq7rmuaM3OkR711RoO49JTz76oAgP%2Br1SKmwTupcY5N%2F624TRT8%2BHXp6ODzEn9EKb8kOqj9L0TFqtq4gfa3bWgzNuNb8dtRSSeS2aoTP2Z6DSZV6MK1L1MCXKwC6HdOrN7SwwrQRYLRpTxspf%2BsRdJRTMHZk0X%2BDtCSDh3XBnG53C7Eq2zG1UBdjosYUAk0dJYoZLmc%2FPDSAtCdFFxWpI6Lpm1Q5dpIDDr%2FUHLh3pMLTkk6sGOp4BcNV%2FMp%2F%2B500nRrmWYRvI7hsPtQHx8RxqLORHPc7%2FBviY9uKD%2BWUUmKFCmk6dwQQ7B0S1DwHe2kumnYoBMFDUs9RJXr5vhBbbtdLFI2R0NwebOy%2FxesplnQHTSCEPTfhtGE2MvhnLTqTnjP0yU1Zp%2BthdXM6z5sYTib0dFv1sa6LV5lGfsyGw88vdqWgWM5tqMoOiUB6kfFGEq%2Fd%2FxbA%3D&Expires=1701118029"
status: "Error"
*/

// const mockAjax: DeepPartial<AjaxContract> = {
//   Workspaces: {
//     workspace: (_namespace, _name) => ({
//       getImportJobStatus: jest.fn(),
//     }),
//   },
//   WorkspaceData: {
//     getJobStatus: jest.fn().mockResolvedValue('TODO'),
//   },
// };

describe('ImportStatus', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });
  describe('for Google workspaces', () => {
    it('polls if import job is still pending', async () => {
      // Arrange
      asyncImportJobStore.set([
        { targetWorkspace: { namespace: 'test-workspaces', name: 'other-workspace' }, jobId: 'other-workspace-job' },
        { targetWorkspace: { namespace: 'test-workspaces', name: 'google-workspace' }, jobId: 'workspace-job-1' },
        { targetWorkspace: { namespace: 'test-workspaces', name: 'google-workspace' }, jobId: 'workspace-job-2' },
      ]);

      const getImportJobStatus = jest.fn().mockResolvedValue({ status: 'Pending' });
      const mockAjax: DeepPartial<AjaxContract> = {
        Workspaces: {
          workspace: (_namespace, _name) => ({
            getImportJobStatus,
          }),
        },
      };
      asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

      // Act
      render(h(ImportStatus, {}));
      await act(async () => {
        jest.advanceTimersByTime(60000);
      });

      expect(notify).not.toHaveBeenCalled();
    });
    it('notifies error if import failed', async () => {
      // Arrange
      asyncImportJobStore.set([
        { targetWorkspace: { namespace: 'test-workspaces', name: 'other-workspace' }, jobId: 'other-workspace-job' },
        { targetWorkspace: { namespace: 'test-workspaces', name: 'google-workspace' }, jobId: 'workspace-job-1' },
        { targetWorkspace: { namespace: 'test-workspaces', name: 'google-workspace' }, jobId: 'workspace-job-2' },
      ]);

      const getImportJobStatus = jest.fn().mockResolvedValue({ status: 'Error', message: 'There has been an error.' });
      const mockAjax: DeepPartial<AjaxContract> = {
        Workspaces: {
          workspace: (_namespace, _name) => ({
            getImportJobStatus,
          }),
        },
      };
      asMockedFn(Ajax).mockImplementation(() => mockAjax as AjaxContract);

      // Act
      render(h(ImportStatus, {}));
      await act(async () => {
        jest.advanceTimersByTime(60000);
      });

      // Assert
      expect(notify).toHaveBeenCalledWith();
    });
    it('notifies success when import completes', async () => {});
  });

  describe('for Azure workspaces', () => {
    it('polls if import job is still pending', async () => {});
    it('notifies error if import failed', async () => {});
    it('notifies success when import completes', async () => {});
  });
});
