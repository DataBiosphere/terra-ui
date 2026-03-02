import { Icon, TooltipTrigger } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { DataDeliveryReport } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { GCS_PATH_VALIDATION_REGEX } from 'src/pages/scientificServices/pipelines/utils/upload-utils';

type DataDeliveryStatus = DataDeliveryReport['status'];

interface DataDeliveryViewProps {
  dataDeliveryReport: DataDeliveryReport;
}

const getStatusIcon = (status: DataDeliveryStatus) => {
  switch (status) {
    case 'DELIVERED':
      return <Icon icon='success-standard' size={20} style={{ color: colors.success() }} aria-label='Delivered' />;
    case 'FAILED':
      return <Icon icon='warning-standard' size={20} style={{ color: colors.danger() }} aria-label='Failed' />;
    case 'PENDING':
    default:
      return <Icon icon='clock' size={20} style={{ color: colors.dark(0.5) }} aria-label='Pending' />;
  }
};

const getStatusLabel = (status: DataDeliveryStatus): string => {
  switch (status) {
    case 'DELIVERED':
      return 'Delivered';
    case 'FAILED':
      return 'Failed';
    case 'PENDING':
    default:
      return 'Pending';
  }
};

const getStatusColor = (status: DataDeliveryStatus): string => {
  switch (status) {
    case 'DELIVERED':
      return colors.success();
    case 'FAILED':
      return colors.danger();
    case 'PENDING':
    default:
      return colors.dark(0.5);
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

export const DataDeliveryView = ({ dataDeliveryReport }: DataDeliveryViewProps) => {
  const { status, destination } = dataDeliveryReport;
  const [path, setPath] = useState(destination ?? '');
  const [validationError, setValidationError] = useState<string | undefined>(() =>
    destination ? validateGcsPath(destination) : undefined
  );

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.target.value;
    setPath(newPath);
    setValidationError(validateGcsPath(newPath));
  };

  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

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
      <h3 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>Data Delivery</h3>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {/* GCS Path Input */}
        <div style={{ flex: 1 }}>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label
            htmlFor='gcs-delivery-path'
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem', color: colors.dark() }}
          >
            GCS Destination Path
          </label>
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

        {/* Status Icon */}
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', paddingTop: '2rem' }}
        >
          <TooltipTrigger content={`Delivery status: ${statusLabel}`}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: 'white',
                border: `2px solid ${statusColor}`,
                cursor: 'default',
              }}
            >
              {getStatusIcon(status)}
            </span>
          </TooltipTrigger>
          <span style={{ fontSize: '12px', fontWeight: 500, color: statusColor }}>{statusLabel}</span>
        </div>
      </div>
    </div>
  );
};
