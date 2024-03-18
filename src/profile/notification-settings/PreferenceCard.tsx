import { CSSProperties, ReactElement } from 'react';
import { EventWorkspaceAttributes } from 'src/libs/events';
import { memoWithName } from 'src/libs/react-utils';
import * as Style from 'src/libs/style';
import {
  NotificationCheckbox,
  NotificationCheckboxProps,
  UserAttributesCheckbox,
  UserAttributesCheckboxProps,
} from 'src/profile/notification-settings/PreferenceCheckbox';
import { NotificationType } from 'src/profile/notification-settings/utils';

const cardStyles: Record<string, CSSProperties> = {
  label: {
    ...Style.noWrapEllipsis,
    height: '1rem',
    gridColumnStart: '1',
    gridColumnEnd: '3',
  },
  field: {
    height: '1rem',
    textAlign: 'center',
  },
  row: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', width: '100%', padding: '1rem' },
};

export interface NotificationCardProps {
  label: string;
  setSaving: (boolean) => void;
  prefsData: Record<string, string>;
  workspace?: EventWorkspaceAttributes;
  options: { notificationKeys: string[]; notificationType: NotificationType; optionLabel: string }[];
}

export const NotificationCard: React.FC<NotificationCardProps> = memoWithName(
  'NotificationCard',
  (props: NotificationCardProps): ReactElement => {
    const { label, setSaving, prefsData, workspace, options } = props;

    return (
      <div role="listitem" style={{ ...Style.cardList.longCardShadowless, padding: 0, flexDirection: 'column' }}>
        <div style={cardStyles.row}>
          <div style={cardStyles.label}>{label}</div>
          {options.map(
            (option: { notificationKeys: string[]; notificationType: NotificationType; optionLabel: string }) => {
              const { notificationKeys, notificationType, optionLabel } = option;
              const notificationCheckboxProps: NotificationCheckboxProps = {
                notificationKeys,
                notificationType,
                label: optionLabel,
                setSaving,
                prefsData,
                workspace,
              };

              return (
                <div style={cardStyles.field} key={notificationType}>
                  <NotificationCheckbox {...notificationCheckboxProps} />
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  }
);

export interface UserAttributesCardProps {
  value: boolean;
  label: string;
  setSaving: (boolean) => void;
  notificationKeys: string[];
  notificationType: NotificationType;
  disabled?: boolean;
}

export const UserAttributesCard: React.FC<UserAttributesCardProps> = memoWithName(
  'NotificationCard',
  (props: UserAttributesCardProps): ReactElement => {
    const { value, label, setSaving, notificationKeys, notificationType, disabled = false } = props;
    const userAttributesCheckboxProps: UserAttributesCheckboxProps = {
      value,
      label,
      setSaving,
      notificationKeys,
      notificationType,
      disabled,
    };
    return (
      <div role="listitem" style={{ ...Style.cardList.longCardShadowless, padding: 0, flexDirection: 'column' }}>
        <div style={cardStyles.row}>
          <div style={cardStyles.label}>{label}</div>
          <div style={cardStyles.field}>
            <UserAttributesCheckbox {...userAttributesCheckboxProps} />
          </div>
        </div>
      </div>
    );
  }
);
