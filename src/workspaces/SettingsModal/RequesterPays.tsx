import { ExternalLink } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import Setting from 'src/workspaces/SettingsModal/Setting';

interface RequesterPaysProps {
  requesterPaysEnabled: boolean;
  setRequesterPaysEnabled: (enabled: boolean) => void;
  isOwner: boolean;
}

const RequesterPays = (props: RequesterPaysProps): ReactNode => {
  const { requesterPaysEnabled, setRequesterPaysEnabled, isOwner } = props;

  const settingToggled = (checked: boolean) => setRequesterPaysEnabled(checked);

  return (
    <Setting
      settingEnabled={requesterPaysEnabled}
      setSettingEnabled={settingToggled}
      label='Requester Pays:'
      isOwner={isOwner}
      description={
        <>
          When <ExternalLink href='https://cloud.google.com/storage/docs/requester-pays'>requester pays</ExternalLink>{' '}
          is enabled, requests for the bucket&apos;s data will be billed to the requester&apos;s project instead of the
          bucket owner. The requester will be prompted to select their own billing project.{' '}
        </>
      }
    />
  );
};

export default RequesterPays;
