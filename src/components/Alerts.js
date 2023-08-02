import _ from 'lodash/fp';
import { Fragment, useEffect, useState } from 'react';
import { div, h, li, p, span, ul } from 'react-hyperscript-helpers';
import { Clickable, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import PopupTrigger from 'src/components/PopupTrigger';
import colors from 'src/libs/colors';
import { useLinkExpirationAlerts } from 'src/libs/link-expiration-alerts';
import { usePrevious } from 'src/libs/react-utils';
import { useServiceAlerts } from 'src/libs/service-alerts';
import { useTermsOfServiceAlerts } from 'src/libs/terms-of-service-alerts';
import * as Utils from 'src/libs/utils';

const Alert = ({ alert }) => {
  const { title, message, link, linkTitle, severity } = alert;

  const [baseColor, ariaLabel] = Utils.switchCase(
    severity,
    ['success', () => [colors.success, 'success notification']],
    ['info', () => [colors.accent, 'info notification']],
    ['welcome', () => [colors.accent, 'welcome notification']],
    ['warn', () => [colors.warning, 'warning notification']],
    ['error', () => [colors.danger, 'error notification']],
    [Utils.DEFAULT, () => [colors.accent, 'notification']]
  );
  const iconType = Utils.switchCase(
    severity,
    ['success', () => 'success-standard'],
    ['warn', () => 'warning-standard'],
    ['error', () => 'error-standard']
  );

  return div(
    {
      'data-testid': 'alert',
      style: {
        display: 'flex',
        flexDirection: 'column',
        padding: '0.75rem 1rem',
        borderRadius: '4px',
        backgroundColor: baseColor(0.15),
        boxShadow: '0 0 4px 0 rgba(0,0,0,0.5)',
        cursor: 'auto',
        fontSize: 12,
      },
    },
    [
      div({ style: { display: 'flex', alignItems: 'center' } }, [
        !!iconType &&
          icon(iconType, {
            'aria-hidden': false,
            'aria-label': ariaLabel,
            size: 26,
            style: { color: baseColor(), flexShrink: 0, marginRight: '0.5rem' },
          }),
        div({ style: { fontSize: 14, fontWeight: 600, overflowWrap: 'break-word' } }, [title]),
      ]),
      !!message && div({ style: { marginTop: '0.5rem', fontSize: 12, fontWeight: 500, overflowWrap: 'break-word' } }, [message]),
      link &&
        div({ style: { marginTop: '0.25rem' } }, [
          h(Link, { ...Utils.newTabLinkProps, href: link, style: { fontWeight: 700 } }, [linkTitle || 'Read more']),
        ]),
    ]
  );
};

const AlertsList = ({ alerts }) => {
  return ul(
    {
      style: {
        padding: 0,
        margin: 0,
        listStyleType: 'none',
      },
    },
    [
      _.map(
        ([index, alert]) =>
          li(
            {
              key: alert.id,
              style: { marginTop: index === 0 ? 0 : '0.5rem' },
            },
            [h(Alert, { alert })]
          ),
        Utils.toIndexPairs(alerts)
      ),
    ]
  );
};

const AlertsIndicator = ({ style }) => {
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);

  const alerts = [...useServiceAlerts(), ...useLinkExpirationAlerts(), ...useTermsOfServiceAlerts()];

  const previousAlertIds = usePrevious(_.map('id', alerts));
  const hasNewAlerts = _.size(_.difference(_.map('id', alerts), previousAlertIds)) > 0;

  const numAlerts = _.size(alerts);

  useEffect(() => {
    if (hasNewAlerts) {
      setAnimating(true);
    }
  }, [hasNewAlerts]);

  return h(Fragment, [
    h(
      PopupTrigger,
      {
        side: 'bottom',
        onChange: setOpen,
        content: div({ style: { padding: '0.5rem', width: 300 } }, [
          _.size(alerts) > 0 ? h(AlertsList, { alerts }) : p(['No system alerts at this time.']),
        ]),
      },
      [
        h(
          Clickable,
          {
            tagName: 'span',
            'aria-expanded': open,
            'aria-haspopup': true,
            'aria-label': 'System alerts',
            style: {
              ...style,
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: 40,
              height: 40,
              borderRadius: 20,
              background: 'rgba(0, 0, 0, 0.2)',
            },
          },
          [
            icon('bell', {
              size: 24,
              className: animating ? 'alert-indicator-ringing' : undefined,
              style: { cursor: 'pointer' },
              onAnimationEnd: () => setAnimating(false),
            }),
            span(
              {
                style: {
                  position: 'absolute',
                  bottom: '-0.25rem',
                  right: '-0.5rem',
                  padding: '0.1rem 0.25rem',
                  borderRadius: '0.5rem',
                  background: colors.dark(),
                  color: '#fff',
                },
              },
              [numAlerts]
            ),
          ]
        ),
      ]
    ),

    // Have screen readers announce alerts.
    _.map(({ id, title, message }) => div({ key: id, role: 'alert', className: 'sr-only' }, [div([title]), !!message && div([message])]), alerts),
  ]);
};

export default AlertsIndicator;
