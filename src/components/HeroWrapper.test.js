import { act, screen, within } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { HeroWrapper } from 'src/components/HeroWrapper';
import { getEnabledBrand } from 'src/libs/brand-utils';
import { brands } from 'src/libs/brands';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

jest.mock('src/libs/brand-utils', () => ({
  ...jest.requireActual('src/libs/brand-utils'),
  // colors.js reads the enabled brand at module load, so return a brand by default.
  getEnabledBrand: jest.fn(() => jest.requireActual('src/libs/brands').brands.terra),
}));

jest.mock('src/libs/nav', () => ({
  ...jest.requireActual('src/libs/nav'),
  getCurrentUrl: jest.fn().mockReturnValue(new URL('https://app.terra.bio')),
  getLink: jest.fn().mockImplementation((_) => _),
}));

describe('HeroWrapper', () => {
  it('shows the brand notice in a box when the brand has one', async () => {
    // Arrange
    getEnabledBrand.mockReturnValue(brands.bioDataCatalyst);

    // Act
    await act(async () => {
      render(h(HeroWrapper));
    });

    // Assert
    const notice = screen.getByRole('note', { name: 'Notice' });
    expect(notice).toHaveTextContent('NIH Websites Are Changing:');
    expect(notice).toHaveTextContent('“Super Intelligence” (SI) in place of “Artificial Intelligence” (AI)');
    expect(within(notice).getByRole('link', { name: 'Executive Order 14434' })).toHaveAttribute(
      'href',
      'https://www.whitehouse.gov/presidential-actions/2026/09/inaugurating-the-era-of-super-intelligence/'
    );
  });

  it('shows no notice when the brand has none', async () => {
    // Arrange
    getEnabledBrand.mockReturnValue(brands.terra);

    // Act
    await act(async () => {
      render(h(HeroWrapper));
    });

    // Assert
    expect(screen.queryByRole('note', { name: 'Notice' })).not.toBeInTheDocument();
  });
});
