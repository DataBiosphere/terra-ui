import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { EmailSelect } from './EmailSelect';

describe('EmailSelect', () => {
  const defaultProps = {
    label: 'User emails',
    placeholder: 'Type or select user emails',
    setEmails: jest.fn(),
    emails: [],
  };

  it('renders the component with default props', () => {
    // Arrange
    render(<EmailSelect {...defaultProps} />);

    // Act
    const input = screen.getByLabelText(defaultProps.placeholder);
    const label = screen.getByText('User emails *');

    // Assert
    expect(input).toBeInTheDocument();
    expect(label).toBeInTheDocument();
  });

  it('calls setEmails when an email is entered', () => {
    // Arrange
    render(<EmailSelect {...defaultProps} />);
    const input = screen.getByLabelText(defaultProps.placeholder);

    // Act
    fireEvent.change(input, { target: { value: 'test2@example.com' } });

    // Assert
    expect(defaultProps.setEmails).toHaveBeenCalledWith(['test2@example.com']);
  });

  it('divides emails by comma', () => {
    // Arrange
    render(<EmailSelect {...defaultProps} />);
    const input = screen.getByLabelText(defaultProps.placeholder);

    // Act
    fireEvent.change(input, { target: { value: 'test2@example.com,test1@example.com' } });

    // Assert
    expect(defaultProps.setEmails).toHaveBeenCalledWith(['test2@example.com', 'test1@example.com']);
  });
});
