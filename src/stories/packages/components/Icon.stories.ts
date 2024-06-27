import { Meta, StoryObj } from '@storybook/react';
import { Icon } from '@terra-ui-packages/components';
import iconLibrary from '@terra-ui-packages/components/src/internal/icon-library';

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
      options: Object.keys(iconLibrary), // ['arrowLeft', 'arrowRight'],
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
