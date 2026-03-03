import { ButtonPrimary, Icon, Spinner, TooltipTrigger } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { DataDeliveryReport, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { notify } from 'src/libs/notifications';
import { GCS_PATH_VALIDATION_REGEX } from 'src/pages/scientificServices/pipelines/utils/upload-utils';
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

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.target.value;
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
        <h3 style={{ margin: 0 }}>Data Delivery</h3>
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

      {/* GCS Path Input */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <label htmlFor='gcs-delivery-path' style={{ fontWeight: 600, color: colors.dark() }}>
            Destination Path
          </label>
          <TooltipTrigger content='Enter a destination path to move your results.'>
            <Icon icon='help' size={16} style={{ color: colors.dark(0.55) }} />
          </TooltipTrigger>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id='gcs-delivery-path'
            type='text'
            value={path}
            onChange={handlePathChange}
            placeholder='gs://bucket/path/to/destination'
            aria-label='GCS destination path'
            aria-describedby={validationError ? 'gcs-path-error' : undefined}
            aria-invalid={!!validationError}
            style={{
              width: '100%',
              padding: '0.625rem 0.75rem',
              paddingRight: validationError ? '2.25rem' : '0.75rem',
              border: `1px solid ${validationError ? colors.danger() : '#8f95a0'}`,
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: 'white',
            }}
          />
          {validationError && (
            <TooltipTrigger content={validationError} side='right'>
              <span
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'help',
                }}
              >
                <Icon icon='error-standard' size={20} style={{ color: colors.danger() }} />
              </span>
            </TooltipTrigger>
          )}
        </div>
        {validationError && (
          <div
            id='gcs-path-error'
            role='alert'
            style={{ marginTop: '0.375rem', color: colors.danger(), fontSize: '13px' }}
          >
            {validationError}
          </div>
        )}
      </div>

      <div
        style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}
      >
        {fileCount > 0 && (
          <span style={{ color: colors.dark(0.6), fontSize: '13px' }}>
            {`This will copy ${fileCount} ${fileCount === 1 ? 'file' : 'files'} to the destination.`}
          </span>
        )}
        <ButtonPrimary
          disabled={isDelivering || !!validationError || status === 'DELIVERED' || status === 'RUNNING'}
          onClick={handleDeliver}
        >
          {isDelivering && <Spinner size={16} style={{ marginRight: '0.5rem' }} />}
          {status === 'FAILED' ? 'Retry Delivery' : 'Deliver Data'}
        </ButtonPrimary>
      </div>
    </div>
  );
};
