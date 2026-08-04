import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';

import { PipelineStringInput } from './PipelineStringInput';

const mockInput: PipelineInput = {
  name: 'outputBasename',
  displayName: 'output basename',
  description: 'May only contain alphanumeric characters, dashes, and underscores.',
  type: 'STRING',
  isRequired: true,
};

const optionalInput: PipelineInput = {
  name: 'favoriteCat',
  type: 'STRING',
  isRequired: false,
};

describe('PipelineStringInput', () => {
  const defaultProps = {
    input: mockInput,
    value: '',
    onChange: jest.fn(),
    onValidation: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PipelineStringInput', () => {
    it('renders input label', () => {
      render(<PipelineStringInput {...defaultProps} />);
      expect(screen.getByText('Enter output basename')).toBeInTheDocument();
    });

    it('shows required indicator for required inputs', () => {
      render(<PipelineStringInput {...defaultProps} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('does not show required indicator for optional inputs', () => {
      render(<PipelineStringInput {...defaultProps} input={optionalInput} />);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('renders input placeholder', () => {
      render(<PipelineStringInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'Enter output basename');
    });

    it('renders help text', () => {
      render(<PipelineStringInput {...defaultProps} />);
      expect(
        screen.getByText('May only contain alphanumeric characters, dashes, and underscores.')
      ).toBeInTheDocument();
    });

    it('calls onValidation with undefined for valid input', async () => {
      render(<PipelineStringInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'valid_input-123' } });

      expect(defaultProps.onChange).toHaveBeenCalledWith('valid_input-123');
      expect(defaultProps.onValidation).toHaveBeenCalledWith(undefined);
    });

    it('calls onValidation with error for invalid input', async () => {
      render(<PipelineStringInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'invalid input with spaces' } });

      expect(defaultProps.onChange).toHaveBeenCalledWith('invalid input with spaces');
      expect(defaultProps.onValidation).toHaveBeenCalledWith('This input contains invalid characters');
    });

    it('does not validate empty input', async () => {
      const user = userEvent.setup();
      const onValidation = jest.fn();
      render(<PipelineStringInput {...defaultProps} onValidation={onValidation} />);

      const input = screen.getByRole('textbox');
      await user.clear(input);

      expect(onValidation).not.toHaveBeenCalled();
    });

    it('does not perform validation when no validationRegex is provided', async () => {
      const onValidation = jest.fn();
      const inputWithoutValidation = { ...mockInput, name: 'noValidationInput' };

      render(<PipelineStringInput {...defaultProps} input={inputWithoutValidation} onValidation={onValidation} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'type whatever you want! go nuts! $%^&#*(@' } });

      expect(defaultProps.onValidation).not.toHaveBeenCalled();
    });

    it('trims input value before validation', async () => {
      render(<PipelineStringInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: ' validInput ' } });

      expect(defaultProps.onChange).toHaveBeenCalledWith(' validInput ');
      expect(defaultProps.onValidation).toHaveBeenCalledWith(undefined);
    });

    it('renders input as disabled when disabled prop is true', () => {
      render(<PipelineStringInput {...defaultProps} disabled />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('renders input as enabled when disabled prop is false', () => {
      render(<PipelineStringInput {...defaultProps} disabled={false} />);

      const input = screen.getByRole('textbox');
      expect(input).not.toBeDisabled();
    });

    it('renders input as enabled when disabled prop is not provided', () => {
      render(<PipelineStringInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      expect(input).not.toBeDisabled();
    });
  });
});
