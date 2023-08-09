import { isEmpty, isNil, kebabCase } from 'lodash';
import { div, h, h1, span } from 'react-hyperscript-helpers';
import { ButtonOutline, Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { breadcrumbHistoryCaret } from 'src/components/job-common';
import colors from 'src/libs/colors';
import { goToPath } from 'src/libs/nav';

const iconSize = 24;

export const cbasStatusTypes = {
  aborted: {
    id: 'aborted', // Must match variable name for collection unpacking.
    label: () => 'Aborted',
    icon: (style) => icon('error-standard', { size: iconSize, style: { color: colors.warning(), ...style } }),
  },
  initializing: {
    id: 'initializing', // Must match variable name for collection unpacking.
    label: () => 'Initializing',
    icon: (style) => icon('sync', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  canceled: {
    id: 'canceled', // Must match variable name for collection unpacking.
    label: () => 'Canceled',
    icon: (style) => icon('warning-standard', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  canceling: {
    id: 'canceling', // Must match variable name for collection unpacking.
    label: () => 'Canceling',
    icon: (style) => icon('sync', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  paused: {
    id: 'paused', // Must match variable name for collection unpacking.
    label: () => 'Paused',
    icon: (style) => icon('pause', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  queued: {
    id: 'queued', // Must match variable name for collection unpacking.
    label: () => 'Queued',
    icon: (style) => icon('clock', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  succeeded: {
    id: 'succeeded', // Must match variable name for collection unpacking.
    label: () => 'Succeeded',
    icon: (style) => icon('check', { size: iconSize, style: { color: colors.success(), ...style } }),
  },
  failed: {
    id: 'failed', // Must match variable name for collection unpacking.
    label: () => 'Failed',
    icon: (style) => icon('warning-standard', { size: iconSize, style: { color: colors.danger(), ...style } }),
  },
  running: {
    id: 'running', // Must match variable name for collection unpacking.
    label: () => 'Running',
    icon: (style) => icon('sync', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  submitted: {
    id: 'submitted', // Must match variable name for collection unpacking.
    label: () => 'Submitted',
    icon: (style) => icon('clock', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  waitingForQuota: {
    id: 'waitingForQuota', // Must match variable name for collection unpacking.
    label: () => 'Submitted, Awaiting Cloud Quota',
    icon: (style) => icon('error-standard', { size: iconSize, style: { color: colors.warning(), ...style } }),
    moreInfoLink: 'https://support.terra.bio/hc/en-us/articles/360029071251',
    moreInfoLabel: 'Learn more about cloud quota',
    tooltip: 'Delayed by Google Cloud Platform (GCP) quota limits. Contact Terra Support to request a quota increase.',
  },
  unknown: {
    id: 'unknown', // Must match variable name for collection unpacking.
    label: (executionStatus) => `Unexpected status (${executionStatus})`,
    icon: (style) => icon('question', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
};

export const SubmitNewWorkflowButton = h(
  ButtonOutline,
  {
    onClick: () => goToPath('root'),
  },
  ['Submit a new workflow']
);

export const PageHeader = ({ breadcrumbPathObjects, title }) => {
  const pageId = kebabCase(title);
  return div({ id: `${pageId}-header-container` }, [
    h1(
      {
        /* Make adjustments if needed */
      },
      [title]
    ),
    h(Breadcrumbs, { isRendered: !isEmpty(breadcrumbPathObjects), breadcrumbPathObjects, pageId }),
  ]);
};

export const HeaderSection = ({ title, breadcrumbPathObjects, button }) => {
  return div({ id: 'header-section', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
    h(PageHeader, { breadcrumbPathObjects, title }),
    button,
  ]);
};

export const Breadcrumbs = ({ breadcrumbPathObjects, pageId }) => {
  const links = breadcrumbPathObjects.map(({ label, path, params }, index) => {
    const attributes = { key: `${kebabCase(label)}-breadcrumb-link` };
    let component;
    if (!isNil(path)) {
      attributes.onClick = () => goToPath(path, params);
      component = h(Link, { ...attributes }, [label]);
    } else {
      component = span({ ...attributes }, [label]);
    }

    const children = [component];

    if (index < breadcrumbPathObjects.length - 1) {
      children.push(breadcrumbHistoryCaret);
    }

    return span({ key: `${kebabCase(label)}-breadcrumb-link` }, children);
  });

  return div({ id: `${pageId}-breadcrumbs-container` }, links);
};
