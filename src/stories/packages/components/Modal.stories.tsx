import type { Meta, StoryObj } from '@storybook/react';
import { ButtonPrimary, Modal, ModalProps } from '@terra-ui-packages/components';
import React, { CSSProperties, useState } from 'react';

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
      description: 'is the action destructive?',
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
      control: 'select',
      description: 'custom CSS styles for `buttonRow` and `modal`',
      options: ['undefined', 'custom buttonRow', 'custom modal'],
      table: {
        defaultValue: { summary: 'undefined' },
      },
      mapping: {
        undefined,
        'custom buttonRow': {
          buttonRow: { background: 'lightblue' } satisfies CSSProperties,
        },
        'custom modal': {
          modal: { background: 'lightpink' } satisfies CSSProperties,
        },
      },
    },
    title: {
      control: 'text',
      description: 'modal title',
    },
    titleChildren: {
      description: 'additional components for title bar',
      control: 'select',
      options: ['undefined', 'ReactNode'],
      table: {
        defaultValue: { summary: 'undefined' },
      },
      mapping: {
        undefined,
        ReactNode: <i>Some ReactNode</i>,
      },
    },
    width: {
      control: 'number',
      description: 'modal width in pixels',
    },
    onDismiss: {
      type: 'function',
      description: 'modal dismiss callback',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Example: Story = {
  args: {
    cancelText: 'Cancel',
    children: 'Do you wish to close this model?',
    danger: false,
    okButton: 'Close It',
    showButtons: true,
    showCancel: true,
    showX: true,
    styles: undefined,
    title: 'Confirm',
    titleChildren: undefined,
    width: 450,
    onDismiss: () => {},
  } satisfies ModalProps,

  render: (args) => {
    const StoryWrapper = (): React.ReactNode => {
      const [isModalOpen, modalOpen] = useState(false);
      const showModal = () => {
        modalOpen(true);
      };
      const hideModal = () => {
        modalOpen(false);
      };
      return (
        <div>
          <ButtonPrimary onClick={showModal}>Click to show modal</ButtonPrimary>
          {isModalOpen && <Modal {...args} onDismiss={hideModal} />}
        </div>
      );
    };
    return <StoryWrapper />;
  },
};
