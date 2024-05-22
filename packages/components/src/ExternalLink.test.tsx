import { screen } from '@testing-library/react';

import { ExternalLink } from './ExternalLink';
import { renderWithTheme as render } from './internal/test-utils';

describe('ExternalLink', () => {
  it('renders a link with target and rel attributes', () => {
    // Act
    render(<ExternalLink href='https://example.com'>Example</ExternalLink>);

    // Assert
    const anchor = screen.getByRole('link');
    expect(anchor).toHaveAttribute('href', 'https://example.com');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('can include referrer', () => {
    // Act
    render(
      <ExternalLink href='https://example.com' includeReferrer>
        Example
      </ExternalLink>
    );

    // Assert
    const anchor = screen.getByRole('link');
    expect(anchor).toHaveAttribute('href', 'https://example.com');
    expect(anchor).toHaveAttribute('target', '_blank');
    expect(anchor).toHaveAttribute('rel', 'noopener');
  });

  it('renders an icon', () => {
    // Act
    const { container } = render(<ExternalLink href='https://example.com'>Example</ExternalLink>);

    // Assert
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('data-icon', 'pop-out');
  });
});
