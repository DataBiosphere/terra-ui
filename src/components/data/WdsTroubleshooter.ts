import _ from 'lodash/fp';
import { ReactNode } from 'react';
import { div, h, table, tbody, td, tr } from 'react-hyperscript-helpers';
import { ClipboardButton } from 'src/components/ClipboardButton';
import { ButtonPrimary } from 'src/components/common';
import { icon } from 'src/components/icons';
import Modal from 'src/components/Modal';
import colors from 'src/libs/colors';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { useWdsStatus } from 'src/libs/wds-status';

export const WdsTroubleshooter = ({ onDismiss, workspaceId, mrgId }) => {
  const { status } = useWdsStatus({ workspaceId });

  const {
    numApps,
    appName,
    appStatus,
    proxyUrl,
    wdsResponsive,
    version,
    chartVersion,
    image,
    wdsStatus,
    wdsDbStatus,
    wdsPingStatus,
    wdsIamStatus,
    defaultInstanceExists,
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

  const troubleShooterRow = ([label, content, iconRunning, iconSuccess, element]: [
    string,
    string | null,
    boolean,
    boolean,
    ReactNode?
  ]) => {
    return tr({ key: label }, [
      td({ style: { fontWeight: 'bold' } }, [
        iconRunning ? checkIcon('running') : iconSuccess ? checkIcon('success') : checkIcon('failure'),
      ]),
      td({ style: { fontWeight: 'bold' } }, [label]),
      td([element || content]),
    ]);
  };

  // The proxyUrl is long and should be truncated,
  // so it gets it own special element
  const proxyElement = div({ style: _.merge({ width: '400px', float: 'left' }, Style.noWrapEllipsis) }, [proxyUrl]);

  /** For each piece of information we want to include in the troubleshooter, we want:
   * 1. A label
   * 2. The rendered information
   * 3. A function or variable that evaluates to boolean, determining whether the info/validation is still running
   * 4. A function or variable that evaluates to boolean, determining whether the info/validation is successful
   * 5. An optional element to use in place of the standard defined in troubleShooterRow
   * */
  const troubleShooterText: [string, string | null, boolean, boolean, ReactNode?][] = [
    ['Workspace Id', workspaceId, false, !!workspaceId],
    ['Resource Group Id', mrgId, false, !!mrgId],
    ['App listing', `${numApps} app(s) total`, numApps == null, !!numApps && numApps !== 'unknown'],
    ['Data app name', appName, appName === null, !!appName && appName !== 'unknown'],
    ['Data app running?', appStatus, appStatus == null, !!appStatus && appStatus !== 'unknown'],
    ['Data app proxy url', proxyUrl, proxyUrl == null, !!proxyUrl && proxyUrl !== 'unknown', proxyElement],
    ['Data app responding', `${wdsResponsive}`, wdsResponsive == null, !!wdsResponsive && wdsResponsive !== 'unknown'],
    ['Data app version', version, version == null, !!version && version !== 'unknown'],
    ['Data app chart version', chartVersion, chartVersion === null, !!chartVersion && chartVersion !== 'unknown'],
    ['Data app image', _.flow(_.split('/'), _.last)(image), image === null, !!image && image !== 'unknown'],
    [
      'Data app status',
      wdsStatus,
      wdsStatus == null,
      !!wdsStatus && wdsStatus !== 'unresponsive' && wdsStatus !== 'DOWN',
    ],
    [
      'Data app DB status',
      wdsDbStatus,
      wdsDbStatus == null,
      !!wdsDbStatus && wdsDbStatus !== 'unknown' && wdsDbStatus !== 'DOWN',
    ],
    [
      'Data app ping status',
      wdsPingStatus,
      wdsPingStatus == null,
      !!wdsPingStatus && wdsPingStatus !== 'unknown' && wdsPingStatus !== 'DOWN',
    ],
    [
      'Data app IAM status',
      wdsIamStatus,
      wdsIamStatus == null,
      !!wdsIamStatus && wdsIamStatus !== 'unknown' && wdsIamStatus !== 'DOWN',
    ],
    [
      'Default Instance exists',
      `${defaultInstanceExists}`,
      defaultInstanceExists == null,
      !!defaultInstanceExists && defaultInstanceExists !== 'unknown',
    ],
  ];

  const tableRows = troubleShooterText.map((x) => troubleShooterRow(x));

  return h(
    Modal,
    {
      showCancel: false,
      onDismiss,
      title: 'Data Table Status',
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
        div({ style: { marginTop: '1rem' } }, [
          'Please copy this information and email support@terra.bio to troubleshoot the error with your data tables.',
          // @ts-expect-error
          h(ClipboardButton, {
            'aria-label': 'Copy troubleshooting info to clipboard',
            style: { marginLeft: '1rem' },
            text: troubleShooterText.map((x) => x.slice(0, 2)).join('\n'),
          }),
        ]),
      ]),
    ]
  );
};
