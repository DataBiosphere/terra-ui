import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryFn } from '@storybook/react';
import { Switch } from '@terra-ui-packages/components';
import React from 'react';

const meta: Meta<typeof Switch> = {
  title: 'Packages/Components/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: 'state of the switch',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'disable the switch',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    onLabel: {
      control: 'text',
      description: 'text for the "on" state',
      table: {
        defaultValue: { summary: 'True' },
      },
    },
    offLabel: {
      control: 'text',
      description: 'text for the "off" state',
      table: {
        defaultValue: { summary: 'False' },
      },
    },
    onChange: {
      type: 'function',
      description: 'switch state change callback',
    },
  },
  args: {
    onLabel: 'On',
    offLabel: 'Off',
  },
};

export default meta;

export const Example: StoryFn<typeof Switch> = (props) => {
  const [_, updateArgs] = useArgs();
  const onChange = (checked) => {
    updateArgs({ checked });
  };
  return (
    <Switch
      onChange={onChange}
      checked={props.checked}
      disabled={props.disabled}
      onLabel={props.onLabel}
      offLabel={props.offLabel}
    />
  );
};
