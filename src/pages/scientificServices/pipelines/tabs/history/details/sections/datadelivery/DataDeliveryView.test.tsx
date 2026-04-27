import { formatDate } from '@terra-ui-packages/core-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import { DataDeliveryReport, PipelineOutputValue, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { asMockedFn, partial, renderWithAppContexts as render } from 'src/testing/test-utils';

import { DataDeliveryView } from './DataDeliveryView';
import { useDeliveryPolling } from './useDeliveryPolling';

jest.mock('src/libs/ajax/teaspoons/Teaspoons');
jest.mock('./useDeliveryPolling');

const mockJobId = 'test-job-id';
const validGcsPath = 'gs://my-bucket/output/path';
const pastExpirationDate = '2026-03-01T12:00:00.000Z';
const futureExpirationDate = '2026-12-01T12:00:00.000Z';

const makePipelineRunResponse = (
  outputs: Record<string, PipelineOutputValue> = {},
  dataDeliveryReport?: DataDeliveryReport,
  outputExpirationDate?: string
): PipelineRunResponse => ({
  jobReport: {
    id: mockJobId,
    status: 'SUCCEEDED',
    submitted: '2025-01-01T00:00:00Z',
  },
  pipelineRunReport: {
    pipelineName: 'test-pipeline',
    pipelineVersion: 1,
    toolVersion: '1.0',
    outputs,
    ...(dataDeliveryReport ? { dataDeliveryReport } : {}),
    ...(outputExpirationDate ? { outputExpirationDate } : {}),
  },
});

