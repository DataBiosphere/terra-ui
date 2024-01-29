import { icon, useThemeFromContext } from '@terra-ui-packages/components';
import { formatDuration } from 'date-fns';
import { Fragment, ReactNode } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';

import { useTimeUntilRequiredUpdate } from './version-alerts';

export const RequiredUpdateAlert = (): ReactNode => {
  const { colors } = useThemeFromContext();

  const timeUntilRequiredUpdate = useTimeUntilRequiredUpdate();

  if (timeUntilRequiredUpdate === undefined) {
    return null;
  }

  const minutesRemaining = Math.floor(timeUntilRequiredUpdate / 60);
  const secondsRemaining = timeUntilRequiredUpdate % 60;

  return div(
    {
      role: 'alert',
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: '1rem 1.25rem',
        border: `2px solid ${colors.warning()}`,
        backgroundColor: colors.warning(0.15),
        color: colors.dark(),
        fontWeight: 'bold',
        fontSize: 12,
      },
    },
    [
      icon('warning-standard', { size: 26, color: colors.warning(), style: { marginRight: '1ch' } }),
      'A required update is available. Terra will automatically refresh your browser ',
      timeUntilRequiredUpdate > 0
        ? h(Fragment, [
            'in ',
            span({ role: 'timer', style: { marginLeft: '0.5ch' } }, [
              formatDuration({
                minutes: minutesRemaining,
                seconds: secondsRemaining,
              }),
            ]),
          ])
        : 'now',
      '.',
    ]
  );
};
