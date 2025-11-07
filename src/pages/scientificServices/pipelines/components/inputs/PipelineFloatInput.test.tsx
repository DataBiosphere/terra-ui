import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';

import { PipelineFloatInput, validatePipelineFloatInput } from './PipelineFloatInput';

const mockInput: PipelineInput = {
  name: 'floatInput',
  type: 'FLOAT',
  isRequired: true,
  description: 'Must be a valid floating-point number.',
  displayName: 'float input',
  defaultValue: '0.0',
  minValue: 0,
  maxValue: 1,
};

const optionalInput: PipelineInput = {
  name: 'optionalFloatInput',
  type: 'FLOAT',
  isRequired: false,
};

describe('PipelineFloatInput', () => {
  const defaultProps = {
    input: mockInput,
    value: '',
    onChange: jest.fn(),
    onValidation: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input label with displayName when present', () => {
    render(<PipelineFloatInput {...defaultProps} />);
    expect(screen.getByText('Enter float input')).toBeInTheDocument();
  });

  it('renders input label with name when displayName is absent', () => {
    render(<PipelineFloatInput {...defaultProps} input={{ ...mockInput, displayName: undefined }} />);
    expect(screen.getByText('Enter floatInput')).toBeInTheDocument();
  });

  it('shows required indicator for required inputs', () => {
    render(<PipelineFloatInput {...defaultProps} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show required indicator for optional inputs', () => {
    render(<PipelineFloatInput {...defaultProps} input={optionalInput} />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders input placeholder with defaultValue when present', () => {
    render(<PipelineFloatInput {...defaultProps} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', '0.0');
  });

  it('renders input placeholder with text when defaultValue is absent', () => {
    render(<PipelineFloatInput {...defaultProps} input={{ ...mockInput, defaultValue: undefined }} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter float input');
  });

  it('renders help text', () => {
    render(<PipelineFloatInput {...defaultProps} />);
    expect(screen.getByText('Must be a valid floating-point number.')).toBeInTheDocument();
  });

  it('calls onValidation with undefined for valid float input', async () => {
    render(<PipelineFloatInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '0.5' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('0.5');
    expect(defaultProps.onValidation).toHaveBeenCalledWith(undefined);
  });

  it('calls onValidation with undefined for valid float input without starting 0', async () => {
    render(<PipelineFloatInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '.5' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('.5');
    expect(defaultProps.onValidation).toHaveBeenCalledWith(undefined);
  });

  it('calls onValidation with undefined for valid input ending in .', async () => {
    render(<PipelineFloatInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '0.' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('0.');
    expect(defaultProps.onValidation).toHaveBeenCalledWith(undefined);
  });

  it('calls onValidation with error for float input out of range', async () => {
    render(<PipelineFloatInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '10' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('10');
    expect(defaultProps.onValidation).toHaveBeenCalledWith('Value must be between 0 and 1');
  });

  it('calls onValidation with error for . input', async () => {
    render(<PipelineFloatInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '.' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('.');
    expect(defaultProps.onValidation).toHaveBeenCalledWith('Enter a valid float value');
  });

  it('calls onValidation with error for negative float input out of range', async () => {
    render(<PipelineFloatInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '-0.1' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('-0.1');
    expect(defaultProps.onValidation).toHaveBeenCalledWith('Value must be between 0 and 1');
  });

  it('does not validate empty input', async () => {
    const user = userEvent.setup();
    const onValidation = jest.fn();
    render(<PipelineFloatInput {...defaultProps} onValidation={onValidation} />);

    const input = screen.getByRole('textbox');
    await user.clear(input);

    expect(onValidation).not.toHaveBeenCalled();
  });

  describe('validatePipelineFloatInput', () => {
    it('returns undefined for empty input', () => {
      expect(validatePipelineFloatInput('', 0, 1)).toBeUndefined();
    });

    it('returns error for non-numeric input', () => {
      expect(validatePipelineFloatInput('abc', 0, 1)).toBe('Enter a valid float value');
    });

    it('returns error for input below minValue', () => {
      expect(validatePipelineFloatInput('-1', 0, 1)).toBe('Value must be between 0 and 1');
    });

    it('returns error for input above maxValue', () => {
      expect(validatePipelineFloatInput('2', 0, 1)).toBe('Value must be between 0 and 1');
    });

    it('returns undefined for valid input within range', () => {
      expect(validatePipelineFloatInput('0.5', 0, 1)).toBeUndefined();
    });

    it('returns undefined for valid input when min/max are undefined', () => {
      expect(validatePipelineFloatInput('100')).toBeUndefined();
    });

    it('returns error for input below minValue when only minValue is defined', () => {
      expect(validatePipelineFloatInput('-10', 0)).toBe('Value must be between 0 and undefined');
    });

    it('returns error for input above maxValue when only maxValue is defined', () => {
      expect(validatePipelineFloatInput('10', undefined, 5)).toBe('Value must be between undefined and 5');
    });
  });
});
