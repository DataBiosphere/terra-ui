import { ExternalLink, useUniqueId } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { NumberInput } from 'src/components/input';
import Setting from 'src/workspaces/SettingsModal/Setting';

interface SoftDeleteProps {
  softDeleteEnabled: boolean;
  setSoftDeleteEnabled: (enabled: boolean) => void;
  softDeleteRetention: number | null;
  setSoftDeleteRetention: (age: number | null) => void;
  isOwner: boolean;
}

const SoftDelete = (props: SoftDeleteProps): ReactNode => {
  const { softDeleteEnabled, setSoftDeleteEnabled, softDeleteRetention, setSoftDeleteRetention, isOwner } = props;

  const daysId = useUniqueId('days');
  const settingToggled = (checked: boolean) => {
    setSoftDeleteEnabled(checked);
    if (!checked) {
      setSoftDeleteRetention(null);
    }
  };

  return (
    <Setting
      settingEnabled={softDeleteEnabled}
      setSettingEnabled={settingToggled}
      label='Soft Delete:'
      isOwner={isOwner}
      description={
        <>
          This <ExternalLink href='https://cloud.google.com/storage/docs/soft-delete'>storage setting</ExternalLink>{' '}
          specifies a retention period during which a deleted object can be restored. Soft delete can be disabled, or
          set between 7 and 90 days.{' '}
          <span style={{ fontWeight: 'bold' }}>Data storage fees apply to objects during their retention period.</span>
        </>
      }
    >
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
          disabled={!softDeleteEnabled || !isOwner}
          onChange={(value: number) => {
            setSoftDeleteRetention(value);
          }}
        />
      </div>
    </Setting>
  );
};

export default SoftDelete;
