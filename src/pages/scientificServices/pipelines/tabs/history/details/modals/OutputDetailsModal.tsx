import { ButtonPrimary, Icon, Modal, Spinner } from '@terra-ui-packages/components';
import React, { useEffect, useState } from 'react';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineOutput, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import Events from 'src/libs/events';
import { BucketConsoleLink } from 'src/pages/scientificServices/pipelines/tabs/run/inputs/file/BucketConsoleLink';
import { getOutputFileSize } from 'src/pages/scientificServices/pipelines/utils/download-utils';

interface DownloadOutputModalProps {
  outputKey: string;
  outputDefinition?: PipelineOutput;
  fileName: string;
  pipelineRunResult: PipelineRunResponse;
  onDismiss: () => void;
  signedUrls?: Record<string, string>;
  setSignedUrls: (urls: Record<string, string>) => void;
}

export const OutputDetailsModal = ({
  outputKey,
  outputDefinition,
  fileName,
  pipelineRunResult,
  onDismiss,
  signedUrls,
  setSignedUrls,
}: DownloadOutputModalProps) => {
  const deliverySucceeded = pipelineRunResult.dataDeliveryReport?.status === 'SUCCEEDED';

  const [loading, setLoading] = useState(!deliverySucceeded);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deliverySucceeded) {
      return;
    }

    const fetchSignedUrl = async () => {
      try {
        setLoading(true);
        setError(null);

        let urls = signedUrls;

        // if we haven't already fetched signed urls for this job, do it! otherwise, we'll use the existing ones
        if (!urls) {
          const response = await Teaspoons().getPipelineRunOutputSignedUrls(pipelineRunResult.jobReport.id);
          urls = response.outputSignedUrls;
          setSignedUrls(urls);
        }

        const url = urls?.[outputKey];
        if (!url) {
          setError('Failed to retrieve download. Please try again.');
          return;
        }

        setSignedUrl(url);

        try {
          const size = await getOutputFileSize(url);
          setFileSize(size);
        } catch (err) {
          // If we can't get the file size, it likely means the signed URL has expired
          setError('There was an error preparing the download. Please refresh the page and try again.');
          setSignedUrl(null);
        }
      } catch (err) {
        setError('Failed to retrieve download. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSignedUrl();
  }, [deliverySucceeded, outputKey, pipelineRunResult.jobReport.id, setSignedUrls, signedUrls]);

  const handleDownload = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
      Metrics().captureEvent(Events.teaspoons.downloadJobOutputFile, {
        pipelineName: pipelineRunResult.pipelineRunReport.pipelineName,
        pipelineVersion: pipelineRunResult.pipelineRunReport.pipelineVersion,
        outputName: outputKey,
        fileSize,
      });
    }
  };

  return (
    <Modal
      width={500}
      onDismiss={onDismiss}
      title='Download Output'
      showCancel
      okButton={
        <ButtonPrimary onClick={handleDownload} disabled={loading || !!error || !signedUrl}>
          <Icon icon='download' size={16} style={{ marginRight: '0.5rem' }} />
          Download
        </ButtonPrimary>
      }
    >
      <div style={{ padding: '1rem 0' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
            <Spinner />
            <div style={{ color: colors.dark(0.7) }}>Preparing download...</div>
          </div>
        )}

        {error && !deliverySucceeded && <div style={{ color: colors.danger(), marginBottom: '1rem' }}>{error}</div>}

        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <OutputInfoField label='File Name' value={fileName} />
            {fileSize && <OutputInfoField label='Size' value={fileSize} />}
            {outputDefinition?.description && (
              <OutputInfoField label='Description' value={outputDefinition.description} />
            )}
          </div>
        )}
        {pipelineRunResult.dataDeliveryReport?.status === 'SUCCEEDED' && (
          <BucketConsoleLink
            cloudPath={pipelineRunResult.dataDeliveryReport.destination}
            linkText='View your output in the Google Cloud Console'
          />
        )}
      </div>
    </Modal>
  );
};

const OutputInfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
    <div style={{ color: colors.dark(0.8) }}>{value}</div>
  </div>
);
