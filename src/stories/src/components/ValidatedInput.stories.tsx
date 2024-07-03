import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { ValidatedInput } from 'src/components/input';

/**
 * A TextInput that displays an error message below the input when the error argument is nonempty.
 */
const meta: Meta<typeof ValidatedInput> = {
  title: 'src/Components/ValidatedInput',
  component: ValidatedInput,
  parameters: {
    layout: 'centered',
    docs: {
      story: {
        height: '70px',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for when the input is empty',
    },
    error: {
      control: 'text',
      description: 'An error message to display below the input',
    },
    width: {
      control: 'number',
      description: 'The width of the input',
    },
    value: {
      control: 'text',
      description: 'Value for the field',
    },
    disabled: {
      control: 'boolean',
      description: 'Should the input be disabled?',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    onChange: {
      type: 'function',
      description: 'callback when the text is changed',
    },
    'aria-label': {
      control: false,
      description: 'Accessible label to use for the input if it is not linked to a label via the ID attribute',
    },
    id: {
      control: false,
      description: 'ID of the label associated with the input',
    },
    autoFocus: {
      control: 'boolean',
      description: 'Should the input get initial focus on render?',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    style: {
      control: 'object',
      description: 'Custom CSS styles for the input',
      table: {
        type: { summary: 'CSSProperties' },
      },
    },
  },
  args: {
    placeholder: 'Enter a value',
    'aria-label': 'Non-visible label for accessibility',
    error: 'You must specify a value',
    width: 400,
  },
};

export default meta;

export const Example: StoryFn<typeof ValidatedInput> = (props) => {
  const [_, updateArgs] = useArgs();
  const onChange = (value: string) => {
    updateArgs({ value, error: value === '' ? 'You must specify a value' : '' });
  };
  const inputProps = {
    value: props.value,
    placeholder: props.placeholder,
    disabled: props.disabled,
    onChange,
    'aria-label': props['aria-label'],
    id: props.id,
    autoFocus: props.autoFocus,
    style: props.style,
  };
  return <ValidatedInput inputProps={inputProps} error={props.error} width={props.width} />;
};
