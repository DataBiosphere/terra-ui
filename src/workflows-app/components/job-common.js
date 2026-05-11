import _ from 'lodash/fp';
import { div, h, h1, span } from 'react-hyperscript-helpers';
import { ButtonOutline, Link } from 'src/components/common';
import { breadcrumbHistoryCaret, collapseCromwellStatus as collapseCromwellStatusImpl, statusType as gcpStatusType } from 'src/components/job-common';
import { getLink, goToPath } from 'src/libs/nav';

export const statusType = gcpStatusType;

export const collapseCromwellStatus = (executionStatus, backendStatus) => collapseCromwellStatusImpl(executionStatus, backendStatus);

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
  const links = breadcrumbPathObjects.map(({ label, path, pathParams, queryParams }, index) => {
    const attributes = { key: `${_.kebabCase(label)}-breadcrumb-link` };
    let component;
    if (!_.isNil(path)) {
      attributes.href = getLink(path, pathParams, queryParams);
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
