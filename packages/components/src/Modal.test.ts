import { withFakeTimers } from '@terra-ui-packages/test-utils';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fragment, useState } from 'react';
import { button, h } from 'react-hyperscript-helpers';

import { getPopupRoot } from './internal/PopupPortal';
import { renderWithTheme } from './internal/test-utils';
import { Modal, ModalProps } from './Modal';

describe('Modal', () => {
  const renderModal = (props: Partial<ModalProps> = {}): void => {
    const { children, ...otherProps } = props;
    renderWithTheme(
      h(
        Modal,
        {
          onDismiss: jest.fn(),
          ...otherProps,
        },
        [children]
      )
    );
  };

  it('renders a modal dialog', () => {
    // Act
    renderModal({
      title: 'This is a modal',
      children: 'It has some content.',
    });

    // Assert
    const modalElement = screen.getByRole('dialog');
    expect(modalElement).toHaveAttribute('aria-modal', 'true');
    expect(modalElement).toHaveAccessibleName('This is a modal');
    expect(modalElement).toHaveTextContent(/It has some content./);
  });

  it('renders in the popup root element', () => {
    // Act
    renderModal({
      title: 'This is a modal',
      children: 'It has some content.',
    });

    // Assert
    const modal = screen.getByRole('dialog');
    expect(getPopupRoot().contains(modal)).toBe(true);
  });

  describe('buttons', () => {
    describe('"Cancel" button', () => {
      it('renders a "Cancel" button that dismisses the modal by default', async () => {
        // Arrange
        const user = userEvent.setup();
        const onDismiss = jest.fn();

        // Act
        renderModal({ onDismiss });

        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        // Assert
        expect(onDismiss).toHaveBeenCalled();
      });

      it('allows removing the "Cancel" button', () => {
        // Act
        renderModal({ showCancel: false });

        // Assert
        expect(screen.queryByText('Cancel')).toBeNull();
      });

      it('allows changing the "Cancel" button\'s text', async () => {
        // Arrange
        const user = userEvent.setup();
        const onDismiss = jest.fn();

        // Act
        renderModal({ cancelText: 'Dismiss', onDismiss });

        const cancelButton = screen.getByText('Dismiss');
        await user.click(cancelButton);

        // Assert
        expect(onDismiss).toHaveBeenCalled();
      });
    });

    describe('"OK" button', () => {
      it('renders an "OK" button that dismisses the modal by default', async () => {
        // Arrange
        const user = userEvent.setup();
        const onDismiss = jest.fn();

        // Act
        renderModal({ onDismiss });

        const okButton = screen.getByText('OK');
        await user.click(okButton);

        // Assert
        expect(onDismiss).toHaveBeenCalled();
      });

      it('allows removing the "OK" button', () => {
        // Act
        renderModal({ okButton: false });

        // Assert
        expect(screen.queryByText('OK')).toBeNull();
      });

      it('allows changing the "OK" button\'s text', async () => {
        // Arrange
        const user = userEvent.setup();
        const onDismiss = jest.fn();

        // Act
        renderModal({ okButton: 'Accept', onDismiss });

        const okButton = screen.getByText('Accept');
        await user.click(okButton);

        // Assert
        expect(onDismiss).toHaveBeenCalled();
      });

      it('allows changing the "OK" button\'s callback', async () => {
        // Arrange
        const user = userEvent.setup();
        const onOk = jest.fn();

        // Act
        renderModal({ okButton: onOk });

        const okButton = screen.getByText('OK');
        await user.click(okButton);

        // Assert
        expect(onOk).toHaveBeenCalled();
      });

      it('allows providing a custom "OK" button', async () => {
        // Arrange
        const user = userEvent.setup();
        const onOk = jest.fn();

        // Act
        renderModal({
          okButton: button({ onClick: onOk }, ['Start']),
        });

        const okButton = screen.getByText('Start');
        await user.click(okButton);

        // Assert
        expect(onOk).toHaveBeenCalled();
      });
    });

    it('allows removing both "Cancel" and "OK" buttons', () => {
      // Act
      renderModal({ showButtons: false });

      // Assert
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('if it has a title, it allows showing an "X" button that dismisses the modal', async () => {
      // Arrange
      const user = userEvent.setup();
      const onDismiss = jest.fn();

      // Act
      renderModal({ title: 'Modal', showX: true, onDismiss });

      const xButton = screen.getByLabelText('Close modal');
      await user.click(xButton);

      // Assert
      expect(onDismiss).toHaveBeenCalled();
    });
  });

  describe('focus management', () => {
    // react-modal's focus trap requires that an object be visible for it to be "tabbable".
    // Part of how it determines whether or not an element is visible is by checking its size is zero.
    // To do this, it looks at the element's offsetWidth and offsetHeight.
    // JSDOM does not implement layout, so these are always zero in tests.
    // Thus, react-modal thinks that no elements are visible/focusable.
    // Overriding them here convinces react-modal that all elements are indeed visible/focusable,
    // allowing us to test focus management.
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');

    beforeAll(() => {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { value: 1 });
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { value: 1 });
    });

    afterAll(() => {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight!);
      Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth!);
    });

    it(
      'gains focus when opened',
      withFakeTimers(() => {
        // Act
        renderModal();
        // Modal moves focus in a setTimeout(..., 0) callback in onAfterOpen.
        // Run timers to process that callback.
        act(() => jest.runAllTimers());

        // Assert
        const modal = screen.getByRole('dialog');
        expect(modal).toHaveFocus();
      })
    );

    it('traps focus within the modal', async () => {
      // Arrange
      const user = userEvent.setup();

      renderWithTheme(
        h(Fragment, [
          h(Modal, { showButtons: false, onDismiss: jest.fn() }, [
            button({ style: { display: 'contents', width: 100 } }, ['A']),
            button(['B']),
            button(['C']),
          ]),
          button(['D']),
        ])
      );

      const [buttonA, buttonB, buttonC] = ['A', 'B', 'C'].map((btnText) =>
        screen.getByRole('button', { name: btnText })
      );

      // Act
      // Focus on button A then tab 3 times.
      // Focus should go through the other buttons in the modal, then back to button A, never reaching button D
      buttonA.focus();
      const tabOrder: Element[] = [];
      for (let i = 0; i < 3; i += 1) {
        await user.tab();
        tabOrder.push(document.activeElement!);
      }

      // Assert
      expect(tabOrder).toEqual([buttonB, buttonC, buttonA]);
    });

    it(
      'when dismissed, it returns focus to the element focused before the modal was opened',
      withFakeTimers(() => {
        // Arrange
        const TestHarness = () => {
          const [isModalOpen, setIsModalOpen] = useState(false);

          return h(Fragment, [
            button(
              {
                onClick: () => {
                  setIsModalOpen(true);
                },
              },
              ['Open modal']
            ),
            isModalOpen &&
              h(Modal, {
                onDismiss: () => {
                  setIsModalOpen(false);
                },
              }),
          ]);
        };

        renderWithTheme(h(TestHarness));

        // Move focus to the "Open modal" button.
        const openModalButton = screen.getByText('Open modal');
        openModalButton.focus();

        // Open the modal.
        act(() => fireEvent.click(openModalButton));
        // Modal moves focus in a setTimeout(..., 0) callback in onAfterOpen.
        // Run timers to process that callback.
        act(() => jest.runAllTimers());
        expect(screen.getByRole('dialog')).toHaveFocus();

        // Act
        // Dismiss the modal.
        const okButton = screen.getByText('OK');
        act(() => fireEvent.click(okButton));
        expect(screen.queryByRole('dialog')).toBeNull();

        // Assert
        expect(openModalButton).toHaveFocus();
      })
    );
  });
});
