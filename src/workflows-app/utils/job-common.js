import { isEmpty, kebabCase } from 'lodash';
import { div, h, h1 } from 'react-hyperscript-helpers';
import { ButtonOutline } from 'src/components/common';
import { icon } from 'src/components/icons';
import { Breadcrumbs } from 'src/components/job-common';
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
