import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryFn } from '@storybook/react';
import { Select } from '@terra-ui-packages/components';
import React from 'react';

const meta: Meta<typeof Select> = {
  title: 'Packages/Components/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      story: {
        height: '200px',
      },
    },
  },
  tags: ['autodocs'],
  args: { options: ['First', 'Second', 'Third'], value: 'First' },
  argTypes: {
    value: {
      control: 'select',
      description: 'a member of the options parameter',
      options: ['First', 'Second', 'Third'],
    },
    isClearable: {
      control: 'boolean',
      description: 'whether the select can be cleared',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    isDisabled: {
      control: 'boolean',
      description: 'whether the select is disabled',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    isSearchable: {
      control: 'boolean',
      description: 'whether the select can be searched',
      table: {
        defaultValue: { summary: 'true' },
      },
    },
    isMulti: {
      control: 'boolean',
      description: 'whether the select is multiselect or not',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    menuPlacement: {
      control: 'select',
      description: 'determines where the menu is placed',
      options: ['bottom', 'auto', 'top'],
      table: {
        defaultValue: { summary: 'bottom' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'placeholder value for the select',
      table: {
        defaultValue: { summary: 'Select...' },
      },
    },
  },
};

export default meta;

export const Example: StoryFn<typeof Select> = (props) => {
  const [args, updateArgs] = useArgs();
  const onChange = (selection) => {
    if (args.isMulti) {
      updateArgs({ value: selection.map((option) => option.value) });
    } else {
      updateArgs({ value: selection?.value });
    }
  };
  return (
    <Select
      value={props.value}
      options={props.options}
      onChange={onChange}
      isClearable={props.isClearable}
      isDisabled={props.isDisabled}
      isSearchable={props.isSearchable}
      isMulti={props.isMulti}
      menuPlacement={props.menuPlacement}
      placeholder={props.placeholder}
    />
  );
};
