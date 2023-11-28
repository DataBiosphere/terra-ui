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
        { targetWorkspace: { namespace: 'test-workspaces', name: 'google-workspace' }, jobId: 'workspace-job-1' },
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

      // Should poll again by calling getImportJobStatus again
      await act(async () => {
        jest.advanceTimersByTime(60000);
      });

      expect(getImportJobStatus).toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalled();
    });
    it('notifies error if import failed', async () => {
      // Arrange
      asyncImportJobStore.set([
        { targetWorkspace: { namespace: 'test-workspaces', name: 'google-workspace' }, jobId: 'workspace-job-1' },
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
      expect(notify).toHaveBeenCalledWith('error', 'Error importing data.', {
        notificationMessage: 'There has been an error.',
      });
    });
    it('notifies success when import completes', async () => {
      // Arrange
      asyncImportJobStore.set([
        { targetWorkspace: { namespace: 'test-workspaces', name: 'google-workspace' }, jobId: 'workspace-job-1' },
      ]);

      const getImportJobStatus = jest.fn().mockResolvedValue({ status: 'Done' });
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
      expect(notify).toHaveBeenCalledWith('success', 'Data imported successfully.');
    });
  });

  describe('for Azure workspaces', () => {
    it('polls if import job is still pending', async () => {});
    it('notifies error if import failed', async () => {});
    it('notifies success when import completes', async () => {});
  });
});
