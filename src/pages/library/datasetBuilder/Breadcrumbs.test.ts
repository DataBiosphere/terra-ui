import { render } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { DatasetBuilderBreadcrumbs } from 'src/pages/library/datasetBuilder/Breadcrumbs';

describe('Breadcrumbs', () => {
  it('renders a single breadcrumb', () => {
    const { getByText } = render(h(DatasetBuilderBreadcrumbs, { breadcrumbs: [{ title: 'a', link: '' }] }));

    expect(getByText('a')).toBeTruthy();
  });

  it('renders multiple breadcrumb with only one slash', () => {
    const { getByText, getAllByText } = render(
      h(DatasetBuilderBreadcrumbs, {
        breadcrumbs: [
          { title: 'a', link: '' },
          { title: 'b', link: '' },
        ],
      })
    );

    expect(getByText('a')).toBeTruthy();
    expect(getByText('b')).toBeTruthy();
    expect(getAllByText('/').length).toBe(1);
  });
});
