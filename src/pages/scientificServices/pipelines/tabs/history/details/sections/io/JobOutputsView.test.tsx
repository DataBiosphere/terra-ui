import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { PipelineOutput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import Events from 'src/libs/events';
import { getOutputFileSize } from 'src/pages/scientificServices/pipelines/utils/download-utils';
import {
  mockPipelineRunResponse,
  mockPipelineWithDetails,
} from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { JobOutputsView } from './JobOutputsView';

jest.mock('src/libs/ajax/Metrics');
jest.mock('src/pages/scientificServices/pipelines/utils/download-utils');

describe('JobOutputsView', () => {
  const mockCaptureEvent = jest.fn();
  const mockWindowOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Metrics as jest.Mock).mockReturnValue({
      captureEvent: mockCaptureEvent,
    });
    (getOutputFileSize as jest.Mock).mockResolvedValue('10.5 MB');
    window.open = mockWindowOpen;
  });

  const mockOutputDefinitions: PipelineOutput[] = mockPipelineWithDetails('array_imputation').outputs;

  it('renders output items when outputs are available', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/imputedMultiSampleVcf.vcf',
          imputedMultiSampleVcfIndex: 'gs://bucket/imputedMultiSampleVcfIndex.vcf',
          chunksInfo: 'gs://bucket/chunksInfo.tsv',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('imputed multi-sample VCF')).toBeInTheDocument();
      expect(screen.getByText('imputed multi-sample VCF index')).toBeInTheDocument();
      expect(screen.getByText('imputation chunks QC tsv')).toBeInTheDocument();
    });
  });

  it('renders output type badges', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('file')).toBeInTheDocument();
    });
  });

  it('falls back to output key when display name is not available', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          unknownOutput: 'gs://bucket/unknown.txt',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('unknownOutput')).toBeInTheDocument();
    });
  });

  it('shows download button for succeeded jobs', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });
  });

  it('does not show download button for failed jobs', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('FAILED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('FAILED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
    });
  });

  it('does not show download button for running jobs', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('RUNNING'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('RUNNING').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
    });
  });

  it('opens URL in new tab when download button is clicked', async () => {
    const user = userEvent.setup();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /download/i });
    await user.click(downloadButton);

    expect(mockWindowOpen).toHaveBeenCalledWith('gs://bucket/output.vcf', '_blank');
  });

  it('captures mixpanel event when download button is clicked', async () => {
    const user = userEvent.setup();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        pipelineName: 'test-pipeline',
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /download/i });
    await user.click(downloadButton);

    await waitFor(() => {
      expect(mockCaptureEvent).toHaveBeenCalledWith(Events.teaspoons.downloadJobOutputFile, {
        pipelineName: 'test-pipeline',
        pipelineVersion: 1,
        outputName: 'imputed multi-sample VCF',
        fileSize: '10.5 MB',
      });
    });
  });

  it('displays file size when loaded', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('10.5 MB')).toBeInTheDocument();
    });
  });

  it('displays "Loading file size..." initially', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    expect(screen.getByText('Loading file size...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Loading file size...')).not.toBeInTheDocument();
    });
  });

  it('displays "Unknown size" when file size fetch fails', async () => {
    (getOutputFileSize as jest.Mock).mockRejectedValue(new Error('Failed to fetch size'));

    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('Unknown size')).toBeInTheDocument();
    });
  });

  it('displays "Not available" for file size when job is not succeeded', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('FAILED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('FAILED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('Not available')).toBeInTheDocument();
    });
  });

  it('shows message when no outputs are available for succeeded job', () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    expect(screen.getByText('This job succeeded, but did not produce any outputs.')).toBeInTheDocument();
  });

  it('shows message when job is still running', () => {
    const mockResult = mockPipelineRunResponse('RUNNING');

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    expect(
      screen.getByText('The job is still in progress. Outputs will be available after the job completes.')
    ).toBeInTheDocument();
  });

  it('shows expired message when outputs have expired', () => {
    // Set expiration date to a past date
    const pastDate = new Date('2020-01-01').toISOString();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputExpirationDate: pastDate,
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    expect(screen.getByText(/The outputs for this job expired on/)).toBeInTheDocument();
    expect(screen.getByText(/and are no longer available/)).toBeInTheDocument();
  });

  it('does not show expired message when outputs have not expired', async () => {
    // Set expiration date to a future date
    const futureDate = new Date('2030-01-01').toISOString();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        },
        outputExpirationDate: futureDate,
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.queryByText(/The outputs for this job expired on/)).not.toBeInTheDocument();
    });
  });
});
