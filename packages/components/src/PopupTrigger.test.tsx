import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RefObject } from 'react';

import { renderWithTheme } from './internal/test-utils';
import { PopupTrigger, PopupTriggerProps, PopupTriggerRef } from './PopupTrigger';

describe('PopupTrigger', () => {
  const renderPopupTrigger = (
    props: Partial<PopupTriggerProps> = {},
    childProps: Partial<JSX.IntrinsicElements['button']> = {}
  ): { trigger: HTMLElement } => {
    renderWithTheme(
      <PopupTrigger content='This is a popup' {...props}>
        <button type='button' {...childProps}>
          Toggle Popup
        </button>
      </PopupTrigger>
    );

    const trigger = screen.getByRole('button');
    return { trigger };
  };

  it('toggles popup when trigger is clicked', async () => {
    // Arrange
    const user = userEvent.setup();

    const { trigger } = renderPopupTrigger();

    // Act
    const isShownBeforeClick = !!screen.queryByRole('dialog');

    await user.click(trigger);
    const isShownAfterFirstClick = !!screen.queryByRole('dialog');

    await user.click(trigger);
    const isShownAfterSecondClick = !!screen.queryByRole('dialog');

    // Assert
    expect(isShownBeforeClick).toBe(false);
    expect(isShownAfterFirstClick).toBe(true);
    expect(isShownAfterSecondClick).toBe(false);
  });

  it('has correct ARIA attributes when closed', async () => {
    // Act
    const { trigger } = renderPopupTrigger({ popupProps: { role: 'dialog' } });

    // Arrange
    expect(trigger).not.toHaveAttribute('aria-controls');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).not.toHaveAttribute('aria-owns');
  });

  it('has correct ARIA attributes when open', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    const { trigger } = renderPopupTrigger({ popupProps: { role: 'dialog' } });
    await user.click(trigger);
    const popup = screen.getByRole('dialog');

    // Arrange
    const popupId = popup.id;
    expect(trigger).toHaveAttribute('aria-controls', popupId);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-owns', popupId);

    expect(popup).toHaveAttribute('role', 'dialog');
    expect(popup).toHaveAttribute('aria-modal', 'true');
  });

  it('labels the popup with the trigger element', async () => {
    // Arrange
    const user = userEvent.setup();

    const { trigger } = renderPopupTrigger();

    // Act
    await user.click(trigger);
    const popup = screen.getByRole('dialog');

    // Assert
    expect(popup).toHaveAttribute('aria-labelledby', trigger.id);
  });

  it('calls onChange when popup is toggled', async () => {
    // Arrange
    const user = userEvent.setup();

    const onChange = jest.fn();
    const { trigger } = renderPopupTrigger({ onChange });

    // Act
    await user.click(trigger);

    // Assert
    expect(onChange).toHaveBeenCalledWith(true);

    // Act
    await user.click(trigger);

    // Assert
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('can close the popup when the popup is clicked', async () => {
    // Arrange
    const user = userEvent.setup();

    const { trigger } = renderPopupTrigger({ closeOnClick: true });

    // Act
    await user.click(trigger);
    const popup = screen.getByRole('dialog');
    await user.click(popup);

    // Assert
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes the popup when something outside the popup/trigger is clicked', async () => {
    // Arrange
    const user = userEvent.setup();

    const { trigger } = renderPopupTrigger();

    // Act
    await user.click(trigger);
    await user.click(document.body);

    // Assert
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('traps focus in the popup', async () => {
    // Arrange
    const user = userEvent.setup();

    renderWithTheme(
      <>
        <PopupTrigger
          content={
            <>
              <button type='button'>Button A</button>
              <button type='button'>Button B</button>
            </>
          }
        >
          <button type='button'>Toggle Popup</button>
        </PopupTrigger>
        <button type='button'>Button C</button>
      </>
    );

    const trigger = screen.getByRole('button', { name: 'Toggle Popup' });

    // Act
    await user.click(trigger);

    const popup = screen.getByRole('dialog');

    // When the popup is opened, focus should be moved to focus trap inside the popup.
    const focusReceiver = document.activeElement;
    expect(popup.contains(focusReceiver)).toBe(true);

    const [buttonA, buttonB] = ['Button A', 'Button B'].map((btnText) => screen.getByText(btnText));

    // Tab 4 times.
    // Focus should go through the buttons in the popup, then to the focus trap element, and then back to button A,
    // never reaching button C outside of the popup.
    const tabOrder: Element[] = [];
    for (let i = 0; i < 4; i += 1) {
      await user.tab();
      tabOrder.push(document.activeElement!);
    }

    // Assert
    expect(tabOrder).toEqual([buttonA, buttonB, focusReceiver, buttonA]);
  });

  it('closes the popup when the escape key is pressed', async () => {
    // Arrange
    const user = userEvent.setup();

    const { trigger } = renderPopupTrigger();

    // Act
    await user.click(trigger);
    await user.keyboard('{Escape}');

    // Assert
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('provides an imperative handle to close the popup', async () => {
    // Arrange
    const user = userEvent.setup();

    const ref: RefObject<PopupTriggerRef> = { current: null };
    renderWithTheme(
      <PopupTrigger ref={ref} content='This is a popup'>
        <button type='button'>Toggle Popup</button>
      </PopupTrigger>
    );

    const trigger = screen.getByRole('button', { name: 'Toggle Popup' });

    // Act
    await user.click(trigger);
    act(() => {
      ref.current!.close();
    });

    // Assert
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should move focus back to trigger when popup is closed', async () => {
    // Arrange
    const user = userEvent.setup();

    const { trigger } = renderPopupTrigger();

    // Act
    await user.click(trigger);
    await user.keyboard('{Escape}');

    // Assert
    expect(trigger).toHaveFocus();
  });
});
