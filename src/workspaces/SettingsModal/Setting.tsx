import { Switch, useUniqueId } from '@terra-ui-packages/components';
import React, { PropsWithChildren, ReactNode } from 'react';
import { FormLabel } from 'src/libs/forms';

type SettingsProps = PropsWithChildren<{
  settingEnabled: boolean;
  setSettingEnabled: (enabled: boolean) => void;
  label: string;
  isOwner: boolean;
  description: ReactNode;
}>;

const Setting = (props: SettingsProps): ReactNode => {
  const { settingEnabled, setSettingEnabled, label, isOwner, description, children } = props;

  const switchId = useUniqueId('switch');
  const descriptionId = useUniqueId('description');

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '.75rem' }}>
        <FormLabel
          htmlFor={switchId}
          style={{ fontWeight: 600, whiteSpace: 'nowrap', marginRight: '.5rem', marginTop: '.5rem' }}
        >
          {label}
        </FormLabel>
        <Switch
          onLabel=''
          offLabel=''
          onChange={(checked: boolean) => {
            setSettingEnabled(checked);
          }}
          id={switchId}
          checked={settingEnabled}
          width={40}
          height={20}
          aria-describedby={descriptionId}
          disabled={!isOwner}
        />
      </div>
      <div id={descriptionId} style={{ marginTop: '.5rem', fontSize: '12px' }}>
        {description}
      </div>
      {children}
    </>
  );
};

export default Setting;
