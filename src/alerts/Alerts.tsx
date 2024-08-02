import { Icon, IconId, PopupTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { CSSProperties, Fragment, ReactNode, useEffect, useState } from 'react';
import React from 'react';
import { Clickable, Link } from 'src/components/common';
import colors from 'src/libs/colors';
import { useLinkExpirationAlerts } from 'src/libs/link-expiration-alerts';
import { usePrevious } from 'src/libs/react-utils';
import * as Utils from 'src/libs/utils';
import { useTermsOfServiceAlerts } from 'src/registration/terms-of-service/terms-of-service-alerts';

import { Alert as AlertType } from './Alert';
import { useServiceAlerts } from './service-alerts';
import { useVersionAlerts } from './version-alerts';

interface AlertProps {
  alert: AlertType;
}

const Alert = (props: AlertProps): ReactNode => {
  const {
    alert: { title, message, link, linkTitle, severity },
  } = props;

  const [baseColor, ariaLabel] = Utils.switchCase(
    severity,
    ['success', () => [colors.success, 'success notification']],
    ['info', () => [colors.accent, 'info notification']],
    ['welcome', () => [colors.accent, 'welcome notification']],
    ['warn', () => [colors.warning, 'warning notification']],
    ['error', () => [colors.danger, 'error notification']],
    [Utils.DEFAULT, () => [colors.accent, 'notification']]
  );
  const iconType = Utils.switchCase<string | undefined, IconId>(
    severity,
    ['success', () => 'success-standard'],
    ['warn', () => 'warning-standard'],
    ['error', () => 'error-standard']
  );

  return (
    <div
      data-testid='alert'
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0.75rem 1rem',
        borderRadius: '4px',
        backgroundColor: baseColor(0.15),
        boxShadow: '0 0 4px 0 rgba(0,0,0,0.5)',
        cursor: 'auto',
        fontSize: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {!!iconType && (
          <Icon
            icon={iconType}
            aria-label={ariaLabel}
            size={26}
            style={{ color: baseColor(), flexShrink: 0, marginRight: '0.5rem' }}
          />
        )}
        <div style={{ fontSize: 14, fontWeight: 600, overflowWrap: 'break-word' }}> {title}</div>
      </div>
      {!!message && (
        <div style={{ marginTop: '0.5rem', fontSize: 12, fontWeight: 500, overflowWrap: 'break-word' }}>{message}</div>
      )}
      {link && (
        <div style={{ marginTop: '0.25rem' }}>
          <Link {...Utils.newTabLinkProps} href={link} style={{ fontWeight: 700 }}>
            {linkTitle || 'Read more'}
          </Link>
        </div>
      )}
    </div>
  );
};

interface AlertsListProps {
  alerts: AlertType[];
}

const AlertsList = (props: AlertsListProps): ReactNode => {
  const { alerts } = props;
  return (
    <ul
      style={{
        padding: 0,
        margin: 0,
        listStyleType: 'none',
      }}
    >
      {Utils.toIndexPairs(alerts).map(([index, alert]) => (
        <li key={alert.id} style={{ marginTop: index === 0 ? 0 : '0.5rem' }}>
          <Alert alert={alert} />
        </li>
      ))}
    </ul>
  );
};

interface AlertsIndicatorProps {
  style?: CSSProperties;
}

export const AlertsIndicator = (props: AlertsIndicatorProps): ReactNode => {
  const { style } = props;

  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);

  const alerts: AlertType[] = [
    ...useVersionAlerts(),
    ...useServiceAlerts(),
    ...useLinkExpirationAlerts(),
    ...useTermsOfServiceAlerts(),
  ];

  const previousAlertIds = usePrevious(_.map('id', alerts)) || [];
  const hasNewAlerts = _.size(_.difference(_.map('id', alerts), previousAlertIds)) > 0;

  const numAlerts = _.size(alerts);

  useEffect(() => {
    if (hasNewAlerts) {
      setAnimating(true);
    }
  }, [hasNewAlerts]);

  return (
    <>
      <PopupTrigger
        side='bottom'
        onChange={setOpen}
        content={
          <div style={{ padding: '0.5rem', width: 300, maxHeight: 'calc(100vh - 5rem)', overflowY: 'auto' }}>
            {_.size(alerts) > 0 ? <AlertsList alerts={alerts} /> : <p>No system alerts at this time.</p>}
          </div>
        }
      >
        <Clickable
          tagName='span'
          aria-expanded={open}
          aria-haspopup
          aria-label='System alerts'
          style={{
            ...style,
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 40,
            height: 40,
            borderRadius: 20,
            background: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          <Icon
            icon='bell'
            size={24}
            className={animating ? 'alert-indicator-ringing' : undefined}
            style={{ cursor: 'pointer' }}
            onAnimationEnd={() => setAnimating(false)}
          />
          <span
            style={{
              position: 'absolute',
              bottom: '-0.25rem',
              right: '-0.5rem',
              padding: '0.1rem 0.25rem',
              borderRadius: '0.5rem',
              background: colors.dark(),
              color: '#fff',
            }}
          >
            {numAlerts}
          </span>
        </Clickable>
      </PopupTrigger>
      {
        // Have screen readers announce alerts.
        alerts.map(({ id, title, message }) => (
          <div key={id} role='alert' className='sr-only'>
            <div>{title}</div>
            {!!message && <div>{message}</div>}
          </div>
        ))
      }
    </>
  );
};
