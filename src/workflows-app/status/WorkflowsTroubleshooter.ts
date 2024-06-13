import { Modal } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { div, h, table, tbody, td, tr } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { ButtonPrimary, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';

import { useWorkflowsStatus } from './workflows-status';

export const WorkflowsTroubleshooter = ({ onDismiss, workspaceId, mrgId, tenantId, subscriptionId }) => {
  const { status } = useWorkflowsStatus({ workspaceId });

  const {
    totalVisibleApps,
    workflowsAppName,
    workflowsAppStatus,
    cromwellRunnerAppName,
    cromwellRunnerAppStatus,
    cbasProxyUrl,
    cromwellReaderProxyUrl,
    cromwellRunnerProxyUrl,
    cbasResponsive,
    cbasCromwellConnection,
    cbasEcmConnection,
    cbasSamConnection,
    cbasLeonardoConnection,
    cromwellReaderResponsive,
    cromwellReaderDatabaseConnection,
    cromwellRunnerResponsive,
    cromwellRunnerDatabaseConnection,
  } = status;

  const checkIcon = (status, size = 24) =>
    Utils.switchCase(
      status,
      [
        'success',
        () =>
          icon('success-standard', { size, style: { color: colors.success() }, 'aria-label': 'Validation Success' }),
      ],
      [
        'failure',
        () =>
          icon('error-standard', { size, style: { color: colors.danger(0.85) }, 'aria-label': 'Validation Failure' }),
      ],
      [
        'running',
        () => icon('loadingSpinner', { size, style: { color: colors.primary() }, 'aria-label': 'Validation Running' }),
      ]
    );

  const iconFromBooleans = (iconRunning, iconSuccess) => {
    if (iconRunning) {
      return checkIcon('running');
    }
    if (iconSuccess) {
      return checkIcon('success');
    }
    return checkIcon('failure');
  };

  const troubleShooterRow = ([label, content, iconRunning, iconSuccess, element]: [
    string,
    string | null,
    boolean,
    boolean,
    ReactNode?
  ]) => {
    return tr({ key: label }, [
      td({ style: { fontWeight: 'bold' } }, [iconFromBooleans(iconRunning, iconSuccess)]),
      td({ style: { fontWeight: 'bold', whiteSpace: 'nowrap' } }, [label]),
      td([element || content]),
      td([
        h(ClipboardButton, {
          text: content ?? '',
          style: { marginLeft: '0.5rem' },
          onClick: (e) => e.stopPropagation(), // this stops the collapse when copying
        }),
      ]),
    ]);
  };

  // The proxyUrl is long and should be truncated,
  // so it gets it own special element
  const proxyElement = (proxyUrl) =>
    div({ style: _.merge({ width: '400px', float: 'left' }, Style.noWrapEllipsis) }, [proxyUrl]);

  const subscriptionLinkElement =
    mrgId && tenantId && subscriptionId
      ? h(
          Link,
          {
            href: `https://portal.azure.com/#@${tenantId}}/resource/subscriptions/${subscriptionId}/overview`,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          [subscriptionId, ' ', icon('pop-out')]
        )
      : subscriptionId;
  const mrgLinkElement =
    mrgId && tenantId && subscriptionId
      ? h(
          Link,
          {
            href: `https://portal.azure.com/#@${tenantId}}/resource/subscriptions/${subscriptionId}/resourceGroups/${mrgId}/overview`,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          [mrgId, ' ', icon('pop-out')]
        )
      : null;

  /** For each piece of information we want to include in the troubleshooter, we want:
   * 1. A label
   * 2. The rendered information
   * 3. A function or variable that evaluates to boolean, determining whether the info/validation is still running
   * 4. A function or variable that evaluates to boolean, determining whether the info/validation is successful
   * 5. An optional element to use in place of the standard defined in troubleShooterRow
   * */
  const troubleShooterText: [string, string | null, boolean, boolean, ReactNode?][] = [
    ['Workspace Id', workspaceId, false, !!workspaceId],
    ['Tenant Id', tenantId, false, !!tenantId],
    ['Subscription Id', subscriptionId, false, !!subscriptionId, subscriptionLinkElement],
    ['Resource Group Id', mrgId, false, !!mrgId, mrgLinkElement],
    [
      'Total apps visible',
      totalVisibleApps,
      totalVisibleApps === null,
      !!totalVisibleApps && totalVisibleApps !== 'unknown',
    ],

    [
      'Workflows app name',
      workflowsAppName,
      workflowsAppName === null,
      !!workflowsAppName && workflowsAppName !== 'unknown',
    ],
    [
      'Workflows app status',
      workflowsAppStatus,
      workflowsAppStatus == null,
      !!workflowsAppStatus && workflowsAppStatus !== 'unknown' && workflowsAppStatus !== 'ERROR',
    ],
    [
      'Cromwell runner app name',
      cromwellRunnerAppName,
      cromwellRunnerAppName === null,
      !!cromwellRunnerAppName && cromwellRunnerAppName !== 'unknown',
    ],
    [
      'Cromwell runner app status',
      cromwellRunnerAppStatus,
      cromwellRunnerAppStatus == null,
      !!cromwellRunnerAppStatus && cromwellRunnerAppStatus !== 'unknown' && cromwellRunnerAppStatus !== 'ERROR',
    ],
    [
      'CBAS proxy url',
      cbasProxyUrl,
      cbasProxyUrl == null,
      !!cbasProxyUrl && cbasProxyUrl !== 'unknown',
      proxyElement(cbasProxyUrl),
    ],
    [
      'Cromwell reader proxy url',
      cromwellReaderProxyUrl,
      cromwellReaderProxyUrl == null,
      !!cromwellReaderProxyUrl && cromwellReaderProxyUrl !== 'unknown',
      proxyElement(cromwellReaderProxyUrl),
    ],
    [
      'Cromwell runner proxy url',
      cromwellRunnerProxyUrl,
      cromwellRunnerProxyUrl == null,
      !!cromwellRunnerProxyUrl && cromwellRunnerProxyUrl !== 'unknown',
      proxyElement(cromwellRunnerProxyUrl),
    ],
    ['CBAS responsive', cbasResponsive, cbasResponsive == null, cbasResponsive === 'true'],
    ['CBAS / Cromwell link', cbasCromwellConnection, cbasCromwellConnection == null, cbasCromwellConnection === 'true'],
    ['CBAS / ECM link', cbasEcmConnection, cbasEcmConnection == null, cbasEcmConnection === 'true'],
    ['CBAS / SAM link', cbasSamConnection, cbasSamConnection == null, cbasSamConnection === 'true'],
    ['CBAS / Leonardo link', cbasLeonardoConnection, cbasLeonardoConnection == null, cbasLeonardoConnection === 'true'],
    [
      'Cromwell reader responsive',
      cromwellReaderResponsive,
      cromwellReaderResponsive == null,
      cromwellReaderResponsive === 'true',
    ],
    [
      'Cromwell reader database',
      cromwellReaderDatabaseConnection,
      cromwellReaderDatabaseConnection == null,
      cromwellReaderDatabaseConnection === 'true',
    ],
    [
      'Cromwell runner responsive',
      cromwellRunnerResponsive,
      cromwellRunnerResponsive == null,
      cromwellRunnerResponsive === 'true',
    ],
    [
      'Cromwell runner database',
      cromwellRunnerDatabaseConnection,
      cromwellRunnerDatabaseConnection == null,
      cromwellRunnerDatabaseConnection === 'true',
    ],
  ];

  const tableRows = troubleShooterText.map((x) => troubleShooterRow(x));

  return h(
    Modal,
    {
      showCancel: false,
      onDismiss,
      title: 'Workflows Status',
      width: '55rem',
      okButton: h(
        ButtonPrimary,
        {
          tooltip: 'Close',
          onClick: onDismiss,
        },
        ['Close']
      ),
    },
    [
      div({ style: { padding: '1rem 0.5rem', lineHeight: '1.4rem' } }, [
        table({ style: { borderSpacing: '1rem 0', borderCollapse: 'separate' } }, [tbody([tableRows])]),
      ]),
    ]
  );
};
