import type { Meta, StoryObj } from '@storybook/react';
import { Link } from '@terra-ui-packages/components';

const meta: Meta<typeof Link> = {
  title: 'Packages/Components/Link',
  component: Link,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Link text',
    },
    href: {
      control: 'text',
      description: 'URL destination of the link',
    },
    tooltip: {
      control: 'text',
      description: 'Tooltip text',
    },
    tooltipSide: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Tooltip position',
      table: {
        defaultValue: { summary: 'bottom' },
      },
    },
    tooltipDelay: {
      control: 'number',
      description: 'Tooltip delay in milliseconds',
      table: {
        defaultValue: { summary: 'undefined' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Should the link be disabled?',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    variant: {
      control: 'select',
      options: [undefined, 'light'],
      description: 'Default color, or lighter variant?',
      table: {
        defaultValue: { summary: 'undefined' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Primary: Story = {
  args: {
    children: 'Terra Support',
    href: 'https://support.terra.bio',
    disabled: false,
    variant: undefined,
    tooltip: undefined,
    tooltipSide: 'bottom',
    tooltipDelay: undefined,
  },
};
