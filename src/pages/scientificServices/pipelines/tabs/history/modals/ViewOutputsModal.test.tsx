import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons, TeaspoonsContract } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { asMockedFn, partial, renderWithAppContexts } from 'src/testing/test-utils';

import { ViewOutputsModal } from './ViewOutputsModal';

jest.mock('src/libs/ajax/teaspoons/Teaspoons');

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getPath: jest.fn(() => '/test/'),
  getLink: jest.fn(() => '/'),
}));

describe('ViewOutputsModal', () => {
  const jobId = 'test-job-id';
  const onDismissMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      headers: {
        get: jest.fn().mockReturnValue('1234'),
      },
    } as any);
  });

  it('displays loading state initially', () => {
    // Mock Teaspoons to return a promise that never resolves to keep the loading state
    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getPipelineRunResult: jest.fn().mockReturnValue(new Promise(() => {})),
      })
    );

    renderWithAppContexts(<ViewOutputsModal jobId={jobId} onDismiss={onDismissMock} />);

    expect(screen.getByText('Loading outputs...')).toBeInTheDocument();
    expect(screen.getByText(`Pipeline Outputs - ${jobId}`)).toBeInTheDocument();
  });

  it('fetches and displays pipeline outputs', async () => {
    const mockOutputs = {
      output1: { value: 'https://example.com/output1.vcf', metadata: { sizeInBytes: 1048576 } },
      output2: { value: 'https://example.com/output2.vcf', metadata: { sizeInBytes: 5242880 } },
      output3: { value: 'https://example.com/output3.bam' },
    };

    const mockPipelineRunResponse: Partial<PipelineRunResponse> = {
      pipelineRunReport: {
        pipelineName: 'test-pipeline',
        pipelineVersion: 1,
        toolVersion: '1.0.0',
        outputExpirationDate: '2025-07-09T00:00:00Z',
        outputs: mockOutputs,
      },
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getPipelineRunResult: jest.fn().mockResolvedValue(mockPipelineRunResponse),
      })
    );

    renderWithAppContexts(<ViewOutputsModal jobId={jobId} onDismiss={onDismissMock} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading outputs...')).not.toBeInTheDocument();
    });

    // Verify outputs are displayed
    expect(screen.getByText('output1')).toBeInTheDocument();
    expect(screen.getByText('output2')).toBeInTheDocument();

    // Verify download buttons are present
    const downloadButtons = screen.getAllByText('Download');
    expect(downloadButtons).toHaveLength(2);

    // Verify expiration notice is displayed
    expect(screen.getByText(/All output files for this job will be automatically deleted on/)).toBeInTheDocument();
    expect(screen.getByText('Jul 9, 2025')).toBeInTheDocument();
  });

  it('displays a message when no outputs are available', async () => {
    const mockPipelineRunResponse: Partial<PipelineRunResponse> = {
      pipelineRunReport: {
        pipelineName: 'test-pipeline',
        pipelineVersion: 1,
        toolVersion: '1.0.0',
        outputExpirationDate: '2025-07-09T00:00:00Z',
        outputs: {},
      },
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getPipelineRunResult: jest.fn().mockResolvedValue(mockPipelineRunResponse),
      })
    );

    renderWithAppContexts(<ViewOutputsModal jobId={jobId} onDismiss={onDismissMock} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading outputs...')).not.toBeInTheDocument();
    });

    // Verify "no outputs" message is displayed
    expect(screen.queryByText('No output information found for this job.', { exact: false })).toBeInTheDocument();
  });

  it('calls onDismiss when Close button is clicked', async () => {
    const mockPipelineRunResponse: Partial<PipelineRunResponse> = {
      pipelineRunReport: {
        pipelineName: 'test-pipeline',
        pipelineVersion: 1,
        toolVersion: '1.0.0',
        outputExpirationDate: '2025-07-09T00:00:00Z',
        outputs: {},
      },
    };

    asMockedFn(Teaspoons).mockReturnValue(
      partial<TeaspoonsContract>({
        getPipelineRunResult: jest.fn().mockResolvedValue(mockPipelineRunResponse),
      })
    );

    renderWithAppContexts(<ViewOutputsModal jobId={jobId} onDismiss={onDismissMock} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading outputs...')).not.toBeInTheDocument();
    });

    // Click the Close button
    const user = userEvent.setup();
    await user.click(screen.getByText('Close'));

    // Verify onDismiss was called
    expect(onDismissMock).toHaveBeenCalledTimes(1);
  });

  describe('data delivery', () => {
    const mockOutputs = {
      output1: { value: 'gs://bucket/output1.vcf', metadata: { sizeInBytes: 1048576 } },
      output2: { value: 'gs://bucket/output2.bam', metadata: { sizeInBytes: 1048576 } },
    };

    const makeDeliveredResponse = (destination = 'gs://my-bucket/delivered-outputs'): Partial<PipelineRunResponse> => ({
      jobReport: {
        id: jobId,
        status: 'SUCCEEDED',
        submitted: '2025-01-01T00:00:00Z',
        completed: '2025-03-15T00:00:00Z',
      },
      pipelineRunReport: {
        pipelineName: 'test-pipeline',
        pipelineVersion: 1,
        toolVersion: '1.0.0',
        outputExpirationDate: '2025-07-09T00:00:00Z',
        outputs: mockOutputs,
        dataDeliveryReport: { status: 'SUCCEEDED', destination },
      },
    });

    it('shows the delivery success banner with completion date and GCS console link', async () => {
      asMockedFn(Teaspoons).mockReturnValue(
        partial<TeaspoonsContract>({
          getPipelineRunResult: jest.fn().mockResolvedValue(makeDeliveredResponse()),
        })
      );

      renderWithAppContexts(<ViewOutputsModal jobId={jobId} onDismiss={onDismissMock} />);

      await waitFor(() => expect(screen.queryByText('Loading outputs...')).not.toBeInTheDocument());

      expect(screen.getByText(/Your outputs were successfully delivered/)).toBeInTheDocument();
      expect(screen.getByText('Mar 15, 2025')).toBeInTheDocument();
      expect(screen.getByText(/View your outputs in the Google Cloud Console/)).toBeInTheDocument();
    });

    it('disables download buttons and hides the expiration warning when delivery has succeeded', async () => {
      asMockedFn(Teaspoons).mockReturnValue(
        partial<TeaspoonsContract>({
          getPipelineRunResult: jest.fn().mockResolvedValue(makeDeliveredResponse()),
        })
      );

      renderWithAppContexts(<ViewOutputsModal jobId={jobId} onDismiss={onDismissMock} />);

      await waitFor(() => expect(screen.queryByText('Loading outputs...')).not.toBeInTheDocument());

      screen
        .getAllByRole('button', { name: /download/i })
        .forEach((btn) => expect(btn).toHaveAttribute('aria-disabled', 'true'));
      expect(
        screen.queryByText(/All output files for this job will be automatically deleted on/)
      ).not.toBeInTheDocument();
    });

    it('shows a "deliver to cloud destination" link in the expiration warning before delivery', async () => {
      const mockResponse: Partial<PipelineRunResponse> = {
        pipelineRunReport: {
          pipelineName: 'test-pipeline',
          pipelineVersion: 1,
          toolVersion: '1.0.0',
          outputExpirationDate: '2025-07-09T00:00:00Z',
          outputs: mockOutputs,
        },
      };

      asMockedFn(Teaspoons).mockReturnValue(
        partial<TeaspoonsContract>({
          getPipelineRunResult: jest.fn().mockResolvedValue(mockResponse),
        })
      );

      renderWithAppContexts(<ViewOutputsModal jobId={jobId} onDismiss={onDismissMock} />);

      await waitFor(() => expect(screen.queryByText('Loading outputs...')).not.toBeInTheDocument());

      expect(screen.getByText('deliver them to a cloud destination')).toBeInTheDocument();
    });
  });
});
