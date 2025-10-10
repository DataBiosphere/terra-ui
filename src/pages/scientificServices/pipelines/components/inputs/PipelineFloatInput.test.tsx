import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';

import { PipelineFloatInput } from './PipelineFloatInput';

jest.mock('src/pages/scientificServices/pipelines/utils/pipeline-input-utils', () => ({
  INPUT_DESCRIPTIONS: {
    floatInput: {
      label: 'Enter a float value',
      placeholder: 'Enter a number',
      helpText: 'Must be a valid floating-point number.',
      validationRegex: String.raw`^(0(\.\d*)?|1(\.0*)?|\.\d+)$`,
    },
  },
}));

const mockInput: PipelineInput = {
  name: 'floatInput',
  type: 'FLOAT',
  isRequired: true,
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

  it('renders input label', () => {
    render(<PipelineFloatInput {...defaultProps} />);
    expect(screen.getByText('Enter a float value')).toBeInTheDocument();
  });

  it('shows required indicator for required inputs', () => {
    render(<PipelineFloatInput {...defaultProps} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does not show required indicator for optional inputs', () => {
    render(<PipelineFloatInput {...defaultProps} input={optionalInput} />);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders input placeholder', () => {
    render(<PipelineFloatInput {...defaultProps} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter a number');
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
    expect(defaultProps.onValidation).toHaveBeenCalledWith('Invalid float value');
  });

  it('calls onValidation with error for . input', async () => {
    render(<PipelineFloatInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '.' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('.');
    expect(defaultProps.onValidation).toHaveBeenCalledWith('Invalid float value');
  });

  it('calls onValidation with error for negative float input out of range', async () => {
    render(<PipelineFloatInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '-0.1' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith('-0.1');
    expect(defaultProps.onValidation).toHaveBeenCalledWith('Invalid float value');
  });

  it('does not validate empty input', async () => {
    const user = userEvent.setup();
    const onValidation = jest.fn();
    render(<PipelineFloatInput {...defaultProps} onValidation={onValidation} />);

    const input = screen.getByRole('textbox');
    await user.clear(input);

    expect(onValidation).not.toHaveBeenCalled();
  });
});
