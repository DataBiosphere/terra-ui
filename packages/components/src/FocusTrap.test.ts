import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { button, h } from 'react-hyperscript-helpers';

import { FocusTrap } from './FocusTrap';

describe('FocusTrap', () => {
  it('traps focus', async () => {
    // Arrange
    const user = userEvent.setup();

    const { container } = render(h(FocusTrap, [button(['A']), button(['B']), button(['C'])]));

    const wrapper = container.children.item(1) as HTMLElement;
    const [buttonA, buttonB, buttonC] = ['A', 'B', 'C'].map((btnText) => screen.getByRole('button', { name: btnText }));

    // Act
    // Focus on the wrapper then tab 5 times.
    // Focus should go through the buttons, then to the wrapper element, and then back to button A.
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
