import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { TextInput } from 'src/components/input';

const meta: Meta<typeof TextInput> = {
  title: 'src/Components/TextInput',
  component: TextInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for when the input is empty',
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
  },
};

export default meta;

export const Example: StoryFn<typeof TextInput> = (props) => {
  const [_, updateArgs] = useArgs();
  const onChange = (value) => {
    updateArgs({ value });
  };
  return (
    <TextInput
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      onChange={onChange}
      aria-label={props['aria-label']}
      id={props.id}
      autoFocus={props.autoFocus}
      style={props.style}
    />
  );
};