describe('DataDeliveryView', () => {
  let mockTeaspoonsContract: Partial<TeaspoonsContract>;

  beforeEach(() => {
    jest.clearAllMocks();
    asMockedFn(useDeliveryPolling).mockImplementation(() => {});
    mockTeaspoonsContract = partial<TeaspoonsContract>({
      deliverData: jest.fn().mockResolvedValue(undefined),
      getPipelineRunResult: jest.fn().mockResolvedValue(makePipelineRunResponse()),
    });
    asMockedFn(Teaspoons).mockReturnValue(mockTeaspoonsContract as TeaspoonsContract);
  });

  describe('NOT_STARTED status', () => {
    it('renders the "Not Started" status badge', () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.getByText('Not Started')).toBeInTheDocument();
    });

    it('renders the instructions', () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      expect(
        screen.getByText(/Enter a destination path in Google Cloud Storage to deliver the outputs of this job/)
      ).toBeInTheDocument();
    });

    it('renders an enabled destination path input', () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const input = screen.getByLabelText('GCS destination path');
      expect(input).toBeInTheDocument();
      expect(input).not.toBeDisabled();
    });

    it('renders the "Deliver" button', () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.getByRole('button', { name: 'Deliver' })).toBeInTheDocument();
    });

    it('shows file count when outputs are present', () => {
      const outputs = {
        file1: { value: 'gs://bucket/file1.txt', metadata: { sizeInBytes: 1048576 } },
        file2: { value: 'gs://bucket/file2.txt' },
      };
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse(outputs)} />);
      expect(screen.getByText('2 files will be moved to the destination.')).toBeInTheDocument();
    });

    it('shows singular "file" label when there is exactly 1 output', () => {
      const outputs = {
        file1: { value: 'gs://bucket/file1.txt', metadata: { sizeInBytes: 1048576 } },
      };
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse(outputs)} />);
      expect(screen.getByText('1 file will be moved to the destination.')).toBeInTheDocument();
    });

    it('does not show file count when there are no outputs', () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse({})} />);
      expect(screen.queryByText(/will be moved to the destination/)).not.toBeInTheDocument();
    });

    it('pre-fills the path input when a destination is already set', () => {
      const report: Partial<DataDeliveryReport> = { destination: validGcsPath, status: 'NOT_STARTED' as any };
      render(<DataDeliveryView dataDeliveryReport={report} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.getByLabelText('GCS destination path')).toHaveValue(validGcsPath);
    });
  });

  describe('RUNNING status', () => {
    const runningReport: DataDeliveryReport = { status: 'RUNNING', destination: validGcsPath };

    it('renders the "In Progress" status badge', () => {
      render(<DataDeliveryView dataDeliveryReport={runningReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('renders the in-progress message', () => {
      render(<DataDeliveryView dataDeliveryReport={runningReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(
        screen.getByText(/Data delivery is currently in progress. Please check back shortly./)
      ).toBeInTheDocument();
    });

    it('disables the destination path input', () => {
      render(<DataDeliveryView dataDeliveryReport={runningReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.getByLabelText('GCS destination path')).toBeDisabled();
    });

    it('does not render a Deliver or Retry button', () => {
      render(<DataDeliveryView dataDeliveryReport={runningReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.queryByRole('button', { name: /Deliver|Retry/ })).not.toBeInTheDocument();
    });
  });

  describe('SUCCEEDED status', () => {
    const succeededReport: DataDeliveryReport = { status: 'SUCCEEDED', destination: validGcsPath };

    it('renders the "Delivered" status badge', () => {
      render(<DataDeliveryView dataDeliveryReport={succeededReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.getByText('Delivered')).toBeInTheDocument();
    });

    it('renders the success message', () => {
      render(<DataDeliveryView dataDeliveryReport={succeededReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(
        screen.getByText(/The outputs for this job were successfully delivered to the destination/)
      ).toBeInTheDocument();
    });

    it('renders a link to view outputs in the Google Cloud Console', () => {
      render(<DataDeliveryView dataDeliveryReport={succeededReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.getByText(/View your outputs in the Google Cloud Console/)).toBeInTheDocument();
    });

    it('disables the destination path input', () => {
      render(<DataDeliveryView dataDeliveryReport={succeededReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.getByLabelText('GCS destination path')).toBeDisabled();
    });

    it('does not render a Deliver or Retry button', () => {
      render(<DataDeliveryView dataDeliveryReport={succeededReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.queryByRole('button', { name: /Deliver|Retry/ })).not.toBeInTheDocument();
    });
  });

  describe('FAILED status', () => {
    const failedReport: DataDeliveryReport = { status: 'FAILED', destination: validGcsPath };

    it('renders the "Failed" status badge', () => {
      render(<DataDeliveryView dataDeliveryReport={failedReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('renders an error message', () => {
      render(<DataDeliveryView dataDeliveryReport={failedReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(
        screen.getByText(/There was an error moving the outputs to the destination. Please retry the delivery./)
      ).toBeInTheDocument();
    });

    it('renders the "Retry" button', () => {
      render(<DataDeliveryView dataDeliveryReport={failedReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('keeps the destination path input enabled', () => {
      render(<DataDeliveryView dataDeliveryReport={failedReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(screen.getByLabelText('GCS destination path')).not.toBeDisabled();
    });
  });

  describe('GCS path validation', () => {
    it('disables the Deliver button when the path is empty', () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const deliverButton = screen.getByRole('button', { name: 'Deliver' });
      expect(deliverButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('shows a validation error for an invalid path', async () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const input = screen.getByLabelText('GCS destination path');
      await userEvent.type(input, 'not-a-valid-path');
      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Invalid Google Cloud Storage path/)).toBeInTheDocument();
    });

    it('clears the validation error when a valid path is entered', async () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const input = screen.getByLabelText('GCS destination path');
      await userEvent.type(input, 'not-valid');
      expect(await screen.findByText(/Invalid Google Cloud Storage path/)).toBeInTheDocument();
      await userEvent.clear(input);
      await userEvent.type(input, validGcsPath);
      expect(screen.queryByText(/Invalid Google Cloud Storage path/)).not.toBeInTheDocument();
    });

    it('enables the Deliver button when a valid path is entered', async () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const input = screen.getByLabelText('GCS destination path');
      await userEvent.type(input, validGcsPath);
      expect(screen.getByRole('button', { name: 'Deliver' })).not.toBeDisabled();
    });
  });

  describe('deliver button', () => {
    it('calls deliverData with the correct job ID and path on click', async () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const input = screen.getByLabelText('GCS destination path');
      await userEvent.type(input, validGcsPath);
      await userEvent.click(screen.getByRole('button', { name: 'Deliver' }));
      await waitFor(() => expect(mockTeaspoonsContract.deliverData).toHaveBeenCalledWith(mockJobId, validGcsPath));
    });

    it('fetches the updated run result after delivery', async () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const input = screen.getByLabelText('GCS destination path');
      await userEvent.type(input, validGcsPath);
      await userEvent.click(screen.getByRole('button', { name: 'Deliver' }));
      await waitFor(() => expect(mockTeaspoonsContract.getPipelineRunResult).toHaveBeenCalledWith(mockJobId));
    });

    it('transitions to RUNNING status when delivery starts successfully', async () => {
      const updatedResponse = makePipelineRunResponse({}, { status: 'RUNNING', destination: validGcsPath });
      asMockedFn(mockTeaspoonsContract.getPipelineRunResult!).mockResolvedValue(updatedResponse);

      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const input = screen.getByLabelText('GCS destination path');
      await userEvent.type(input, validGcsPath);
      await userEvent.click(screen.getByRole('button', { name: 'Deliver' }));
      await waitFor(() => expect(screen.getByText('In Progress')).toBeInTheDocument());
    });

    it('transitions to SUCCEEDED status when delivery completes', async () => {
      const updatedResponse = makePipelineRunResponse({}, { status: 'SUCCEEDED', destination: validGcsPath });
      asMockedFn(mockTeaspoonsContract.getPipelineRunResult!).mockResolvedValue(updatedResponse);

      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const input = screen.getByLabelText('GCS destination path');
      await userEvent.type(input, validGcsPath);
      await userEvent.click(screen.getByRole('button', { name: 'Deliver' }));
      await waitFor(() => expect(screen.getByText('Delivered')).toBeInTheDocument());
    });

    it('shows a friendly error message when the service lacks permissions', async () => {
      asMockedFn(mockTeaspoonsContract.deliverData!).mockRejectedValue(
        new Error('service does not have necessary permissions to write')
      );

      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const input = screen.getByLabelText('GCS destination path');
      await userEvent.type(input, validGcsPath);
      await userEvent.click(screen.getByRole('button', { name: 'Deliver' }));
      await waitFor(() =>
        expect(
          screen.getByText(/Broad Scientific Services does not have permission to write to the destination bucket/)
        ).toBeInTheDocument()
      );
    });

    it('shows a friendly error message when the user lacks permissions', async () => {
      asMockedFn(mockTeaspoonsContract.deliverData!).mockRejectedValue(
        new Error('user does not have necessary permissions to write')
      );

      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const input = screen.getByLabelText('GCS destination path');
      await userEvent.type(input, validGcsPath);
      await userEvent.click(screen.getByRole('button', { name: 'Deliver' }));
      await waitFor(() =>
        expect(screen.getByText(/You do not have permission to write to the destination bucket/)).toBeInTheDocument()
      );
    });

    it('shows a generic error message for unexpected errors', async () => {
      asMockedFn(mockTeaspoonsContract.deliverData!).mockRejectedValue(new Error('some unexpected error'));

      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      const input = screen.getByLabelText('GCS destination path');
      await userEvent.type(input, validGcsPath);
      await userEvent.click(screen.getByRole('button', { name: 'Deliver' }));
      await waitFor(() =>
        expect(
          screen.getByText('some unexpected error. Please review the sharing instructions and try again.')
        ).toBeInTheDocument()
      );
    });
  });

  describe('retry button', () => {
    const failedReport: DataDeliveryReport = { status: 'FAILED', destination: validGcsPath };

    it('calls deliverData again when Retry is clicked', async () => {
      render(<DataDeliveryView dataDeliveryReport={failedReport} pipelineRunResult={makePipelineRunResponse()} />);
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
      await waitFor(() => expect(mockTeaspoonsContract.deliverData).toHaveBeenCalledWith(mockJobId, validGcsPath));
    });

    it('transitions to SUCCEEDED status after a successful retry', async () => {
      const updatedResponse = makePipelineRunResponse({}, { status: 'SUCCEEDED', destination: validGcsPath });
      asMockedFn(mockTeaspoonsContract.getPipelineRunResult!).mockResolvedValue(updatedResponse);

      render(<DataDeliveryView dataDeliveryReport={failedReport} pipelineRunResult={makePipelineRunResponse()} />);
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
      await waitFor(() => expect(screen.getByText('Delivered')).toBeInTheDocument());
    });
  });

  describe('EXPIRED status', () => {
    it('renders the "Expired" status badge when outputExpirationDate is in the past', () => {
      render(
        <DataDeliveryView
          dataDeliveryReport={null}
          pipelineRunResult={makePipelineRunResponse({}, undefined, pastExpirationDate)}
        />
      );
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });

    it('renders the expiration message with the formatted date', () => {
      render(
        <DataDeliveryView
          dataDeliveryReport={null}
          pipelineRunResult={makePipelineRunResponse({}, undefined, pastExpirationDate)}
        />
      );
      expect(
        screen.getByText(
          `The outputs for this job expired on ${formatDate(pastExpirationDate)} and can no longer be delivered.`
        )
      ).toBeInTheDocument();
    });

    it('hides the destination path input', () => {
      render(
        <DataDeliveryView
          dataDeliveryReport={null}
          pipelineRunResult={makePipelineRunResponse({}, undefined, pastExpirationDate)}
        />
      );
      expect(screen.queryByLabelText('GCS destination path')).not.toBeInTheDocument();
    });

    it('does not render a Deliver or Retry button', () => {
      render(
        <DataDeliveryView
          dataDeliveryReport={null}
          pipelineRunResult={makePipelineRunResponse({}, undefined, pastExpirationDate)}
        />
      );
      expect(screen.queryByRole('button', { name: /Deliver|Retry/ })).not.toBeInTheDocument();
    });

    it('shows EXPIRED instead of FAILED when a previous delivery attempt failed and outputs have since expired', () => {
      const failedReport: DataDeliveryReport = { status: 'FAILED', destination: validGcsPath };
      render(
        <DataDeliveryView
          dataDeliveryReport={failedReport}
          pipelineRunResult={makePipelineRunResponse({}, failedReport, pastExpirationDate)}
        />
      );
      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.queryByText('Failed')).not.toBeInTheDocument();
    });

    it('does not show EXPIRED when outputExpirationDate is in the future', () => {
      render(
        <DataDeliveryView
          dataDeliveryReport={null}
          pipelineRunResult={makePipelineRunResponse({}, undefined, futureExpirationDate)}
        />
      );
      expect(screen.getByText('Not Started')).toBeInTheDocument();
      expect(screen.queryByText('Expired')).not.toBeInTheDocument();
    });
  });

  describe('expiration after delivery', () => {
    it('shows SUCCEEDED when delivery completed but outputExpirationDate has since passed', () => {
      const succeededReport: DataDeliveryReport = { status: 'SUCCEEDED', destination: validGcsPath };
      render(
        <DataDeliveryView
          dataDeliveryReport={succeededReport}
          pipelineRunResult={makePipelineRunResponse({}, succeededReport, pastExpirationDate)}
        />
      );
      expect(screen.getByText('Delivered')).toBeInTheDocument();
      expect(screen.queryByText('Expired')).not.toBeInTheDocument();
    });
  });

  describe('delivery polling', () => {
    it('calls useDeliveryPolling with the correct jobId and status', () => {
      render(<DataDeliveryView dataDeliveryReport={null} pipelineRunResult={makePipelineRunResponse()} />);
      expect(useDeliveryPolling).toHaveBeenCalledWith(
        expect.objectContaining({ jobId: mockJobId, status: 'NOT_STARTED' })
      );
    });

    it('passes RUNNING status to useDeliveryPolling when delivery is in progress', () => {
      const runningReport: DataDeliveryReport = { status: 'RUNNING', destination: validGcsPath };
      render(<DataDeliveryView dataDeliveryReport={runningReport} pipelineRunResult={makePipelineRunResponse()} />);
      expect(useDeliveryPolling).toHaveBeenCalledWith(expect.objectContaining({ status: 'RUNNING' }));
    });

    it('updates the UI when the polling onUpdate callback fires', async () => {
      let capturedOnUpdate: ((report: DataDeliveryReport) => void) | undefined;
      asMockedFn(useDeliveryPolling).mockImplementation(({ onUpdate }) => {
        capturedOnUpdate = onUpdate;
      });

      const runningReport: DataDeliveryReport = { status: 'RUNNING', destination: validGcsPath };
      render(<DataDeliveryView dataDeliveryReport={runningReport} pipelineRunResult={makePipelineRunResponse()} />);

      expect(screen.getByText('In Progress')).toBeInTheDocument();

      // Simulate polling returning a SUCCEEDED update
      const succeededUpdate: DataDeliveryReport = { status: 'SUCCEEDED', destination: validGcsPath };
      await waitFor(() => capturedOnUpdate!(succeededUpdate));

      expect(await screen.findByText('Delivered')).toBeInTheDocument();
    });
  });
});
