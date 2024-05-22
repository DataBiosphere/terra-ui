import type { Meta, StoryObj } from '@storybook/react';
import { ExternalLink } from '@terra-ui-packages/components';

const meta: Meta<typeof ExternalLink> = {
  title: 'Packages/Components/ExternalLink',
  component: ExternalLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'link text',
    },
    href: {
      control: 'text',
      description: 'link URL',
    },
    disabled: {
      control: 'boolean',
      description: 'disable the link',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ExternalLink>;

export const Primary: Story = {
  args: {
    children: 'Terra Support',
    href: 'https://support.terra.bio',
  },
};
