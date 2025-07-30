import { icon, useThemeFromContext } from '@terra-ui-packages/components';
import _ from 'lodash';
import { ReactNode } from 'react';
import { div } from 'react-hyperscript-helpers';
import { Alert, Alert as AlertType } from 'src/alerts/Alert';
import { useServiceAlerts } from 'src/alerts/service-alerts';

export const BlockerAlerts = (): ReactNode => {
  const { colors } = useThemeFromContext();

  const blockerAlerts: AlertType[] = _.filter(useServiceAlerts(), { severity: 'error' }); // Blocker alerts are severity 'error'

  if (!blockerAlerts) {
    return null;
  }

  return _.map(blockerAlerts, (alert: Alert) =>
    div(
      {
        key: alert.id,
        role: 'alert',
        style: {
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          border: `2px solid ${colors.danger()}`,
          backgroundColor: colors.danger(0.15),
          color: colors.dark(),
          fontWeight: 'bold',
          fontSize: 12,
          marginBottom: '0.5rem',
        },
      },
      [
        icon('error-standard', { size: 26, color: colors.danger(), style: { marginRight: '1ch' } }),
        alert.title,
        ': ',
        alert.message,
      ]
    )
  );
};
