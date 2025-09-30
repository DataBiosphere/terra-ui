import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';

import { PipelineStringInput } from './PipelineStringInput';

jest.mock('src/pages/scientificServices/pipelines/utils/input-utils', () => ({
  INPUT_DESCRIPTIONS: {
    outputBasename: {
      label: 'Enter prefix for output file',
      placeholder: 'Enter prefix name',
      helpText: 'May only contain alphanumeric characters, dashes, and underscores.',
      validationRegex: '^[a-zA-Z0-9_-]+$',
    },
  },
}));

const mockInput: PipelineInput = {
  name: 'outputBasename',
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
      expect(screen.getByText('Enter prefix for output file')).toBeInTheDocument();
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
      expect(input).toHaveAttribute('placeholder', 'Enter prefix name');
    });

    it('renders help text', () => {
      render(<PipelineStringInput {...defaultProps} />);
      expect(
        screen.getByText('May only contain alphanumeric characters, dashes, and underscores.')
      ).toBeInTheDocument();
    });

    it('calls onValidation with undefined for valid input', async () => {
      const user = userEvent.setup();
      const onValidation = jest.fn();
      render(<PipelineStringInput {...defaultProps} onValidation={onValidation} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'valid_input-123');

      expect(onValidation).toHaveBeenCalledWith(undefined);
    });

    it('calls onValidation with error for invalid input', async () => {
      const user = userEvent.setup();
      const onValidation = jest.fn();
      render(<PipelineStringInput {...defaultProps} onValidation={onValidation} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'invalid input with spaces');

      expect(onValidation).toHaveBeenCalledWith('This input contains invalid characters');
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
      const user = userEvent.setup();
      const onValidation = jest.fn();
      const inputWithoutValidation = { ...mockInput, name: 'noValidationInput' };

      render(<PipelineStringInput {...defaultProps} input={inputWithoutValidation} onValidation={onValidation} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'you can type anything here! 123 @#$ !!!!');

      expect(onValidation).not.toHaveBeenCalled();
    });
  });
});
