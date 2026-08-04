import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { PipelineBooleanInput } from './PipelineBooleanInput';

describe('PipelineBooleanInput', () => {
  const mockOnChange = jest.fn();

  const basePipelineInput: PipelineInput = {
    name: 'testInput',
    displayName: 'Test Input',
    description: 'This is a test input description',
    type: 'BOOLEAN',
    defaultValue: 'false',
    isRequired: false,
  };

  it('renders with display name and description', () => {
    render(<PipelineBooleanInput input={basePipelineInput} value={false} onChange={mockOnChange} />);

    expect(screen.getByText('Test Input')).toBeInTheDocument();
    expect(screen.getByText('This is a test input description')).toBeInTheDocument();
  });

  it('renders with input name when display name is not provided', () => {
    const inputWithoutDisplayName = { ...basePipelineInput, displayName: undefined };
    render(<PipelineBooleanInput input={inputWithoutDisplayName} value={false} onChange={mockOnChange} />);

    expect(screen.getByText('testInput')).toBeInTheDocument();
  });

  it('renders required indicator when input is required', () => {
    const requiredInput = { ...basePipelineInput, isRequired: true };
    render(<PipelineBooleanInput input={requiredInput} value={false} onChange={mockOnChange} />);

    const requiredIndicator = screen.getByText('*');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveStyle('color: rgb(219, 50, 20)'); // colors.danger()
  });

  it('does not render required indicator when input is not required', () => {
    render(<PipelineBooleanInput input={basePipelineInput} value={false} onChange={mockOnChange} />);

    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders checkbox as unchecked when value is false', () => {
    render(<PipelineBooleanInput input={basePipelineInput} value={false} onChange={mockOnChange} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders checkbox as checked when value is true', () => {
    render(<PipelineBooleanInput input={basePipelineInput} value onChange={mockOnChange} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('uses default value when value prop is undefined', () => {
    const inputWithDefaultTrue = { ...basePipelineInput, defaultValue: 'true' };
    render(<PipelineBooleanInput input={inputWithDefaultTrue} value={undefined as any} onChange={mockOnChange} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('falls back to false when both value and defaultValue are undefined', () => {
    const inputWithoutDefault = { ...basePipelineInput, defaultValue: undefined };
    render(<PipelineBooleanInput input={inputWithoutDefault} value={undefined as any} onChange={mockOnChange} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('calls onChange when checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(<PipelineBooleanInput input={basePipelineInput} value={false} onChange={mockOnChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with correct value when toggling from true to false', async () => {
    const user = userEvent.setup();
    render(<PipelineBooleanInput input={basePipelineInput} value onChange={mockOnChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledWith(false);
  });

  it('renders checkbox as disabled when disabled prop is true', () => {
    render(<PipelineBooleanInput input={basePipelineInput} value={false} onChange={mockOnChange} disabled />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('disabled');
  });

  it('renders checkbox as enabled when disabled prop is false', () => {
    render(<PipelineBooleanInput input={basePipelineInput} value={false} onChange={mockOnChange} disabled={false} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toHaveAttribute('disabled');
  });

  it('renders checkbox as enabled when disabled prop is not provided', () => {
    render(<PipelineBooleanInput input={basePipelineInput} value={false} onChange={mockOnChange} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toHaveAttribute('disabled');
  });
});
