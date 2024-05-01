import { render } from '@testing-library/react';

import { Icon } from './Icon';

describe('Icon', () => {
  it('renders an SVG element with a data attribute', () => {
    // Act
    render(<Icon icon="bell" />);

    // Assert
    const svg = document.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('data-icon', 'bell');
  });

  it('sets aria-hidden to true when no label is provided', () => {
    // Act
    render(<Icon icon="bell" />);

    // Assert
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('sets aria-hidden to false when a label is provided', () => {
    // Act
    render(<Icon icon="bell" aria-label="Notice" />);

    // Assert
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'false');
  });
});
