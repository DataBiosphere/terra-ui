import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryFn } from '@storybook/react';
import { allIconIds } from '@terra-ui-packages/components';
import React from 'react';
import { AutocompleteTextInput } from 'src/components/input';

const meta: Meta<typeof AutocompleteTextInput> = {
  title: 'src/Components/AutocompleteTextInput',
  component: AutocompleteTextInput,
  parameters: {
    layout: 'centered',
    docs: {
      story: {
        height: '200px',
      },
    },
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
    onPick: {
      type: 'function',
      description: 'callback when a value is picked from the suggestions',
    },
    renderSuggestions: {
      type: 'function',
      description: 'optional function to render the display of suggestions',
    },
    suggestionFilter: {
      type: 'function',
      description: 'optional function to determine which suggestions match',
      table: {
        defaultValue: { summary: 'textMatch' },
      },
    },
    labelId: {
      control: false,
      description:
        "Id of the label associated with the input, which is necessary for accessibility. If no visible label is desired, use `className: 'sr-only'` on the label to hide it.",
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
    itemToString: {
      type: 'function',
      description: 'an optional function to map between an object value and a textual representation',
    },
    inputIcon: {
      control: 'select',
      options: allIconIds,
      description: 'optional ID of icon to be used from IconLibrary',
    },
    iconStyle: {
      control: 'object',
      description: 'Custom CSS styles for the icon (optional)',
      table: {
        type: { summary: 'CSSProperties' },
      },
    },
  },
  args: {
    placeholder: 'Enter a value',
    suggestions: ['apple', 'banana', 'cheetos', 'cherry'],
    value: '',
    inputIcon: 'search',
  },
};

export default meta;

export const Example: StoryFn<typeof AutocompleteTextInput> = (props) => {
  const [_, updateArgs] = useArgs();
  const onChange = (value) => {
    updateArgs({ value });
  };
  return (
    <div style={{ display: 'grid' }}>
      {/* eslint-disable jsx-a11y/label-has-associated-control */}
      <label id='labelId' style={{ marginBottom: '10px' }}>
        Start typing to autocomplete:
      </label>
      <AutocompleteTextInput
        value={props.value}
        placeholder={props.placeholder}
        disabled={props.disabled}
        onChange={onChange}
        labelId='labelId'
        autoFocus={props.autoFocus}
        style={props.style}
        suggestions={props.suggestions}
        inputIcon={props.inputIcon}
        iconStyle={props.iconStyle}
      />
    </div>
  );
};
