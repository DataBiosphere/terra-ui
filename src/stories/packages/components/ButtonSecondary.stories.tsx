import type { Meta, StoryObj } from '@storybook/react';
import { ButtonSecondary } from '@terra-ui-packages/components';
import React from 'react';

import StoryThemeProvider from './StoryThemeProvider';

const meta: Meta<typeof ButtonSecondary> = {
  title: 'Packages/Components/ButtonSecondary',
  component: ButtonSecondary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'button text (can be a list of components in code)',
    },
    disabled: {
      control: 'boolean',
      description: 'disable the button',
      table: {
        defaultValue: { summary: false },
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
        defaultValue: { summary: 0 },
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
  decorators: [
    (Story) => (
      <StoryThemeProvider>
        <Story />
      </StoryThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ButtonSecondary>;

export const Primary: Story = {
  args: {
    tooltip: 'This can provide additional context',
    children: 'Cancel',
  },
};
