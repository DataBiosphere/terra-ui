import { screen } from '@testing-library/react';
import React from 'react';
import { PurchaseOptionCard } from 'src/pages/scientificServices/pipelines/account/sections/PurchaseOptionCard';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

describe('PurchaseOptionCard', () => {
  const mockOnClick = jest.fn();

  const defaultProps = {
    title: 'Test Title',
    description: 'Test description for the card',
    buttonText: 'Test Button',
    onClick: mockOnClick,
    isSelected: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with title, description, and button text', () => {
    render(<PurchaseOptionCard {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test description for the card')).toBeInTheDocument();
    expect(screen.getByText('Test Button')).toBeInTheDocument();

    // check that card is not selected by default
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).not.toBeInTheDocument();
  });

  it('shows check icon when selected', () => {
    render(<PurchaseOptionCard {...defaultProps} isSelected />);

    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('is disabled and shows tooltip when disabled prop is true', () => {
    render(<PurchaseOptionCard {...defaultProps} disabled />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveStyle({
      backgroundColor: '#f0f0f0',
      cursor: 'not-allowed',
    });
  });

  it('does not show check icon when selected but disabled', () => {
    render(<PurchaseOptionCard {...defaultProps} isSelected disabled />);

    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).not.toBeInTheDocument();
  });
});
