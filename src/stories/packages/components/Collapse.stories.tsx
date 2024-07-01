import { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Collapse, CollapseProps } from 'src/components/Collapse';

const meta: Meta<typeof Collapse> = {
  title: 'Packages/Components/Collapse',
  component: Collapse,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Collapse>;

export const Example: Story = {
  args: {
    title: 'This is a collapsable component',
    hover: {
      // TODO
    },
  } satisfies CollapseProps,
  render: () => {
    const StoryWrapper = (): React.ReactNode => {
      const [initialOpenState] = useState(false);
      return (
        <div>
          <Collapse title='This is a title' initialOpenState={initialOpenState} />
        </div>
      );
    };
    return <StoryWrapper />;
  },
};
