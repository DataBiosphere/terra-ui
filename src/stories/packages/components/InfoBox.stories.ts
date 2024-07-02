import type { Meta, StoryObj } from '@storybook/react';
import { InfoBox } from '@terra-ui-packages/components';

const meta: Meta<typeof InfoBox> = {
  title: 'Packages/Components/InfoBox',
  component: InfoBox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    tooltip: {
      control: 'text',
      description: 'tooltip text to display on mouse over',
    },
  },
};

export default meta;
type Story = StoryObj<typeof InfoBox>;

export const Example: Story = {
  args: {
    tooltip: 'https://support.terra.bio',
  },
};
