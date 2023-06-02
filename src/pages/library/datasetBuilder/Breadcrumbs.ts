import _ from 'lodash/fp';
import { Fragment } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import * as Utils from 'src/libs/utils';

// This is a new pattern that design wants us to introduce instead of the current breadcrumb pattern used in the headers
interface Breadcrumb {
  title: string;
  link: string;
}

export const DatasetBuilderBreadcrumbs = ({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) =>
  div({ style: { display: 'flex' } }, [
    _.map(
      ([i, breadcrumb]) =>
        h(Fragment, { key: i }, [
          h(Link, { href: breadcrumb.link }, [breadcrumb.title]),
          i < breadcrumbs.length - 1 && div({ style: { margin: '0 5px' } }, ['/']),
        ]),
      Utils.toIndexPairs(breadcrumbs)
    ),
  ]);
