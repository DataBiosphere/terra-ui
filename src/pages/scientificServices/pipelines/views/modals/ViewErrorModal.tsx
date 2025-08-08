import { ButtonPrimary, Modal, Spinner } from '@terra-ui-packages/components';
import React, { ReactNode, useEffect, useState } from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineRun, PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { useCancellation } from 'src/libs/react-utils';
import { SCIENTIFIC_SERVICES_SUPPORT_EMAIL } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';

/**
 * Modal component for displaying pipeline errors
 */
interface ErrorModalProps {
  pipelineRun: PipelineRun;
  onDismiss: () => void;
}

export const ViewErrorModal = ({ pipelineRun, onDismiss }: ErrorModalProps): ReactNode => {
  const [result, setResult] = useState<PipelineRunResponse>();
  const [loading, setLoading] = useState(true);
  const signal = useCancellation();

  useEffect(() => {
    if (pipelineRun.status === 'PREPARING') return;
    const fetchPipelineRunResults = async () => {
      try {
        setLoading(true);
        const results = await Teaspoons(signal).getPipelineRunResult(pipelineRun.jobId);
        setResult(results);
      } finally {
        setLoading(false);
      }
    };

    fetchPipelineRunResults();
  }, [pipelineRun, signal]);

  return (
    <Modal width={800} title={`Pipeline Error - ${pipelineRun.jobId}`} onDismiss={onDismiss} showButtons={false}>
      <div>
        <h3>Error Details</h3>

        {pipelineRun.status === 'FAILED' &&
          (loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner />
              <div style={{ marginTop: '1rem' }}>Loading error details...</div>
            </div>
          ) : (
            <div>
              {result?.errorReport ? (
                <div style={{ margin: '1rem 0' }}>
                  <div
                    style={{
                      backgroundColor: '#f8d7da',
                      color: '#842029',
                      padding: '1rem',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Error Message:</div>
                    <div style={{ fontFamily: 'monospace' }}>{result.errorReport.message}</div>
                  </div>

                  {result.errorReport.causes && result.errorReport.causes.length > 0 && (
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Error Causes:</div>
                      <div
                        style={{
                          backgroundColor: '#f8f9fa',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {result.errorReport.causes.map((cause, index) => (
                          // eslint-disable-next-line react/no-array-index-key
                          <div key={index} style={{ marginBottom: '0.5rem' }}>
                            {cause}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  No detailed error information available for this job.
                </div>
              )}
            </div>
          ))}

        {pipelineRun.status === 'PREPARING' && (
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            There was an error preparing this job. Please try again or contact{' '}
            <a
              style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
              href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}`}
            >
              {SCIENTIFIC_SERVICES_SUPPORT_EMAIL}
            </a>{' '}
            if the issue persists.
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
