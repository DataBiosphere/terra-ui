import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '@terra-ui-packages/components';

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
    },
    offLabel: {
      control: 'text',
      description: 'text for the "off" state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Primary: Story = {
  args: {
    checked: false,
    disabled: false,
    onLabel: 'On',
    offLabel: 'Off',
  },
  parameters: {},
};
