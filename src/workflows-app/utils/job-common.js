import { isEmpty, kebabCase } from 'lodash';
import { div, h, h1 } from 'react-hyperscript-helpers';
import { ButtonOutline } from 'src/components/common';
import { Breadcrumbs } from 'src/components/job-common';
import { goToPath } from 'src/libs/nav';

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
