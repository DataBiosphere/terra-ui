import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FocusTrap } from './FocusTrap';

describe('FocusTrap', () => {
  it('traps focus', async () => {
    // Arrange
    const user = userEvent.setup();

    const { container } = render(
      <FocusTrap onEscape={jest.fn()}>
        <button type='button'>A</button>
        <button type='button'>B</button>
        <button type='button'>C</button>
      </FocusTrap>
    );

    const wrapper = container.children.item(1) as HTMLElement;
    const [buttonA, buttonB, buttonC] = ['A', 'B', 'C'].map((btnText) => screen.getByRole('button', { name: btnText }));

    // Act
    // Focus on the wrapper then tab 5 times.
    // Focus should go through the buttons, then to the wrapper element, and then back to button A, never reaching button D
    wrapper.focus();
    const tabOrder: Element[] = [];
    for (let i = 0; i < 5; i += 1) {
      await user.tab();
      tabOrder.push(document.activeElement!);
    }

    // Assert
    expect(tabOrder).toEqual([buttonA, buttonB, buttonC, wrapper, buttonA]);
  });
});
