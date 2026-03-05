import { ButtonPrimary, Icon, Spinner } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { TextArea } from 'src/components/input';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { DataDeliveryReport, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { notify } from 'src/libs/notifications';
import { getTerraUser } from 'src/libs/state';
import { SharingInstructions } from 'src/pages/scientificServices/pipelines/common/SharingInstructions';
import { DocsKey } from 'src/pages/scientificServices/pipelines/common/zendeskUtils';
import { GCS_PATH_VALIDATION_REGEX } from 'src/pages/scientificServices/pipelines/utils/upload-utils';
import { useProxyGroup } from 'src/profile/personal-info/useProxyGroup';
import { v4 as uuidv4 } from 'uuid';

type DataDeliveryStatus = DataDeliveryReport['status'];

interface DataDeliveryViewProps {
  dataDeliveryReport: DataDeliveryReport;
  pipelineRunResult: PipelineRunResponse;
}

const getStatusIcon = (status: DataDeliveryStatus) => {
  switch (status) {
    case 'SUCCEEDED':
      return <Icon icon='success-standard' size={16} style={{ color: colors.success() }} aria-label='Delivered' />;
    case 'FAILED':
      return <Icon icon='warning-standard' size={16} style={{ color: colors.danger() }} aria-label='Failed' />;
    case 'RUNNING':
      return <Icon icon='clock' size={16} style={{ color: colors.dark(0.5) }} aria-label='Pending' />;
    default:
      return null;
  }
};

const getStatusLabel = (status: DataDeliveryStatus): string | null => {
  switch (status) {
    case 'SUCCEEDED':
      return 'Delivered';
    case 'FAILED':
      return 'Failed';
    case 'RUNNING':
      return 'Pending';
    default:
      return null;
  }
};

const gcsPathToConsoleUrl = (gcsPath: string): string => {
  const withoutPrefix = gcsPath.replace(/^gs:\/\//, '');
  return `https://console.cloud.google.com/storage/browser/${withoutPrefix}`;
};

const validateGcsPath = (path: string): string | undefined => {
  if (!path.trim()) {
    return 'A GCS destination path is required.';
  }
  if (!GCS_PATH_VALIDATION_REGEX.test(path)) {
    return 'Invalid Google Cloud Storage path. It should start with gs:// followed by the bucket name and path.';
  }
  return undefined;
};

export const DataDeliveryView = ({ dataDeliveryReport, pipelineRunResult }: DataDeliveryViewProps) => {
  const { status, destination } = dataDeliveryReport;
  const [path, setPath] = useState(destination ?? '');
  const [validationError, setValidationError] = useState<string | undefined>(() =>
    destination ? validateGcsPath(destination) : undefined
  );
  const [isDelivering, setIsDelivering] = useState(false);
  const [showSharingInstructions, setShowSharingInstructions] = useState(false);

  const userEmail = getTerraUser().email;
  const { proxyGroup } = useProxyGroup(userEmail);
  const proxyGroupEmail = proxyGroup.status === 'Ready' ? proxyGroup.state : null;
  const isLoadingProxyGroup = proxyGroup.status === 'Loading';

  const handlePathChange = (newPath: string) => {
    setPath(newPath);
    setValidationError(validateGcsPath(newPath));
  };

  const handleDeliver = async () => {
    const error = validateGcsPath(path);
    if (error) {
      setValidationError(error);
      return;
    }
    setIsDelivering(true);
    try {
      await Teaspoons().deliverData(uuidv4(), pipelineRunResult.jobReport.id, path);
      notify('success', 'Data delivery initiated successfully.');
    } catch (err) {
      notify('error', 'Failed to initiate data delivery.', { detail: err });
    } finally {
      setIsDelivering(false);
    }
  };

  const statusLabel = getStatusLabel(status);
  const outputs = pipelineRunResult.pipelineRunReport?.outputs ?? {};
  const fileCount = Object.keys(outputs).length;

  return (
    <div
      style={{
        backgroundColor: '#f4f6f9',
        border: '1px solid #d6d9dc',
        borderRadius: '4px',
        padding: '1rem 1rem 1.5rem',
        margin: '1rem 0',
      }}
    >
      {/* Header row: title + status badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <h3 style={{ margin: 0 }}>Deliver Outputs</h3>
        {statusLabel && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'white',
              padding: '0.5rem 0.75rem',
              border: '1px solid #D8D9DC',
              borderRadius: '20px',
              fontWeight: 500,
            }}
          >
            {getStatusIcon(status)}
            {statusLabel}
          </div>
        )}
      </div>
      <div>
        <p style={{ margin: '0 0 1rem 0', fontSize: '14px', color: colors.dark(0.8) }}>
          Enter a destination path in Google Cloud Storage to deliver the outputs of this job.
        </p>
      </div>
      {status === 'SUCCEEDED' ? (
        <div style={{ fontSize: '14px', color: colors.dark(0.8) }}>
          <p style={{ margin: '0 0 1rem 0' }}>
            The outputs for this job were successfully delivered to the destination in Google Cloud Storage.{' '}
            <a
              href={gcsPathToConsoleUrl(destination)}
              target='_blank'
              rel='noopener noreferrer'
              style={{
                color: '#46A3E9',
                fontWeight: 700,
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Icon icon='pop-out' size={14} />
              View your outputs in the Google Cloud Console.
            </a>
          </p>
        </div>
      ) : (
        <>
          {/* GCS Path Input */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label htmlFor='gcs-delivery-path' style={{ fontWeight: 600, color: colors.dark() }}>
                Destination Path
              </label>
            </div>
            <TextArea
              id='gcs-delivery-path'
              rows={3}
              value={path}
              onChange={handlePathChange}
              placeholder='gs://bucket/path/to/destination'
              aria-label='GCS destination path'
              aria-describedby={validationError ? 'gcs-path-error' : undefined}
              aria-invalid={!!validationError}
              disabled={status === 'RUNNING'}
              style={{
                border: `1px solid ${validationError ? colors.danger() : colors.dark(0.5)}`,
                ...(status === 'RUNNING' ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
              }}
            />
            {validationError && (
              <div
                id='gcs-path-error'
                role='alert'
                style={{ marginTop: '0.5rem', color: colors.danger(), fontSize: '13px' }}
              >
                {validationError}
              </div>
            )}
            {status !== 'RUNNING' && (
              <SharingInstructions
                isExpanded={showSharingInstructions}
                onToggleExpand={() => setShowSharingInstructions(!showSharingInstructions)}
                proxyGroupEmail={proxyGroupEmail}
                isLoadingProxyGroup={isLoadingProxyGroup}
                cloudPath={path}
                instructions='To ensure that Broad Scientific Services can deliver your outputs to the destination, please share the destination bucket with the following accounts:'
                docsKey={DocsKey.CLOUD_INPUTS}
              />
            )}
          </div>

          {status === 'FAILED' && (
            <p style={{ margin: '1rem 0 0 0', fontSize: '14px', color: colors.danger() }}>
              There was an error moving the results to the destination. Please retry the delivery.
            </p>
          )}

          {status === 'RUNNING' ? (
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '14px',
                color: colors.dark(0.7),
              }}
            >
              <Spinner size={20} />
              Data delivery is currently in progress. Please check back shortly.
            </div>
          ) : (
            <div
              style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              {fileCount > 0 && (
                <span style={{ color: colors.dark(0.7), fontSize: '13px' }}>
                  {`${fileCount} ${fileCount === 1 ? 'file' : 'files'} will be moved to the destination.`}
                </span>
              )}
              <ButtonPrimary disabled={isDelivering || !!validationError} onClick={handleDeliver}>
                {isDelivering && <Spinner size={16} style={{ marginRight: '0.5rem' }} />}
                {status === 'FAILED' ? 'Retry Delivery' : 'Deliver Data'}
              </ButtonPrimary>
            </div>
          )}
        </>
      )}
    </div>
  );
};
