import { ButtonPrimary, Icon, Modal, Spinner } from '@terra-ui-packages/components';
import { formatBytes, formatDate } from '@terra-ui-packages/core-utils';
import React, { ReactNode, useEffect, useState } from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import Events from 'src/libs/events';
import { useCancellation } from 'src/libs/react-utils';
import { TEASPOONS_FILE_OUTPUT_TTL_DAYS } from 'src/pages/scientificServices/pipelines/common/teaspoons-service-constants';
import { PipelineOutputConfiguration } from 'src/pages/scientificServices/pipelines/tabs/run/inputs/PipelineOutputConfiguration';

/**
 * Modal component for displaying pipeline outputs
 */
interface OutputsModalProps {
  jobId: string;
  onDismiss: () => void;
}

const getFileSize = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const size = response.headers.get('content-length');
    return size ? formatBytes(Number.parseInt(size)) : 'Unknown size';
  } catch {
    return 'Unknown size';
  }
};

export const ViewOutputsModal = ({ jobId, onDismiss }: OutputsModalProps): ReactNode => {
  const [result, setResult] = useState<PipelineRunResponse>();
  const [loading, setLoading] = useState(true);
  const [fileSizes, setFileSizes] = useState<Record<string, string | null>>({});
  const signal = useCancellation();

  useEffect(() => {
    const fetchPipelineRunResults = async () => {
      try {
        setLoading(true);

        // TODO: Remove this mock data once real API is available
        // Mock data for testing
        const mockResults: PipelineRunResponse = {
          pipelineRunReport: {
            jobId,
            pipelineName: 'test-pipeline',
            pipelineVersion: '1.0.0',
            status: 'SUCCEEDED',
            outputs: {
              'imputed_sample_1.cram': 'https://storage.googleapis.com/mock-bucket/large_analysis_results.bam',
              'imputed_sample_1.crai': 'https://storage.googleapis.com/mock-bucket/summary_report.html',
            },
            outputExpirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          },
        } as PipelineRunResponse;

        setResult(mockResults);

        // Mock file sizes for testing
        const mockFileSizes: Record<string, string> = {
          'imputed_sample_1.cram': formatBytes(54.4 * 1024 * 1024 * 1024), // 54.4 GiB
          'imputed_sample_1.crai': formatBytes(200 * 1024 * 1024), // 200 MiB
        };

        if (mockResults?.pipelineRunReport.outputs) {
          const outputs = Object.entries(mockResults.pipelineRunReport.outputs);
          const initialState = outputs.reduce((acc, [key]) => ({ ...acc, [key]: null }), {});
          setFileSizes(initialState);

          // Simulate loading delay for each file
          for (const [key] of outputs) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            setFileSizes((prev) => ({ ...prev, [key]: mockFileSizes[key] || 'Unknown size' }));
          }
        }

        // Uncomment below when real API is available
        // const results = await Teaspoons(signal).getPipelineRunResult(jobId);
        // setResult(results);
        //
        // if (results?.pipelineRunReport.outputs) {
        //   const outputs = Object.entries(results.pipelineRunReport.outputs);
        //   const initialState = outputs.reduce((acc, [key]) => ({ ...acc, [key]: null }), {});
        //   setFileSizes(initialState);
        //
        //   for (const [key, url] of outputs) {
        //     try {
        //       const size = await getFileSize(url);
        //       setFileSizes((prev) => ({ ...prev, [key]: size }));
        //     } catch {
        //       setFileSizes((prev) => ({ ...prev, [key]: 'Unknown size' }));
        //     }
        //   }
        // }
      } finally {
        setLoading(false);
      }
    };

    fetchPipelineRunResults();
  }, [jobId, signal]);

  return (
    <Modal width={800} title={`Pipeline Outputs - ${jobId}`} onDismiss={onDismiss} showButtons={false}>
      <div>
        <h3>Available Output Files</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner />
            <div style={{ marginTop: '1rem' }}>Loading outputs...</div>
          </div>
        ) : (
          <div>
            {result?.pipelineRunReport.outputs && Object.entries(result.pipelineRunReport.outputs).length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  margin: '1rem 0',
                }}
              >
                {Object.entries(result.pipelineRunReport.outputs).map(([key, url]) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '0.25rem' }}>
                        {key}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        {fileSizes[key] === null ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Spinner size={12} />
                            Loading size...
                          </span>
                        ) : (
                          fileSizes[key] || 'Unknown size'
                        )}
                      </div>
                    </div>
                    <ButtonPrimary
                      onClick={() => {
                        window.open(url, '_blank');
                        Metrics().captureEvent(Events.teaspoons.downloadJobOutputFile, {
                          pipelineName: result.pipelineRunReport.pipelineName,
                          pipelineVersion: result.pipelineRunReport.pipelineVersion,
                          outputName: key,
                          fileSize: fileSizes[key],
                        });
                      }}
                      style={{ marginLeft: '1rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Icon icon='download' size={16} />
                        Download
                      </div>
                    </ButtonPrimary>
                  </div>
                ))}
                <div
                  style={{
                    // display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.5rem',
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <PipelineOutputConfiguration
                    value=''
                    onChange={() => console.log('foo')}
                    onValidation={() => console.log('bar')}
                  />
                  <ButtonPrimary onClick={() => console.log('Configure output delivery path clicked')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Icon icon='cloud' size={16} />
                      Deliver Outputs
                    </div>
                  </ButtonPrimary>
                </div>
                {result.pipelineRunReport.outputExpirationDate && (
                  <div
                    style={{
                      backgroundColor: '#f8d7da',
                      color: '#842029',
                      padding: '1rem',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                      marginTop: '1rem',
                    }}
                  >
                    All output files for this job will be automatically deleted on{' '}
                    <span style={{ fontWeight: 'bold' }}>
                      {formatDate(result.pipelineRunReport.outputExpirationDate)}
                    </span>
                    . Please download them or transfer them to another location before this date.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center' }}>
                No output information found for this job. If this job completed more than{' '}
                {TEASPOONS_FILE_OUTPUT_TTL_DAYS} days ago, the outputs have been deleted.
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <ButtonPrimary onClick={onDismiss}>Close</ButtonPrimary>
        </div>
      </div>
    </Modal>
  );
};
