import { ExternalLink } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import Setting from 'src/workspaces/SettingsModal/Setting';

interface BatchProps {
  batchEnabled: boolean;
  setBatchEnabled: (enabled: boolean) => void;
  isOwner: boolean;
}

const Batch = (props: BatchProps): ReactNode => {
  const { batchEnabled, setBatchEnabled, isOwner } = props;

  const settingToggled = (checked: boolean) => setBatchEnabled(checked);

  return (
    <Setting
      settingEnabled={batchEnabled}
      setSettingEnabled={settingToggled}
      label='Run Workflows on GCP Batch:'
      isOwner={isOwner}
      description={
        <>
          Process workflows with the new{' '}
          <ExternalLink href='https://cloud.google.com/batch/docs'>GCP Batch API</ExternalLink>, rather than the former
          Cloud Life Sciences API (retiring May 2025).
        </>
      }
    />
  );
};

export default Batch;
