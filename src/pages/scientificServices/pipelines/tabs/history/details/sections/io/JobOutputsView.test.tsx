import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineOutput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { notify } from 'src/libs/notifications';
import { downloadSignedUrl } from 'src/pages/scientificServices/pipelines/utils/file-utils';
import {
  mockPipelineRunResponse,
  mockPipelineWithDetails,
} from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { JobOutputsView } from './JobOutputsView';

jest.mock('src/libs/ajax/teaspoons/Teaspoons');
jest.mock('src/libs/notifications');
jest.mock('src/pages/scientificServices/pipelines/utils/file-utils');

describe('JobOutputsView', () => {
  const mockGetPipelineRunOutputSignedUrls = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Teaspoons as jest.Mock).mockReturnValue({
      getPipelineRunOutputSignedUrls: mockGetPipelineRunOutputSignedUrls,
    });
    mockGetPipelineRunOutputSignedUrls.mockResolvedValue({
      outputSignedUrls: {
        imputedMultiSampleVcf: 'https://signed/output.vcf',
        imputedMultiSampleVcfIndex: 'https://signed/imputedMultiSampleVcfIndex.vcf',
        chunksInfo: 'https://signed/chunksInfo.tsv',
      },
    });
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
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
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

  it('fetches a signed url and starts the download when the download button is clicked', async () => {
    const user = userEvent.setup();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'output.vcf', metadata: { sizeInBytes: 1048576 } },
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await user.click(await screen.findByRole('button', { name: /download/i }));

    await waitFor(() => {
      expect(mockGetPipelineRunOutputSignedUrls).toHaveBeenCalledWith(mockResult.jobReport.id);
      expect(downloadSignedUrl).toHaveBeenCalledWith('https://signed/output.vcf', 'output.vcf');
    });
  });

  it('reuses cached signed urls for subsequent downloads instead of refetching', async () => {
    const user = userEvent.setup();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'output.vcf', metadata: { sizeInBytes: 1048576 } },
          chunksInfo: { value: 'chunksInfo.tsv', metadata: { sizeInBytes: 2048 } },
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    const downloadButtons = await screen.findAllByRole('button', { name: /download/i });
    await user.click(downloadButtons[0]);
    await waitFor(() => expect(downloadSignedUrl).toHaveBeenCalledTimes(1));

    await user.click(downloadButtons[1]);
    await waitFor(() => expect(downloadSignedUrl).toHaveBeenCalledTimes(2));

    expect(mockGetPipelineRunOutputSignedUrls).toHaveBeenCalledTimes(1);
    expect(downloadSignedUrl).toHaveBeenLastCalledWith('https://signed/chunksInfo.tsv', 'chunksInfo.tsv');
  });

  it('notifies and does not download when the signed url fetch fails', async () => {
    const user = userEvent.setup();
    mockGetPipelineRunOutputSignedUrls.mockRejectedValue(new Error('boom'));
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'output.vcf', metadata: { sizeInBytes: 1048576 } },
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await user.click(await screen.findByRole('button', { name: /download/i }));

    await waitFor(() => {
      expect(notify).toHaveBeenCalledWith('error', 'There was an error retrieving the download. Please try again.');
    });
    expect(downloadSignedUrl).not.toHaveBeenCalled();

    // a failed fetch isn't cached, so the next click retries
    await user.click(screen.getByRole('button', { name: /download/i }));
    await waitFor(() => expect(mockGetPipelineRunOutputSignedUrls).toHaveBeenCalledTimes(2));
  });

  it('does not show download buttons once outputs have been delivered to a cloud destination', async () => {
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'output.vcf', metadata: { sizeInBytes: 1048576 } },
        },
        dataDeliveryReport: { status: 'SUCCEEDED' as const, destination: 'gs://user-bucket/outputs' },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await waitFor(() => {
      expect(screen.getByText('Data Delivered')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
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

  it('shows download button when outputs have not expired', async () => {
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
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    });
  });

  it('hides download button and shows "Not available" when outputs have expired', async () => {
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
      expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
      expect(screen.getByText('Not available')).toBeInTheDocument();
    });
  });

  it('correctly extracts the file name from the outputs structure when downloading', async () => {
    const user = userEvent.setup();
    const mockResult = {
      ...mockPipelineRunResponse('SUCCEEDED'),
      pipelineRunReport: {
        ...mockPipelineRunResponse('SUCCEEDED').pipelineRunReport,
        outputs: {
          imputedMultiSampleVcf: { value: 'my-output.vcf', metadata: { sizeInBytes: 5242880 } },
        },
      },
    };

    render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

    await user.click(await screen.findByRole('button', { name: /download/i }));

    await waitFor(() => {
      expect(downloadSignedUrl).toHaveBeenCalledWith('https://signed/output.vcf', 'my-output.vcf');
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
            'https://signed/test.chr1.vcf.gz',
            'https://signed/test.chr2.vcf.gz',
            'https://signed/test.chr3.vcf.gz',
            'https://signed/test.chr4.vcf.gz',
            'https://signed/test.chr5.vcf.gz',
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

    it('downloads the signed url matching the file that was clicked', async () => {
      const user = userEvent.setup();
      const mockResult = buildResultWithFileArray([
        { value: 'test.chr1.vcf.gz', metadata: { sizeInBytes: 100 } },
        { value: 'test.chr2.vcf.gz', metadata: { sizeInBytes: 200 } },
      ]);

      render(<JobOutputsView outputDefinitions={fileArrayOutputDefinitions} pipelineRunResult={mockResult} />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /download/i })).toHaveLength(2);
      });

      await user.click(screen.getAllByRole('button', { name: /download/i })[1]);

      await waitFor(() => {
        expect(downloadSignedUrl).toHaveBeenCalledWith('https://signed/test.chr2.vcf.gz', 'test.chr2.vcf.gz');
      });
    });

    it('fetches signed urls once for several files in the same array', async () => {
      const user = userEvent.setup();
      const mockResult = buildResultWithFileArray([
        { value: 'test.chr1.vcf.gz', metadata: { sizeInBytes: 100 } },
        { value: 'test.chr2.vcf.gz', metadata: { sizeInBytes: 200 } },
        { value: 'test.chr3.vcf.gz', metadata: { sizeInBytes: 300 } },
      ]);

      render(<JobOutputsView outputDefinitions={fileArrayOutputDefinitions} pipelineRunResult={mockResult} />);

      const downloadButtons = await screen.findAllByRole('button', { name: /download/i });
      for (const button of downloadButtons) {
        // eslint-disable-next-line no-await-in-loop
        await user.click(button);
        // eslint-disable-next-line no-await-in-loop
        await waitFor(() => expect(button).not.toBeDisabled());
      }

      expect(downloadSignedUrl).toHaveBeenCalledTimes(3);
      expect(mockGetPipelineRunOutputSignedUrls).toHaveBeenCalledTimes(1);
    });
  });

  describe('bulk download notice', () => {
    const buildResult = (pipelineRunReportOverrides = {}) => {
      const succeeded = mockPipelineRunResponse('SUCCEEDED');
      return {
        ...succeeded,
        pipelineRunReport: {
          ...succeeded.pipelineRunReport,
          outputs: {
            imputedMultiSampleVcf: { value: 'output.vcf', metadata: { sizeInBytes: 100 } },
          },
          ...pipelineRunReportOverrides,
        },
      };
    };

    it('links to the CLI and Cloud Delivery docs for downloading all files at once', async () => {
      render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={buildResult()} />);

      expect(await screen.findByRole('link', { name: 'CLI' })).toHaveAttribute(
        'href',
        'https://broadscientificservices.zendesk.com/hc/en-us/articles/39901313672859'
      );
      expect(screen.getByRole('link', { name: 'Cloud Delivery' })).toHaveAttribute(
        'href',
        'https://broadscientificservices.zendesk.com/hc/en-us/articles/48878810499483'
      );
    });

    it('does not show the notice once outputs have expired', async () => {
      const mockResult = buildResult({ outputExpirationDate: '2020-01-01T00:00:00Z' });

      render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

      await waitFor(() => {
        expect(screen.getByText('imputed multi-sample VCF')).toBeInTheDocument();
      });

      expect(screen.queryByRole('link', { name: 'CLI' })).not.toBeInTheDocument();
    });

    it('does not show the notice once outputs have been delivered to a cloud destination', async () => {
      const mockResult = buildResult({
        dataDeliveryReport: { status: 'SUCCEEDED' as const, destination: 'gs://bucket/destination/' },
      });

      render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

      await waitFor(() => {
        expect(screen.getByText('imputed multi-sample VCF')).toBeInTheDocument();
      });

      expect(screen.queryByRole('link', { name: 'CLI' })).not.toBeInTheDocument();
    });

    it('does not show the notice for jobs that have not succeeded', async () => {
      const failed = mockPipelineRunResponse('FAILED');
      const mockResult = {
        ...failed,
        pipelineRunReport: {
          ...failed.pipelineRunReport,
          outputs: { imputedMultiSampleVcf: { value: 'output.vcf', metadata: { sizeInBytes: 100 } } },
        },
      };

      render(<JobOutputsView outputDefinitions={mockOutputDefinitions} pipelineRunResult={mockResult} />);

      await waitFor(() => {
        expect(screen.getByText('imputed multi-sample VCF')).toBeInTheDocument();
      });

      expect(screen.queryByRole('link', { name: 'CLI' })).not.toBeInTheDocument();
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
