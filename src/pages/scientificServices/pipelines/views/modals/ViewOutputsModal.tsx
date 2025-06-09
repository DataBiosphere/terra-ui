import { ButtonPrimary, Icon, Modal, Spinner } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';

/**
 * Modal component for displaying pipeline outputs
 */
interface OutputsModalProps {
  jobId: string;
  result: PipelineRunResponse | undefined;
  onDismiss: () => void;
}

export const ViewOutputsModal = ({ jobId, result, onDismiss }: OutputsModalProps): ReactNode => {
  return (
    <Modal width={800} title={`Pipeline Outputs - ${jobId}`} onDismiss={onDismiss} showButtons={false}>
      <div>
        <h3>Available Output Files</h3>

        {!result ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner />
            <div style={{ marginTop: '1rem' }}>Loading outputs...</div>
          </div>
        ) : (
          <div>
            {result.pipelineRunReport.outputs && Object.entries(result.pipelineRunReport.outputs).length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  margin: '1rem 0',
                }}
              >
                {Object.entries(result.pipelineRunReport.outputs).map(([key, url]) => (
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
                    <div style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{key}</div>
                    <ButtonPrimary
                      onClick={() => {
                        window.open(url, '_blank');
                      }}
                      style={{ marginLeft: '1rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Icon icon='download' size={16} />
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
                      {new Date(result.pipelineRunReport.outputExpirationDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    . Please download them before this date.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center' }}>No output files found for this job.</div>
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
