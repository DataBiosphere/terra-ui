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
          This{' '}
          <ExternalLink href='https://cloud.google.com/storage/docs/requester-pays'>
            requester pays setting
          </ExternalLink>{' '}
          specifies whether the costs of requests on a storage resource are billed to the project owner or the
          requester. Requester pays can be enabled or disabled.{' '}
        </>
      }
    />
  );
};

export default RequesterPays;
