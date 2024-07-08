import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryFn } from '@storybook/react';
import React from 'react';
import { DelayedSearchInput, TextArea } from 'src/components/input';

/**
 * This is the SearchInput component, wrapped with a 250ms "debounce" to prevent excessive API calls.
 */
const meta: Meta<typeof DelayedSearchInput> = {
  title: 'src/Components/DelayedSearchInput',
  component: DelayedSearchInput,
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
  args: {},
};

export default meta;

export const Example: StoryFn<typeof DelayedSearchInput> = (props) => {
  const [_, updateArgs] = useArgs();
  const onChange = (value) => {
    updateArgs({ value });
  };
  return (
    <div style={{ display: 'grid' }}>
      {/* eslint-disable jsx-a11y/label-has-associated-control */}
      <label style={{ marginBottom: '10px' }} htmlFor='search-input'>
        Enter a search term:
      </label>
      <DelayedSearchInput
        value={props.value}
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
