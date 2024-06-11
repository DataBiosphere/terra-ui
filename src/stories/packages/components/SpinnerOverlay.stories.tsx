import type { Meta, StoryObj } from '@storybook/react';
import { SpinnerOverlay, SpinnerOverlayProps } from '@terra-ui-packages/components';
import React from 'react';

const overlayModes: Array<SpinnerOverlayProps['mode']> = [
  'Default',
  'Top',
  'Transparent',
  'Fixed',
  'Absolute',
  'FullScreen',
];

const placeholderText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et\n' +
  ' dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip\n' +
  ' ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore\n' +
  ' eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia\n' +
  ' deserunt mollit anim id est laborum.';

const meta: Meta<typeof SpinnerOverlay> = {
  title: 'Packages/Components/SpinnerOverlay',
  component: SpinnerOverlay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: overlayModes,
      description: 'layout mode',
      table: {
        defaultValue: { summary: 'Default' },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SpinnerOverlay>;

export const Overlay: Story = {
  args: {},
  parameters: {
    // design: {
    //   type: 'figma',
    //   /* Figma URL doesn't land on a section for loading spinners since that section isn't authored in Figma by UX yet.
    //      Disabling design link for now.
    //    */
    //   url: 'https://www.figma.com/file/fGlf8DGgTz5ec7phmzNUEN/Terra-Styles-%26-Components?node-id=2-262&t=AexvAMYj4iUGF3lt-4',
    //   allowFullscreen: true,
    // },
  },
  render: (args) => (
    <div style={{ margin: 16 }}>
      <div style={{ margin: '0, 40px', position: 'relative' }}>
        <p>{placeholderText}</p>
        <p>{placeholderText}</p>
        <p>{placeholderText}</p>
        <SpinnerOverlay {...args} />
      </div>
    </div>
  ),
};
