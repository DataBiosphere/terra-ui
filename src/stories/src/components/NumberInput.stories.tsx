import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { NumberInput, TextInput } from 'src/components/input';

const meta: Meta<typeof NumberInput> = {
  title: 'src/Components/NumberInput',
  component: NumberInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for when the input is empty',
    },
    tooltip: {
      control: 'text',
      description:
        'Tooltip to display on hover (right side only). It will also be used as the aria label if aria-label is not specified.',
    },
    value: {
      control: 'number',
      description: 'Value for the field',
    },
    disabled: {
      control: 'boolean',
      description: 'Should the input be disabled?',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    onlyInteger: {
      control: 'boolean',
      description: 'Should the input be limited to integers?',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    onChange: {
      type: 'function',
      description: 'callback when the text is changed',
    },
    'aria-label': {
      control: 'text',
      description: 'Accessible label to use for the input if it is not linked to a label via the ID attribute',
      table: {
        readonly: true,
      },
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
    tooltip: 'This is a number input',
    min: 0,
    max: 10,
    isClearable: false,
  },
};

export default meta;

export const Example: StoryFn<typeof TextInput> = (props) => {
  const [_, updateArgs] = useArgs();
  const onChange = (value) => {
    updateArgs({ value });
  };
  return (
    <NumberInput
      value={props.value}
      placeholder={props.placeholder}
      disabled={props.disabled}
      onChange={onChange}
      aria-label={props['aria-label']}
      id={props.id}
      autoFocus={props.autoFocus}
      style={props.style}
      min={props.min}
      max={props.max}
      isClearable={props.isClearable}
      onlyInteger={props.onlyInteger}
      tooltip={props.tooltip}
    />
  );
};
