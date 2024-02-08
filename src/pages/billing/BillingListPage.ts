import { div, h } from 'react-hyperscript-helpers';
import { BillingList } from 'src/billing/List/BillingList';
import FooterWrapper from 'src/components/FooterWrapper';
import TopBar from 'src/components/TopBar';
import * as Nav from 'src/libs/nav';
import * as Style from 'src/libs/style';

interface BillingListPageProps {
  queryParams: {
    selectedName: string | undefined;
  };
}

const BillingListPage = (props: BillingListPageProps) => {
  const selectedName = props.queryParams.selectedName;
  const breadcrumbs = 'Billing > Billing Project';

  return h(FooterWrapper, { fixedHeight: true }, [
    h(TopBar, { title: 'Billing', href: Nav.getLink('billing') }, [
      !!selectedName &&
        div({ style: Style.breadcrumb.breadcrumb }, [
          div({ style: Style.noWrapEllipsis }, [breadcrumbs]),
          div({ style: Style.breadcrumb.textUnderBreadcrumb }, [selectedName]),
        ]),
    ]),
    h(BillingList, { queryParams: { selectedName } }),
  ]);
};

export const navPaths = [
  {
    name: 'billing',
    path: '/billing',
    component: BillingListPage,
    title: 'Billing',
  },
];
