import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineOutput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { getOutputFileSize } from 'src/pages/scientificServices/pipelines/utils/file-utils';
import {
  mockPipelineRunResponse,
  mockPipelineWithDetails,
} from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { JobOutputsView } from './JobOutputsView';

jest.mock('src/libs/ajax/teaspoons/Teaspoons');
jest.mock('src/pages/scientificServices/pipelines/utils/file-utils');

describe('JobOutputsView', () => {
  const mockWindowOpen = jest.fn();
  const mockGetPipelineRunOutputSignedUrls = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Teaspoons as jest.Mock).mockReturnValue({
      getPipelineRunOutputSignedUrls: mockGetPipelineRunOutputSignedUrls,
    });
    mockGetPipelineRunOutputSignedUrls.mockResolvedValue({
      outputSignedUrls: {
        imputedMultiSampleVcf: 'gs://bucket/output.vcf',
        imputedMultiSampleVcfIndex: 'gs://bucket/imputedMultiSampleVcfIndex.vcf',
        chunksInfo: 'gs://bucket/chunksInfo.tsv',
      },
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
          imputedMultiSampleVcf: { value: 'gs://bucket/imputedMultiSampleVcf.vcf', metadata: { sizeInBytes: 1048576 } },
          imputedMultiSampleVcfIndex: {
            value: 'gs://bucket/imputedMultiSampleVcfIndex.vcf',
          }, // purposeful lack of metadata to test mixed output structure handling
          chunksInfo: { value: 'gs://bucket/chunksInfo.tsv', metadata: { sizeInBytes: 1048576 } },
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
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf', metadata: { sizeInBytes: 1048576 } },
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
          unknownOutput: { value: 'gs://bucket/unknown.txt', metadata: { sizeInBytes: 1048576 } },
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
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf', metadata: { sizeInBytes: 1048576 } },
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
    });
  });

  it('does not show download button for failed jobs', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('FAILED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('FAILED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf', metadata: { sizeInBytes: 1048576 } },
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
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf', metadata: { sizeInBytes: 1048576 } },
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
    });
  });

  it('opens Download Output modal when download button is clicked', async () => {
    const user = userEvent.setup();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf', metadata: { sizeInBytes: 1048576 } },
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    // Wait for Download button to be visible (this will open the Download Output modal)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
    });

    const openModalButton = screen.getByRole('button', { name: /view details/i });
    await user.click(openModalButton);

    // Wait for the modal to open
    await waitFor(() => {
      expect(screen.getByText('Download Output')).toBeInTheDocument();
    });
  });

  it('shows message when no outputs are available for succeeded job', () => {
    const mockResult = mockPipelineRunResponse('SUCCEEDED');

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    expect(screen.getByText('There was an error.')).toBeInTheDocument();
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
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf', metadata: { sizeInBytes: 1048576 } },
        },
        outputExpirationDate: futureDate,
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.queryByText(/The outputs for this job expired on/)).not.toBeInTheDocument();
    });
  });

  it('displays "Available until" text when outputs have not expired', async () => {
    const futureDate = new Date('2030-01-01').toISOString();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf', metadata: { sizeInBytes: 1048576 } },
        },
        outputExpirationDate: futureDate,
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText(/Available until/)).toBeInTheDocument();
      expect(screen.getByText(/1\/1\/2030/)).toBeInTheDocument();
    });
  });

  it('displays "Expired on" text when outputs have expired', async () => {
    const pastDate = new Date('2020-01-01').toISOString();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf', metadata: { sizeInBytes: 1048576 } },
        },
        outputExpirationDate: pastDate,
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText(/Expired on/)).toBeInTheDocument();
      expect(screen.getByText(/1\/1\/2020/)).toBeInTheDocument();
    });
  });

  it('shows view details button when outputs have not expired', async () => {
    const futureDate = new Date('2030-01-01').toISOString();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf', metadata: { sizeInBytes: 1048576 } },
        },
        outputExpirationDate: futureDate,
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
    });
  });

  it('hides view details button and shows "Not available" when outputs have expired', async () => {
    const pastDate = new Date('2020-01-01').toISOString();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf', metadata: { sizeInBytes: 1048576 } },
        },
        outputExpirationDate: pastDate,
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /view details/i })).not.toBeInTheDocument();
      expect(screen.getByText('Not available')).toBeInTheDocument();
    });
  });

  it('correctly extracts file name from new outputs structure for modal', async () => {
    const user = userEvent.setup();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'gs://bucket/my-output.vcf', metadata: { sizeInBytes: 5242880 } },
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
    });

    const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
    await user.click(viewDetailsButton);

    // modal should open with the correct filename extracted from value field
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveTextContent('gs://bucket/my-output.vcf');
    });
  });

  it('displays file size next to filename when sizeInBytes is available', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf', metadata: { sizeInBytes: 1048576 } }, // 1 MiB
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.queryByText('1.00 MiB', { exact: false })).toBeInTheDocument();
    });
  });

  describe('FILE_ARRAY outputs', () => {
    beforeEach(() => {
      mockGetPipelineRunOutputSignedUrls.mockResolvedValue({
        outputSignedUrls: {
          imputedMultiSampleVcfArray: [
            'gs://bucket/test.chr1.vcf.gz',
            'gs://bucket/test.chr2.vcf.gz',
            'gs://bucket/test.chr3.vcf.gz',
            'gs://bucket/test.chr4.vcf.gz',
            'gs://bucket/test.chr5.vcf.gz',
          ],
        },
      });
    });

    const fileArrayOutputDefinitions: PipelineOutput[] = [
      ...mockOutputDefinitions,
      {
        name: 'imputedMultiSampleVcfArray',
        displayName: 'imputed VCFs',
        type: 'FILE_ARRAY',
        description: 'per-chr VCFs',
      },
    ];

    const buildResultWithFileArray = (files: { value: string; metadata?: { sizeInBytes: number } }[]) => ({
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcfArray: files,
        },
      },
    });

    it('renders a FILE_ARRAY output with a file count and total size', async () => {
      const mockResult = buildResultWithFileArray([
        { value: 'test.chr1.vcf.gz', metadata: { sizeInBytes: 1048576 } },
        { value: 'test.chr2.vcf.gz', metadata: { sizeInBytes: 1048576 } },
      ]);

      render(<JobOutputsView outputDefinitions={fileArrayOutputDefinitions} pipelineRunResult={mockResult} />);

      await waitFor(() => {
        expect(screen.getByText('imputed VCFs')).toBeInTheDocument();
        expect(screen.getByText('file array')).toBeInTheDocument();
        expect(screen.getByText(/2 files/)).toBeInTheDocument();
        expect(screen.getByText(/2\.00 MiB total/)).toBeInTheDocument();
      });
    });

    it('collapses long file lists by default and expands on click', async () => {
      const user = userEvent.setup();
      const files = [1, 2, 3, 4, 5].map((n) => ({ value: `test.chr${n}.vcf.gz`, metadata: { sizeInBytes: 100 } }));
      const mockResult = buildResultWithFileArray(files);

      render(<JobOutputsView outputDefinitions={fileArrayOutputDefinitions} pipelineRunResult={mockResult} />);

      await waitFor(() => {
        expect(screen.getByText('test.chr1.vcf.gz')).toBeInTheDocument();
        expect(screen.queryByText('test.chr5.vcf.gz')).not.toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /show all 5 files/i }));

      await waitFor(() => {
        expect(screen.getByText('test.chr5.vcf.gz')).toBeInTheDocument();
      });
    });

    it('opens the details modal for the file that was clicked', async () => {
      const user = userEvent.setup();
      const mockResult = buildResultWithFileArray([
        { value: 'test.chr1.vcf.gz', metadata: { sizeInBytes: 100 } },
        { value: 'test.chr2.vcf.gz', metadata: { sizeInBytes: 200 } },
      ]);

      render(<JobOutputsView outputDefinitions={fileArrayOutputDefinitions} pipelineRunResult={mockResult} />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /view details/i })).toHaveLength(2);
      });

      const viewDetailsButtons = screen.getAllByRole('button', { name: /view details/i });
      await user.click(viewDetailsButtons[1]);

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toHaveTextContent('test.chr2.vcf.gz');
      });
    });
  });

  it('does not display file size when sizeInBytes is not available', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'gs://bucket/output.vcf' }, // No metadata
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('gs://bucket/output.vcf')).toBeInTheDocument();
      expect(screen.queryByText(/MiB/)).not.toBeInTheDocument();
      expect(screen.queryByText(/KiB/)).not.toBeInTheDocument();
      expect(screen.queryByText(/GiB/)).not.toBeInTheDocument();
    });
  });
});
