import { Meta, StoryObj } from '@storybook/react';
import { allIconIds, Icon } from '@terra-ui-packages/components';

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
      options: allIconIds,
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

export const Example: Story = {
  args: {
    icon: 'arrowLeft',
    size: 30,
  },
};
