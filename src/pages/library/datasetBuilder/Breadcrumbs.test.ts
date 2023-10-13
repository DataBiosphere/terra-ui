import { screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { DatasetBuilderBreadcrumbs } from 'src/pages/library/datasetBuilder/Breadcrumbs';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

describe('Breadcrumbs', () => {
  it('renders a single breadcrumb', () => {
    // Arrange
    render(h(DatasetBuilderBreadcrumbs, { breadcrumbs: [{ title: 'a', link: '' }] }));
    // Assert
    expect(screen.getByText('a')).toBeTruthy();
  });

  it('renders multiple breadcrumb with only one slash', () => {
    // Arrange
    render(
      h(DatasetBuilderBreadcrumbs, {
        breadcrumbs: [
          { title: 'a', link: '' },
          { title: 'b', link: '' },
        ],
      })
    );
    // Assert
    expect(screen.getByText('a')).toBeTruthy();
    expect(screen.getByText('b')).toBeTruthy();
    expect(screen.getAllByText('/').length).toBe(1);
  });
});
