import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '@terra-ui-packages/components';

const meta: Meta<typeof Switch> = {
  title: 'Packages/Components/Switch',
  component: Switch,
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Primary: Story = {
  args: {},
  parameters: {},
};
