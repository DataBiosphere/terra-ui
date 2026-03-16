import { ButtonPrimary, Icon, Link, Modal, Spinner } from '@terra-ui-packages/components';
import { formatDate } from '@terra-ui-packages/core-utils';
import React, { ReactNode, useEffect, useState } from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { TEASPOONS_FILE_OUTPUT_TTL_DAYS } from 'src/pages/scientificServices/pipelines/common/teaspoons-service-constants';
import { BucketConsoleLink } from 'src/pages/scientificServices/pipelines/tabs/run/inputs/file/BucketConsoleLink';

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
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>();

  const deliverySucceeded = result?.pipelineRunReport.dataDeliveryReport?.status === 'SUCCEEDED';

  useEffect(() => {
    const fetchPipelineRunResults = async () => {
      try {
        setLoading(true);
        const results = await Teaspoons().getPipelineRunResult(jobId);
        setResult(results);
      } finally {
        setLoading(false);
      }
    };

    fetchPipelineRunResults();
  }, [jobId]);

  const handleDownload = async (outputKey: string) => {
    try {
      setDownloadingKey(outputKey);

      let urls = signedUrls;

      // If we haven't already fetched signed urls for this job, do it! Otherwise, we'll use the existing ones
      if (!urls) {
        const response = await Teaspoons().getPipelineRunOutputSignedUrls(jobId);
        urls = response.outputSignedUrls;
        setSignedUrls(urls);
      }

      const signedUrl = urls[outputKey];
      if (!signedUrl) {
        notify('error', 'There was an error retrieving the download. Please try again.');
        return;
      }

      window.open(signedUrl, '_blank');

      if (result) {
        Metrics().captureEvent(Events.teaspoons.downloadJobOutputFile, {
          pipelineName: result.pipelineRunReport.pipelineName,
          pipelineVersion: result.pipelineRunReport.pipelineVersion,
          outputName: outputKey,
        });
      }
    } catch (err) {
      notify('error', 'There was an error retrieving the download. Please try again.');
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
                      disabled={downloadingKey === key || deliverySucceeded}
                      style={{ marginLeft: '1rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {downloadingKey === key ? <Spinner size={16} /> : <Icon icon='download' size={16} />}
                        Download
                      </div>
                    </ButtonPrimary>
                  </div>
                ))}
                {deliverySucceeded ? (
                  <div
                    style={{
                      backgroundColor: colors.success(0.1),
                      // color: '#155724',
                      padding: '1rem',
                      borderRadius: '4px',
                      marginTop: '1rem',
                    }}
                  >
                    Your outputs were successfully delivered
                    {result.jobReport.completed && (
                      <>
                        {' '}
                        on <span style={{ fontWeight: 'bold' }}>{formatDate(result.jobReport.completed)}</span>
                      </>
                    )}
                    .{' '}
                    <BucketConsoleLink
                      cloudPath={result.pipelineRunReport.dataDeliveryReport?.destination}
                      linkText='View your outputs in the Google Cloud Console'
                    />
                  </div>
                ) : (
                  result.pipelineRunReport.outputExpirationDate && (
                    <div
                      style={{
                        backgroundColor: colors.danger(0.2),
                        // color: '#842029',
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
                      . Please download them before this date, or{' '}
                      <Link
                        href={Nav.getLink('pipelines-job-detail', { jobId })}
                        onClick={onDismiss}
                        baseColor={() => '#46A3E9'}
                      >
                        deliver them to a cloud destination
                      </Link>{' '}
                      using the Deliver Outputs feature.
                    </div>
                  )
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
