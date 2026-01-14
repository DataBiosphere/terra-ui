import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import Events from 'src/libs/events';
import { getOutputFileSize } from 'src/pages/scientificServices/pipelines/utils/download-utils';
import {
  mockPipelineRunResponse,
  mockPipelineWithDetails,
} from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { DownloadOutputModal } from './DownloadOutputModal';

jest.mock('src/libs/ajax/Metrics');
jest.mock('src/libs/ajax/teaspoons/Teaspoons');
jest.mock('src/pages/scientificServices/pipelines/utils/download-utils');

describe('DownloadOutputModal', () => {
  const mockCaptureEvent = jest.fn();
  const mockWindowOpen = jest.fn();
  const mockGetPipelineRunOutputSignedUrls = jest.fn();
  const mockOnDismiss = jest.fn();
  const mockSetSignedUrls = jest.fn();

  const mockPipelineRunResult = mockPipelineRunResponse('SUCCEEDED');
  const mockOutputDefinition = mockPipelineWithDetails('array_imputation').outputs[0];

  beforeEach(() => {
    jest.clearAllMocks();
    (Metrics as jest.Mock).mockReturnValue({
      captureEvent: mockCaptureEvent,
    });
    (Teaspoons as jest.Mock).mockReturnValue({
      getPipelineRunOutputSignedUrls: mockGetPipelineRunOutputSignedUrls,
    });
    mockGetPipelineRunOutputSignedUrls.mockResolvedValue({
      outputSignedUrls: {
        imputedMultiSampleVcf: 'https://signed-url.com/output.vcf',
      },
    });
    (getOutputFileSize as jest.Mock).mockResolvedValue('10.5 MB');
    window.open = mockWindowOpen;
  });

  it('displays loading state initially', async () => {
    render(
      <DownloadOutputModal
        outputKey='imputedMultiSampleVcf'
        outputDefinition={mockOutputDefinition}
        fileName='output.vcf'
        pipelineRunResult={mockPipelineRunResult}
        onDismiss={mockOnDismiss}
        setSignedUrls={mockSetSignedUrls}
      />
    );

    expect(screen.getByText('Preparing download...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Preparing download...')).not.toBeInTheDocument();
    });
  });

  it('fetches signed URLs when not provided', async () => {
    render(
      <DownloadOutputModal
        outputKey='imputedMultiSampleVcf'
        outputDefinition={mockOutputDefinition}
        fileName='output.vcf'
        pipelineRunResult={mockPipelineRunResult}
        onDismiss={mockOnDismiss}
        setSignedUrls={mockSetSignedUrls}
      />
    );

    await waitFor(() => {
      expect(mockGetPipelineRunOutputSignedUrls).toHaveBeenCalledWith(mockPipelineRunResult.jobReport.id);
    });

    await waitFor(() => {
      expect(mockSetSignedUrls).toHaveBeenCalledWith({
        imputedMultiSampleVcf: 'https://signed-url.com/output.vcf',
      });
    });
  });

  it('uses cached signed URLs when provided', async () => {
    const cachedUrls = {
      imputedMultiSampleVcf: 'https://cached-url.com/output.vcf',
    };

    render(
      <DownloadOutputModal
        outputKey='imputedMultiSampleVcf'
        outputDefinition={mockOutputDefinition}
        fileName='output.vcf'
        pipelineRunResult={mockPipelineRunResult}
        onDismiss={mockOnDismiss}
        signedUrls={cachedUrls}
        setSignedUrls={mockSetSignedUrls}
      />
    );

    await waitFor(() => {
      expect(mockGetPipelineRunOutputSignedUrls).not.toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('10.5 MB')).toBeInTheDocument();
    });

    expect(getOutputFileSize).toHaveBeenCalledWith('https://cached-url.com/output.vcf');
  });

  it('displays file name and size after loading', async () => {
    render(
      <DownloadOutputModal
        outputKey='imputedMultiSampleVcf'
        outputDefinition={mockOutputDefinition}
        fileName='output.vcf'
        pipelineRunResult={mockPipelineRunResult}
        onDismiss={mockOnDismiss}
        setSignedUrls={mockSetSignedUrls}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('File Name')).toBeInTheDocument();
      expect(screen.getByText('output.vcf')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Size')).toBeInTheDocument();
      expect(screen.getByText('10.5 MB')).toBeInTheDocument();
    });
  });

  it('displays output description when available', async () => {
    render(
      <DownloadOutputModal
        outputKey='imputedMultiSampleVcf'
        outputDefinition={mockOutputDefinition}
        fileName='output.vcf'
        pipelineRunResult={mockPipelineRunResult}
        onDismiss={mockOnDismiss}
        setSignedUrls={mockSetSignedUrls}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText(mockOutputDefinition.description!)).toBeInTheDocument();
    });
  });

  it('does not display description when not available', async () => {
    const outputDefWithoutDescription = { ...mockOutputDefinition, description: undefined };

    render(
      <DownloadOutputModal
        outputKey='imputedMultiSampleVcf'
        outputDefinition={outputDefWithoutDescription}
        fileName='output.vcf'
        pipelineRunResult={mockPipelineRunResult}
        onDismiss={mockOnDismiss}
        setSignedUrls={mockSetSignedUrls}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('File Name')).toBeInTheDocument();
    });

    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('displays "Unknown size" when file size fetch fails', async () => {
    (getOutputFileSize as jest.Mock).mockRejectedValue(new Error('Failed to fetch size'));

    render(
      <DownloadOutputModal
        outputKey='imputedMultiSampleVcf'
        outputDefinition={mockOutputDefinition}
        fileName='output.vcf'
        pipelineRunResult={mockPipelineRunResult}
        onDismiss={mockOnDismiss}
        setSignedUrls={mockSetSignedUrls}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Unknown size')).toBeInTheDocument();
    });
  });

  it('displays error message when signed URL fetch fails', async () => {
    mockGetPipelineRunOutputSignedUrls.mockRejectedValue(new Error('Failed to fetch'));

    render(
      <DownloadOutputModal
        outputKey='imputedMultiSampleVcf'
        outputDefinition={mockOutputDefinition}
        fileName='output.vcf'
        pipelineRunResult={mockPipelineRunResult}
        onDismiss={mockOnDismiss}
        setSignedUrls={mockSetSignedUrls}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to retrieve download. Please try again.')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /download/i })).toHaveAttribute('aria-disabled', 'true');
  });

  it('displays error message when output key not found in signed URLs', async () => {
    mockGetPipelineRunOutputSignedUrls.mockResolvedValue({
      outputSignedUrls: {
        differentOutput: 'https://signed-url.com/different.vcf',
      },
    });

    render(
      <DownloadOutputModal
        outputKey='imputedMultiSampleVcf'
        outputDefinition={mockOutputDefinition}
        fileName='output.vcf'
        pipelineRunResult={mockPipelineRunResult}
        onDismiss={mockOnDismiss}
        setSignedUrls={mockSetSignedUrls}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to retrieve download. Please try again.')).toBeInTheDocument();
    });
  });

  it('opens URL in new tab when download button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <DownloadOutputModal
        outputKey='imputedMultiSampleVcf'
        outputDefinition={mockOutputDefinition}
        fileName='output.vcf'
        pipelineRunResult={mockPipelineRunResult}
        onDismiss={mockOnDismiss}
        setSignedUrls={mockSetSignedUrls}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('10.5 MB')).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /download/i });
    await user.click(downloadButton);

    expect(mockWindowOpen).toHaveBeenCalledWith('https://signed-url.com/output.vcf', '_blank');
  });

  it('captures metrics event when download button is clicked', async () => {
    const user = userEvent.setup();
    const pipelineResult = {
      ...mockPipelineRunResult,
      pipelineRunReport: {
        ...mockPipelineRunResult.pipelineRunReport,
        pipelineName: 'test-pipeline',
        pipelineVersion: 2,
      },
    };

    render(
      <DownloadOutputModal
        outputKey='imputedMultiSampleVcf'
        outputDefinition={mockOutputDefinition}
        fileName='output.vcf'
        pipelineRunResult={pipelineResult}
        onDismiss={mockOnDismiss}
        setSignedUrls={mockSetSignedUrls}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('10.5 MB')).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /download/i });
    await user.click(downloadButton);

    expect(mockCaptureEvent).toHaveBeenCalledWith(Events.teaspoons.downloadJobOutputFile, {
      pipelineName: 'test-pipeline',
      pipelineVersion: 2,
      outputName: 'imputedMultiSampleVcf',
      fileSize: '10.5 MB',
    });
  });
});
