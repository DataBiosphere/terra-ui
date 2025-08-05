import { Icon, IconId, Spinner } from '@terra-ui-packages/components';
import React from 'react';

export type SubmissionState = 'preparing' | 'uploading' | 'starting';

export const SubmissionStatusBar = ({ submissionState }: { submissionState: SubmissionState }) => {
  const isStepComplete = (step: SubmissionState) => {
    const stepOrder = ['preparing', 'uploading', 'starting'];
    const currentIndex = stepOrder.indexOf(submissionState);
    const stepIndex = stepOrder.indexOf(step);
    return stepIndex <= currentIndex;
  };

  const getIconProps = (step: SubmissionState) => {
    return {
      icon: isStepComplete(step) ? ('success-standard' as IconId) : ('circle' as IconId),
      style: {
        color: isStepComplete(step) ? '#74AE43' : '#8f95a0',
        fontSize: '16px',
      },
    };
  };

  const isStepCurrent = (step: SubmissionState) => {
    return step === submissionState;
  };

  const steps = [
    { name: 'preparing', label: 'Preparing' },
    { name: 'uploading', label: 'Uploading' },
    { name: 'starting', label: 'Starting' },
  ] as const;

  return (
    <div
      style={{
        marginTop: '1rem',
        display: 'flex',
        flexDirection: 'row',
        gap: '0.5rem',
        width: '500px',
        border: '1px solid #8f95a0',
        borderRadius: '4px',
        padding: '1rem',
        backgroundColor: '#fff',
      }}
    >
      {steps.map((step) => (
        <div
          key={step.name}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}
        >
          {isStepCurrent(step.name) ? (
            <Spinner size={32} />
          ) : (
            <Icon
              data-testid={`icon-${step.name}`}
              size={32}
              icon={getIconProps(step.name).icon}
              style={getIconProps(step.name).style}
            />
          )}
          <span style={{ color: isStepComplete(step.name) ? '#000' : '#8f95a0' }}>{step.label}</span>
        </div>
      ))}
    </div>
  );
};
