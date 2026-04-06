import { ButtonPrimary, Spinner } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import { TextArea } from 'src/components/input';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { DataDeliveryReport, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import { CloudDataAccessInstructions } from 'src/pages/scientificServices/pipelines/common/CloudDataAccessInstructions';
import {
  parseDeliveryError,
  STATUS_CONFIG,
  validateGcsPath,
} from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/datadelivery/data-delivery-utils';
import { BucketConsoleLink } from 'src/pages/scientificServices/pipelines/tabs/run/inputs/file/BucketConsoleLink';

import { useDeliveryPolling } from './useDeliveryPolling';

// NOT_STARTED isn't a status returned by the backend, instead it's a placeholder status to make
// dealing with the initial state easier (since before delivery is initiated there is no report/status)
export type DataDeliveryStatus = DataDeliveryReport['status'] | 'NOT_STARTED';

interface DataDeliveryViewProps {
  dataDeliveryReport: Partial<DataDeliveryReport> | null;
  pipelineRunResult: PipelineRunResponse;
}

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

  useDeliveryPolling({ jobId, status, onUpdate: setDataDeliveryReport });

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
      await Teaspoons().deliverData(jobId, path);
      const updated = await Teaspoons().getPipelineRunResult(jobId);
      if (updated.pipelineRunReport.dataDeliveryReport) {
        setDataDeliveryReport(updated.pipelineRunReport.dataDeliveryReport);
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
            The outputs for this job were successfully delivered to the destination in Google Cloud Storage.
            <BucketConsoleLink cloudPath={destination} linkText='View your outputs in the Google Cloud Console' />
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
        {!isInputDisabled && <CloudDataAccessInstructions cloudPath={path} cloudAccessType='outputs' />}
      </div>

      {renderStatusContent()}
    </div>
  );
};
