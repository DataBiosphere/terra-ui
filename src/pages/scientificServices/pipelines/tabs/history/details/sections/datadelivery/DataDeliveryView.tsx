import { ButtonPrimary, Icon, Link, Spinner } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { TextArea } from 'src/components/input';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { DataDeliveryReport, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { SharingInstructions } from 'src/pages/scientificServices/pipelines/common/SharingInstructions';
import { GCS_BUCKET_VALIDATION_REGEX } from 'src/pages/scientificServices/pipelines/utils/upload-utils';
import { v4 as uuidv4 } from 'uuid';

import { useDeliveryPolling } from './useDeliveryPolling';

type DataDeliveryStatus = DataDeliveryReport['status'] | 'NOT_STARTED';

interface DataDeliveryViewProps {
  dataDeliveryReport: Partial<DataDeliveryReport> | null;
  pipelineRunResult: PipelineRunResponse;
}

const STATUS_CONFIG: Record<DataDeliveryStatus, { label: string; icon: React.ReactElement }> = {
  NOT_STARTED: {
    label: 'Not Started',
    icon: <Icon icon='circle' size={16} style={{ color: colors.dark(0.4) }} aria-label='Not Started' />,
  },
  RUNNING: {
    label: 'In Progress',
    icon: <Spinner size={16} aria-label='In Progress' />,
  },
  SUCCEEDED: {
    label: 'Delivered',
    icon: <Icon icon='success-standard' size={16} style={{ color: colors.success() }} aria-label='Delivered' />,
  },
  FAILED: {
    label: 'Failed',
    icon: <Icon icon='warning-standard' size={16} style={{ color: colors.danger() }} aria-label='Failed' />,
  },
};

const gcsPathToConsoleUrl = (gcsPath: string): string => {
  const withoutPrefix = gcsPath.replace(/^gs:\/\//, '');
  return `https://console.cloud.google.com/storage/browser/${withoutPrefix}`;
};

const validateGcsPath = (path: string): string | undefined => {
  if (!path.trim()) {
    return 'A destination path is required.';
  }
  if (!GCS_BUCKET_VALIDATION_REGEX.test(path)) {
    return 'Invalid Google Cloud Storage path. It should start with gs:// followed by the bucket name and path.';
  }
  return undefined;
};

const ERROR_MESSAGE_MAP: { substring: string; friendly: string }[] = [
  {
    substring: 'service does not have necessary permissions',
    friendly:
      'Broad Scientific Services does not have permission to write to the destination bucket. Please review the sharing instructions and try again.',
  },
  {
    substring: 'user does not have necessary permissions',
    friendly:
      'You do not have permission to write to the destination bucket. Please review the sharing instructions and try again.',
  },
];

const parseDeliveryError = (raw: string): string => {
  const lower = raw.toLowerCase();
  const match = ERROR_MESSAGE_MAP.find(({ substring }) => lower.includes(substring.toLowerCase()));
  return match?.friendly ?? 'An unexpected error occurred. Please try again.';
};

export const DataDeliveryView = ({ dataDeliveryReport: initialReport, pipelineRunResult }: DataDeliveryViewProps) => {
  const jobId = pipelineRunResult.jobReport.id;

  const [dataDeliveryReport, setDataDeliveryReport] = useState<Partial<DataDeliveryReport> | null>(initialReport);
  const [path, setPath] = useState(initialReport?.destination ?? '');
  const [validationError, setValidationError] = useState<string | undefined>(() =>
    initialReport?.destination ? validateGcsPath(initialReport.destination) : undefined
  );
  const [isDelivering, setIsDelivering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const status: DataDeliveryStatus = dataDeliveryReport?.status ?? 'NOT_STARTED';
  const destination = dataDeliveryReport?.destination ?? '';

  // ── Polling (while RUNNING) ───────────────────────────────────────────────
  useDeliveryPolling({ jobId, status, onUpdate: setDataDeliveryReport });

  // ── Handlers ──────────────────────────────────────────────────────────────
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
    setErrorMessage(undefined);
    try {
      await Teaspoons().deliverData(uuidv4(), jobId, path);
      const updated = await Teaspoons().getPipelineRunResult(jobId);
      if (updated.dataDeliveryReport) {
        setDataDeliveryReport(updated.dataDeliveryReport);
      }
    } catch (err) {
      let raw: string;
      if (err instanceof Response) {
        raw = await err.text();
      } else if (err instanceof Error) {
        raw = err.message;
      } else {
        raw = String(err);
      }
      setErrorMessage(parseDeliveryError(raw));
    } finally {
      setIsDelivering(false);
    }
  };

  // ── Per-status content ────────────────────────────────────────────────────
  const renderStatusContent = () => {
    switch (status) {
      case 'FAILED':
        return (
          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <span style={{ fontSize: '14px', color: colors.danger() }}>
              {errorMessage ?? 'There was an error moving the outputs to the destination. Please retry the delivery.'}
            </span>
            <ButtonPrimary
              disabled={isDelivering || !!validationError}
              onClick={handleDeliver}
              style={{ marginLeft: 'auto' }}
            >
              {isDelivering && <Spinner size={16} style={{ marginRight: '0.5rem' }} />}
              Retry
            </ButtonPrimary>
          </div>
        );
      case 'RUNNING':
        return (
          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              fontSize: '14px',
              color: colors.dark(0.7),
            }}
          >
            Data delivery is currently in progress. Please check back shortly.
          </div>
        );
      case 'SUCCEEDED':
        return (
          <div style={{ marginTop: '0.75rem', fontSize: '14px', color: colors.dark(0.8) }}>
            The outputs for this job were successfully delivered to the destination in Google Cloud Storage.{' '}
            <Link
              href={gcsPathToConsoleUrl(destination)}
              target='_blank'
              rel='noopener noreferrer'
              baseColor={() => '#46A3E9'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}
            >
              View your outputs in the Google Cloud Console
              <Icon icon='pop-out' size={14} />
            </Link>
          </div>
        );
      default: {
        const outputs = pipelineRunResult.pipelineRunReport?.outputs ?? {};
        const fileCount = Object.keys(outputs).length;
        return (
          <>
            {errorMessage && (
              <div role='alert' style={{ marginTop: '0.75rem', fontSize: '14px', color: colors.danger() }}>
                {errorMessage}
              </div>
            )}
            <div
              style={{
                marginTop: '0.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              {fileCount > 0 && (
                <span style={{ fontSize: '13px', color: colors.dark(0.7) }}>
                  {`${fileCount} ${fileCount === 1 ? 'file' : 'files'} will be moved to the destination.`}
                </span>
              )}
              <ButtonPrimary
                disabled={isDelivering || !!validationError}
                onClick={handleDeliver}
                style={{ marginLeft: 'auto' }}
              >
                {isDelivering && <Spinner size={16} style={{ marginRight: '0.5rem' }} />}
                Deliver
              </ButtonPrimary>
            </div>
          </>
        );
      }
    }
  };

  const isInputDisabled = status === 'RUNNING' || status === 'SUCCEEDED';

  // ── Render ────────────────────────────────────────────────────────────────
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Deliver Outputs</h3>
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
          {STATUS_CONFIG[status].icon}
          {STATUS_CONFIG[status].label}
        </div>
      </div>

      {status === 'NOT_STARTED' && (
        <p style={{ margin: '0 0 1rem 0', fontSize: '14px', color: colors.dark(0.8) }}>
          Enter a destination path in Google Cloud Storage to deliver the outputs of this job.
        </p>
      )}

      <div>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label
          htmlFor='gcs-delivery-path'
          style={{ display: 'block', fontWeight: 600, color: colors.dark(), marginBottom: '0.5rem' }}
        >
          Destination Path
        </label>
        <TextArea
          id='gcs-delivery-path'
          rows={3}
          value={path}
          onChange={handlePathChange}
          placeholder='gs://bucket/path/to/destination'
          aria-label='GCS destination path'
          aria-describedby={validationError ? 'gcs-path-error' : undefined}
          aria-invalid={!!validationError}
          disabled={isInputDisabled}
          style={{
            border: `1px solid ${validationError ? colors.danger() : colors.dark(0.5)}`,
            ...(isInputDisabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
          }}
        />
        {validationError && (
          <div id='gcs-path-error' role='alert' style={{ marginTop: '0.5rem', color: colors.danger() }}>
            {validationError}
          </div>
        )}
        {!isInputDisabled && <SharingInstructions cloudPath={path} cloudAccessType='outputs' />}
      </div>

      {renderStatusContent()}
    </div>
  );
};
