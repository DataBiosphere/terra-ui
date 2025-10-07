import { render, screen } from '@testing-library/react';
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
    },
    optionalFloatInput: {
      label: 'Enter an optional float value',
      placeholder: 'Enter a number',
      helpText: 'Must be a valid floating-point number.',
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

  it('shows "optional" text for optional inputs', () => {
    render(<PipelineFloatInput {...defaultProps} input={optionalInput} />);
    expect(screen.getByText('- optional')).toBeInTheDocument();
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
    const user = userEvent.setup();
    const onValidation = jest.fn();
    render(<PipelineFloatInput {...defaultProps} onValidation={onValidation} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '123.45');

    expect(onValidation).toHaveBeenCalledWith(undefined);
  });

  it('calls onValidation with error for invalid float input', async () => {
    const user = userEvent.setup();
    const onValidation = jest.fn();
    render(<PipelineFloatInput {...defaultProps} onValidation={onValidation} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'invalid');

    expect(onValidation).toHaveBeenCalledWith('Invalid float value');
  });

  it('does not validate empty input', async () => {
    const user = userEvent.setup();
    const onValidation = jest.fn();
    render(<PipelineFloatInput {...defaultProps} onValidation={onValidation} />);

    const input = screen.getByRole('textbox');
    await user.clear(input);

    expect(onValidation).not.toHaveBeenCalled();
  });

  it('trims input value before validation', async () => {
    const user = userEvent.setup();
    const onValidation = jest.fn();
    render(<PipelineFloatInput {...defaultProps} onValidation={onValidation} />);

    const input = screen.getByRole('textbox');
    await user.type(input, ' 123.45 ');

    expect(onValidation).toHaveBeenCalledWith(undefined);
  });
});
