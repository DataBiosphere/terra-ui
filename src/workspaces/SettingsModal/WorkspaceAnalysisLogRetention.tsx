import { ExternalLink, useUniqueId } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { NumberInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';

interface WorkspaceAnalysisLogRetentionProps {
  retentionPeriodInDays: number | null;
  setRetentionPeriod: (retentionPeriodInDays: number) => void;
  isOwner: boolean;
}

const WorkspaceAnalysisLogRetention = (props: WorkspaceAnalysisLogRetentionProps): ReactNode => {
  const { retentionPeriodInDays, setRetentionPeriod, isOwner } = props;

  const daysId = useUniqueId('log-retention-days');
  const descriptionId = useUniqueId('log-retention-description');
  const formId = useUniqueId('log-retention-form');

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '.75rem' }}>
        <FormLabel
          htmlFor={formId}
          style={{ fontWeight: 600, whiteSpace: 'nowrap', marginRight: '.5rem', marginTop: '.5rem' }}
        >
          Workspace Analysis Log Retention:
        </FormLabel>
      </div>
      <div id={descriptionId} style={{ marginTop: '.5rem', fontSize: '12px' }}>
        This{' '}
        <ExternalLink href='https://cloud.google.com/logging/docs/buckets#custom-retention'>
          log retention setting
        </ExternalLink>{' '}
        specifies the number of days to retain workspace logs, including those from workflow tasks and compute
        environment VMs. After the retention period has passed, logs will be deleted. Valid values range from 1 to 3650
        days (10 years).{' '}
        <span style={{ fontWeight: 'bold' }}>
          Note increasing the retention period beyond 30 days will incur{' '}
          <ExternalLink href='https://cloud.google.com/stackdriver/pricing#logging-pricing-summary'>
            additional costs
          </ExternalLink>
        </span>
        .{' '}
      </div>
      <div style={{ marginTop: '.5rem', display: 'flex', alignItems: 'center' }}>
        {/* eslint-disable jsx-a11y/label-has-associated-control */}
        <label style={{ marginRight: '.25rem' }} htmlFor={daysId}>
          Days to retain:
        </label>
        <NumberInput
          style={{ minWidth: '100px' }}
          id={daysId}
          min={1}
          max={3650}
          isClearable
          onlyInteger
          value={retentionPeriodInDays}
          disabled={!isOwner}
          onChange={(value: number) => {
            setRetentionPeriod(value);
          }}
        />
      </div>
    </>
  );
};

export default WorkspaceAnalysisLogRetention;
