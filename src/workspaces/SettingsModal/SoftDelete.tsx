import { ExternalLink, Switch, useUniqueId } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { NumberInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';

interface SoftDeleteProps {
  softDeleteEnabled: boolean;
  setSoftDeleteEnabled: (enabled: boolean) => void;
  softDeleteRetention: number | null;
  setSoftDeleteRetention: (age: number | null) => void;
  isOwner: boolean;
}

const SoftDelete = (props: SoftDeleteProps): ReactNode => {
  const { softDeleteEnabled, setSoftDeleteEnabled, softDeleteRetention, setSoftDeleteRetention, isOwner } = props;

  const switchId = useUniqueId('switch');
  const daysId = useUniqueId('days');
  const descriptionId = useUniqueId('description');

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '.75rem' }}>
        <FormLabel
          htmlFor={switchId}
          style={{ fontWeight: 600, whiteSpace: 'nowrap', marginRight: '.5rem', marginTop: '.5rem' }}
        >
          Soft Delete:
        </FormLabel>
        <Switch
          onLabel=''
          offLabel=''
          onChange={(checked: boolean) => {
            setSoftDeleteEnabled(checked);
            if (!checked) {
              setSoftDeleteRetention(null);
            }
          }}
          id={switchId}
          checked={softDeleteEnabled}
          width={40}
          height={20}
          aria-describedby={descriptionId}
          disabled={!isOwner}
        />
      </div>
      <div id={descriptionId} style={{ marginTop: '.5rem', fontSize: '12px' }}>
        This <ExternalLink href='https://cloud.google.com/storage/docs/soft-delete'>storage setting</ExternalLink>{' '}
        specifies a retention period during which a deleted object can be restored. Soft delete can be disabled, or set
        between 7 and 90 days.{' '}
        <span style={{ fontWeight: 'bold' }}>Data storage fees apply to objects during their retention period.</span>
      </div>
      <div style={{ marginTop: '.5rem', display: 'flex', alignItems: 'center' }}>
        {/* eslint-disable jsx-a11y/label-has-associated-control */}
        <label style={{ marginRight: '.25rem' }} htmlFor={daysId}>
          Days to retain:
        </label>
        <NumberInput
          style={{ minWidth: '100px' }}
          id={daysId}
          min={7}
          max={90}
          isClearable
          onlyInteger
          value={softDeleteRetention}
          disabled={!softDeleteEnabled}
          onChange={(value: number) => {
            setSoftDeleteRetention(value);
          }}
        />
      </div>
    </>
  );
};

export default SoftDelete;
