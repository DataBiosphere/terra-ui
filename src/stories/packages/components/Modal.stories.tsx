import { action } from '@storybook/addon-actions';
import type { Meta, StoryObj } from '@storybook/react';
import { ButtonPrimary, Modal } from '@terra-ui-packages/components';
import React, { useState } from 'react';

const titleChildren = <span color='cyan'>:D</span>;
let setSubmitted = () => false;
let setDismissed = () => false;

const meta: Meta<typeof Modal> = {
  title: 'Packages/Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    cancelText: {
      control: 'text',
      description: 'text of Cancel button',
    },
    children: {
      control: 'text',
      description: 'modal body (string OR components)',
    },
    danger: {
      control: 'boolean',
      description: 'is the action dangerous?',
    },
    okButton: {
      control: 'text',
      description:
        'modal submit button text (string) OR modal submit callback (function) OR modal submit button component (jsx)',
    },
    showButtons: {
      control: 'boolean',
      description: 'show buttons on the modal?',
    },
    showCancel: {
      control: 'boolean',
      description: 'show a Cancel button?',
    },
    showX: {
      control: 'boolean',
      description: 'show an X button to dismiss the modal?',
    },
    styles: {
      control: 'text',
      description: 'custom CSS styles for `buttonRow` and `modal`',
    },
    title: {
      control: 'text',
      description: 'modal title',
    },
    titleChildren: {
      control: 'text',
      description: 'additional components for title bar',
    },
    width: {
      control: 'number',
      description: 'modal width in pixels',
    },
    onDismiss: {
      control: 'text',
      description: 'modal dismiss callback (function)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Example: Story = {
  args: {
    cancelText: 'Cancel',
    children: 'Here is a message!',
    danger: false,
    okButton: () => setSubmitted(true),
    showButtons: true,
    showCancel: true,
    showX: true,
    styles: { buttonRow: {}, modal: {} },
    title: 'A wild Modal appeared!',
    titleChildren,
    width: 450,
    onDismiss: () => setDismissed(true),
  },
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
  render: (args) => {
    const StoryWrapper = (): React.ReactNode => {
      const [isOpen, setIsOpen] = useState<boolean>(true);
      const [submitted, _setSubmitted] = useState<boolean>(false);
      const [dismissed, _setDismissed] = useState<boolean>(false);
      const openModal = () => {
        _setSubmitted(false);
        _setDismissed(false);
        setIsOpen(true);
      };
      setSubmitted = (value) => {
        setIsOpen(false);
        _setSubmitted(value);
      };
      setDismissed = (value) => {
        setIsOpen(false);
        _setDismissed(value);
      };
      action('Modal render')();
      return (
        <div style={{ margin: 16 }}>
          <div style={{ margin: '0, 40px', position: 'relative' }}>
            <div>{submitted && 'Modal submitted!'}</div>
            <div>{dismissed && 'Modal dismissed!'}</div>
            <ButtonPrimary onClick={openModal}>Open Modal</ButtonPrimary>
            {isOpen && <Modal {...args} />}
          </div>
        </div>
      );
    };
    return <StoryWrapper />;
  },
};
