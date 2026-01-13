import { ButtonPrimary, ButtonSecondary, Icon, Modal, Spinner } from '@terra-ui-packages/components';
import React, { useEffect, useState } from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineOutput, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import Events from 'src/libs/events';
import { notify } from 'src/libs/notifications';
import { useCancellation } from 'src/libs/react-utils';
import { getOutputFileSize } from 'src/pages/scientificServices/pipelines/utils/download-utils';

interface DownloadOutputModalProps {
  outputKey: string;
  outputDefinition?: PipelineOutput;
  fileName: string;
  pipelineRunResult: PipelineRunResponse;
  onDismiss: () => void;
}

export const DownloadOutputModal = ({
  outputKey,
  outputDefinition,
  fileName,
  pipelineRunResult,
  onDismiss,
}: DownloadOutputModalProps) => {
  const [loading, setLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const signal = useCancellation();

  useEffect(() => {
    const fetchSignedUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch signed URLs
        const response = await Teaspoons(signal).getPipelineRunOutputSignedUrls(pipelineRunResult.jobReport.id);

        if (!response.outputSignedUrls) {
          setError('No signed URLs returned from server');
          return;
        }

        // Get the signed URL for this specific output
        const url = response.outputSignedUrls[outputKey];
        if (!url) {
          setError('Signed URL not found for this output');
          return;
        }

        setSignedUrl(url);

        // Fetch file size
        try {
          const size = await getOutputFileSize(url);
          setFileSize(size);
        } catch {
          setFileSize('Unknown size');
        }
      } catch (err) {
        console.error('Error fetching signed URL:', err);
        setError('Failed to retrieve download URL. Please try again.');
        notify('error', 'Failed to retrieve download URL');
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [outputKey, pipelineRunResult.jobReport.id, signal]);

  const handleDownload = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
      Metrics().captureEvent(Events.teaspoons.downloadJobOutputFile, {
        pipelineName: pipelineRunResult.pipelineRunReport.pipelineName,
        pipelineVersion: pipelineRunResult.pipelineRunReport.pipelineVersion,
        outputName: outputDefinition?.displayName || outputKey,
        fileSize,
      });
    }
  };

  const renderModalContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
          <Spinner />
          <div style={{ color: colors.dark(0.7) }}>Preparing download...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div>
          <div style={{ color: colors.danger(), marginBottom: '1rem' }}>{error}</div>
          <ButtonSecondary onClick={onDismiss}>Close</ButtonSecondary>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>File:</div>
          <div style={{ color: colors.dark(0.8) }}>{outputDefinition?.displayName || outputKey}</div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>File Name:</div>
          <div style={{ color: colors.dark(0.8), wordBreak: 'break-all' }}>{fileName}</div>
        </div>
        {fileSize && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Size:</div>
            <div style={{ color: colors.dark(0.8) }}>{fileSize}</div>
          </div>
        )}
        {outputDefinition?.description && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Description:</div>
            <div style={{ color: colors.dark(0.8) }}>{outputDefinition.description}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      onDismiss={onDismiss}
      title='Download Output'
      showCancel={false}
      showX
      okButton={
        loading || error ? undefined : (
          <ButtonPrimary onClick={handleDownload} disabled={!signedUrl}>
            <Icon icon='download' size={16} style={{ marginRight: '0.5rem' }} />
            Download
          </ButtonPrimary>
        )
      }
    >
      <div style={{ padding: '1rem 0' }}>{renderModalContent()}</div>
    </Modal>
  );
};
