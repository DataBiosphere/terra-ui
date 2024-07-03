import type { Meta, StoryObj } from '@storybook/react';
import { InfoBox } from '@terra-ui-packages/components';
import { allIconIds, sideOptions } from '@terra-ui-packages/components';

const meta: Meta<typeof InfoBox> = {
  title: 'Packages/Components/InfoBox',
  component: InfoBox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Defines the popup content to appear when the InfoBox is clicked.',
    },
    icon: {
      control: 'select',
      options: allIconIds,
      description: 'The ID of an icon to be used from IconLibrary',
    },
    side: {
      control: 'select',
      options: sideOptions,
      description: 'Determines the side that the popup appears on when the InfoBox is clicked.',
    },
    size: {
      control: 'number',
      description: "The size of the InfoBox's icon.",
      table: {
        defaultValue: { summary: '16' },
      },
    },
    style: {
      control: 'object',
      description: 'A CSS style object.',
    },
    tooltip: {
      control: 'text',
      description: 'The text text to display when hovering over the InfoBox.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InfoBox>;

export const Example: Story = {
  args: {
    children: 'This is some text that appears when the InfoBox is clicked.',
    tooltip: 'example tooltip',
  },
};
