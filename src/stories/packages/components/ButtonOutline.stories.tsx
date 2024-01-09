import type { Meta, StoryObj } from '@storybook/react';
import { ButtonOutline } from '@terra-ui-packages/components';
import { ThemeProvider } from '@terra-ui-packages/components';

import React from 'react';

import { defaultBrand } from 'src/libs/brands';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Packages/Components/ButtonOutline',
  component: ButtonOutline,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    children: {
      control: 'text',
      description: 'button text (can be a list of components in code)',
    },
    disabled: {
      control: 'boolean',
      description: 'disable the button',
    },
    tooltip: {
      control: 'text',
      description: 'tooltip text',
    },
    tooltipDelay: {
      control: 'number',
      description: 'tooltip delay in milliseconds',
    },
    tooltipSide: {
      options: ['top', 'bottom', 'left', 'right'],
      control: 'select',
      description: 'where to display the tooltip',
    },
  },
} satisfies Meta<typeof ButtonOutline>;

export default meta;
type Story = StoryObj<typeof ButtonOutline>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Primary: Story = {
  args: {
    tooltip: 'This can provide additional context',
    children: 'Cancel',
  },
  render: function Render(args) {
    return (
      <ThemeProvider theme={defaultBrand.theme}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <ButtonOutline {...args} />
      </ThemeProvider>
    );
  },
};
