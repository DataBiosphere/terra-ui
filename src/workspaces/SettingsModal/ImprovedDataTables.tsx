import React, { ReactNode } from 'react';
import Setting from 'src/workspaces/SettingsModal/Setting';

interface ImprovedDataTablesProps {
  originalImprovedDataTablesEnabled: boolean;
  improvedDataTablesEnabled: boolean;
  setImprovedDataTablesEnabled: (enabled: boolean) => void;
  isOwner: boolean;
}

const ImprovedDataTables = (props: ImprovedDataTablesProps): ReactNode => {
  const { originalImprovedDataTablesEnabled, improvedDataTablesEnabled, setImprovedDataTablesEnabled, isOwner } = props;

  const settingToggled = (checked: boolean) => setImprovedDataTablesEnabled(checked);

  return (
    <Setting
      disabled={originalImprovedDataTablesEnabled}
      settingEnabled={improvedDataTablesEnabled}
      setSettingEnabled={settingToggled}
      label='Improved Data Tables:'
      isOwner={isOwner}
      description={
        <>
          Enabling the setting will improve your DataTable performance. <br />
          <span style={{ fontWeight: 'bold' }}>Once enabled, the setting is read-only and cannot be disabled.</span>
        </>
      }
    />
  );
};

export default ImprovedDataTables;
