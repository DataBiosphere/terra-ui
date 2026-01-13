import { ButtonPrimary, Icon, Modal, Spinner } from '@terra-ui-packages/components';
import { formatDate } from '@terra-ui-packages/core-utils';
import React, { ReactNode, useEffect, useState } from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import Events from 'src/libs/events';
import { notify } from 'src/libs/notifications';
import { useCancellation } from 'src/libs/react-utils';
import { TEASPOONS_FILE_OUTPUT_TTL_DAYS } from 'src/pages/scientificServices/pipelines/common/teaspoons-service-constants';

/**
 * Modal component for displaying pipeline outputs
 */
interface OutputsModalProps {
  jobId: string;
  onDismiss: () => void;
}

export const ViewOutputsModal = ({ jobId, onDismiss }: OutputsModalProps): ReactNode => {
  const [result, setResult] = useState<PipelineRunResponse>();
  const [loading, setLoading] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const signal = useCancellation();

  useEffect(() => {
    const fetchPipelineRunResults = async () => {
      try {
        setLoading(true);
        const results = await Teaspoons(signal).getPipelineRunResult(jobId);
        setResult(results);
      } finally {
        setLoading(false);
      }
    };

    fetchPipelineRunResults();
  }, [jobId, signal]);

  const handleDownload = async (outputKey: string) => {
    try {
      setDownloadingKey(outputKey);

      // Fetch signed URLs
      const response = await Teaspoons(signal).getPipelineRunOutputSignedUrls(jobId);

      if (!response.outputSignedUrls) {
        notify('error', 'No signed URLs returned from server');
        return;
      }

      // Get the signed URL for this specific output
      const url = response.outputSignedUrls[outputKey];
      if (!url) {
        notify('error', 'Signed URL not found for this output');
        return;
      }

      // Open the download
      window.open(url, '_blank');

      // Track metrics
      if (result) {
        Metrics().captureEvent(Events.teaspoons.downloadJobOutputFile, {
          pipelineName: result.pipelineRunReport.pipelineName,
          pipelineVersion: result.pipelineRunReport.pipelineVersion,
          outputName: outputKey,
        });
      }
    } catch (err) {
      console.error('Error fetching signed URL:', err);
      notify('error', 'Failed to retrieve download URL');
    } finally {
      setDownloadingKey(null);
    }
  };

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
                {Object.entries(result.pipelineRunReport.outputs).map(([key, fileName]) => (
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
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{key}</div>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: '#666',
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                        }}
                      >
                        {fileName}
                      </div>
                    </div>
                    <ButtonPrimary
                      onClick={() => handleDownload(key)}
                      disabled={downloadingKey === key}
                      style={{ marginLeft: '1rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {downloadingKey === key ? <Spinner size={16} /> : <Icon icon='download' size={16} />}
                        Download
                      </div>
                    </ButtonPrimary>
                  </div>
                ))}
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
                    . Please download them before this date.
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
