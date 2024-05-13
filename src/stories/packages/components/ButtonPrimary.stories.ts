import type { Meta, StoryObj } from '@storybook/react';
import { ButtonPrimary } from '@terra-ui-packages/components';

const meta: Meta<typeof ButtonPrimary> = {
  title: 'Packages/Components/ButtonPrimary',
  component: ButtonPrimary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'button text (can be a list of components in code)',
    },
    danger: {
      control: 'boolean',
      description: 'render with warning styling',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'disable the button',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    tooltip: {
      control: 'text',
      description: 'tooltip text',
    },
    tooltipDelay: {
      control: 'number',
      description: 'tooltip delay in milliseconds',
      table: {
        defaultValue: { summary: '0' },
      },
    },
    tooltipSide: {
      options: ['top', 'bottom', 'left', 'right'],
      control: 'select',
      description: 'where to display the tooltip',
      defaultValue: 'bottom',
      table: {
        defaultValue: { summary: 'bottom' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonPrimary>;

export const Primary: Story = {
  args: {
    danger: false,
    tooltip: 'This can provide additional context',
    children: 'Cancel',
  },
};
