import _ from 'lodash/fp';
import { div, h, h1, span } from 'react-hyperscript-helpers';
import { ButtonOutline, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { breadcrumbHistoryCaret, statusType as gcpStatusType } from 'src/components/job-common';
import colors from 'src/libs/colors';
import { goToPath } from 'src/libs/nav';

const iconSize = 18;

export const statusType = {
  ...gcpStatusType,
  paused: {
    id: 'paused', // Must match variable name for collection unpacking.
    label: () => 'Paused',
    icon: (style) => icon('pause', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  canceled: {
    id: 'canceled', // Must match variable name for collection unpacking.
    label: () => 'Canceled',
    icon: (style) => icon('warning-standard', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  queued: {
    id: 'queued', // Must match variable name for collection unpacking.
    label: () => 'Queued',
    icon: (style) => icon('clock', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  initializing: {
    id: 'initializing', // Must match variable name for collection unpacking.
    label: () => 'Initializing',
    icon: (style) => icon('sync', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  canceling: {
    id: 'canceling', // Must match variable name for collection unpacking.
    label: () => 'Canceling',
    icon: (style) => icon('sync', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  waitingForGCPQuota: {
    id: 'waitingForGCPQuota', // Must match variable name for collection unpacking.
    label: () => 'Submitted, Awaiting Cloud Quota',
    icon: (style) => icon('error-standard', { size: iconSize, style: { color: colors.warning(), ...style } }),
    moreInfoLink: 'https://support.terra.bio/hc/en-us/articles/360029071251',
    moreInfoLabel: 'Learn more about cloud quota',
    tooltip: 'Delayed by Google Cloud Platform (GCP) quota limits. Contact Terra Support to request a quota increase.',
  },
  aborted: {
    id: 'aborted', // Must match variable name for collection unpacking.
    label: () => 'Aborted',
    icon: (style) => icon('error-standard', { size: iconSize, style: { color: colors.warning(), ...style } }),
  },
  retryableFailure: {
    id: 'retryableFailure', // Must match variable name for collection unpacking.
    label: () => 'Retryable Failure',
    icon: (style) => icon('error-standard', { size: iconSize, style: { color: colors.warning(), ...style } }),
  },
  waitingForCromwellQuota: {
    id: 'waitingForCromwellQuota', // Must match variable name for collection unpacking.
    label: () => 'Submitted, Awaiting Cromwell Quota',
    icon: (style) => icon('clock', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
};

/**
 * Collapses Cromwell status, taking into account both execution and backend status values.
 *
 * @param {string} executionStatus from metadata
 * @param {string} backendStatus from metadata
 * @returns {Object} one of:
 *  `statusType.succeeded`, `statusType.aborted, `statusType.failed`, `statusType.retryableFailure`,
 *  `statusType.waitingForGCPQuota`, `statusType.waitingForCromwellQuota`, or `statusType.unknown`
 */
export const collapseCromwellStatus = (executionStatus, backendStatus) => {
  switch (executionStatus) {
    case 'Done':
      return statusType.succeeded;
    case 'Aborting':
    case 'Aborted':
      return statusType.aborted;
    case 'Failed':
    case 'Unstartable':
      return statusType.failed;
    case 'RetryableFailure':
      return statusType.retryableFailure;
    case 'NotStarted':
    case 'WaitingForQueueSpace':
    case 'QueuedInCromwell':
    case 'Starting':
      return statusType.waitingForCromwellQuota;
    case 'Running':
    case 'Bypassed':
      return backendStatus === 'AwaitingCloudQuota' ? statusType.waitingForGCPQuota : statusType.running;
    default:
      return statusType.unknown;
  }
};

export const SubmitNewWorkflowButton = ({ name, namespace }) =>
  h(
    ButtonOutline,
    {
      onClick: () => goToPath('workspace-workflows-app', { name, namespace }),
    },
    ['Submit a new workflow']
  );

export const PageHeader = ({ breadcrumbPathObjects, title }) => {
  const pageId = _.kebabCase(title);
  return div({ id: `${pageId}-header-container` }, [
    h1(
      {
        /* Make adjustments if needed */
      },
      [title]
    ),
    h(Breadcrumbs, { isRendered: !_.isEmpty(breadcrumbPathObjects), breadcrumbPathObjects, pageId }),
  ]);
};

export const Breadcrumbs = ({ breadcrumbPathObjects, pageId }) => {
  const links = breadcrumbPathObjects.map(({ label, path, params }, index) => {
    const attributes = { key: `${_.kebabCase(label)}-breadcrumb-link` };
    let component;
    if (!_.isNil(path)) {
      attributes.onClick = () => goToPath(path, params);
      component = h(Link, { ...attributes }, [label]);
    } else {
      component = span({ ...attributes }, [label]);
    }

    const children = [component];

    if (index < breadcrumbPathObjects.length - 1) {
      children.push(breadcrumbHistoryCaret);
    }

    return span({ key: `${_.kebabCase(label)}-breadcrumb-link` }, children);
  });

  return div({ id: `${pageId}-breadcrumbs-container` }, links);
};

export const HeaderSection = ({ title, breadcrumbPathObjects, button }) => {
  return div({ id: 'header-section', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
    h(PageHeader, { breadcrumbPathObjects, title }),
    button,
  ]);
};
