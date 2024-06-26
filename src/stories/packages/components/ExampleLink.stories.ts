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
    baseColor: {
      control: 'color',
      description: 'Base color of the link.',
      table: {
        defaultValue: { summary: 'transparent' },
      },
    },
    children: {
      control: 'text',
      description: 'Link text',
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
      options: ['light'],
      description: 'Default color, or lighter variant?',
      table: {
        defaultValue: { summary: 'undefined' },
      },
    },
    hover: {
      control: 'text',
      description: 'tooltip text',
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
  },
};
