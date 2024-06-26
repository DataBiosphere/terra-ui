import { Meta, StoryObj } from '@storybook/react';
import { Icon } from '@terra-ui-packages/components';

const meta: Meta<typeof Icon> = {
  title: 'Packages/Components/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'select',
      options: ['arrowLeft', 'arrowRight'], // Object.keys(iconLibrary),
      description: 'ID of icon to be used from IconLibrary',
    },
    size: {
      control: 'number',
      description: 'icon size',
      table: {
        defaultValue: { summary: '16' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const IconUsage: Story = {
  args: {
    icon: 'arrowLeft',
    size: 20,
  },
};
