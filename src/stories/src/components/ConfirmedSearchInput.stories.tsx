import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { ConfirmedSearchInput, TextArea } from 'src/components/input';

/**
 * This is a TextInput that fires its onChange callback when Enter, Escape, or
 * the search button is triggered.
 */
const meta: Meta<typeof ConfirmedSearchInput> = {
  title: 'src/Components/ConfirmedSearchInput',
  component: ConfirmedSearchInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for when the input is empty',
    },
    defaultValue: {
      control: 'text',
      description: 'The initial value for the field',
    },
    value: {
      control: false,
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
      description: 'Accessible label to use for the input if it is not linked to a label via the `id` attribute',
    },
    id: {
      control: false,
      description: 'Id to associate with the input. This should be linked to a label via `htmlFor`.',
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
    defaultValue: 'default value',
  },
};

export default meta;

export const Example: StoryFn<typeof ConfirmedSearchInput> = (props) => {
  const [_, updateArgs] = useArgs();
  const onChange = (value: string) => {
    updateArgs({ value });
  };

  return (
    <div style={{ display: 'grid' }}>
      {/* eslint-disable jsx-a11y/label-has-associated-control */}
      <label style={{ marginBottom: '10px' }} htmlFor='search-input'>
        Enter a search term:
      </label>
      <ConfirmedSearchInput
        defaultValue={props.defaultValue}
        placeholder={props.placeholder}
        disabled={props.disabled}
        onChange={onChange}
        aria-label={props['aria-label']}
        id='search-input'
        autoFocus={props.autoFocus}
        style={props.style}
      />
      {/* eslint-disable jsx-a11y/label-has-associated-control */}
      <label
        style={{
          marginTop: '20px',
          marginBottom: '10px',
          fontStyle: 'italic',
        }}
        htmlFor='text-area'
      >
        onChange callback fired:
      </label>
      <TextArea value={props.value} id='text-area' disabled />
    </div>
  );
};
