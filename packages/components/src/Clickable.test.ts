import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';

import { Clickable, ClickableProps } from './Clickable';
import { TooltipTrigger, TooltipTriggerProps } from './TooltipTrigger';

type TooltipTriggerExports = typeof import('./TooltipTrigger');
jest.mock('./TooltipTrigger', (): TooltipTriggerExports => {
  const actual = jest.requireActual<TooltipTriggerExports>('./TooltipTrigger');
  return {
    ...actual,
    TooltipTrigger: jest.fn().mockImplementation(actual.TooltipTrigger),
  };
});

describe('Clickable', () => {
  const renderClickable = (props: ClickableProps = {}): HTMLElement => {
    render(h(Clickable, props, ['Click here']));
    return screen.getByText('Click here');
  };

  it('calls onClick when clicked', async () => {
    // Arrange
    const user = userEvent.setup();

    const onClick = jest.fn();
    const clickable = renderClickable({ onClick });

    // Act
    await user.click(clickable);

    // Assert
    expect(onClick).toHaveBeenCalled();
  });

  it('sets tab index to 0', () => {
    // Act
    const clickable = renderClickable();

    // Assert
    expect(clickable.tabIndex).toBe(0);
  });

  it('renders a link if an href is provided', () => {
    // Act
    const clickable = renderClickable({ href: 'https://example.com/' });

    // Assert
    expect(clickable.tagName).toBe('A');
    expect((clickable as HTMLAnchorElement).href).toBe('https://example.com/');
  });

  describe('when disabled', () => {
    const renderDisabledClickable = (props: ClickableProps = {}): HTMLElement => {
      return renderClickable({ ...props, disabled: true });
    };

    it('sets aria-disabled attribute', () => {
      // Act
      const clickable = renderDisabledClickable();

      // Assert
      expect(clickable).toHaveAttribute('aria-disabled', 'true');
    });

    it('sets tab index to -1', () => {
      // Act
      const clickable = renderDisabledClickable();

      // Assert
      expect(clickable.tabIndex).toBe(-1);
    });

    it('disables onClick handler', async () => {
      // Arrange
      const user = userEvent.setup();

      const onClick = jest.fn();
      const clickable = renderDisabledClickable({ onClick });

      // Act
      await user.click(clickable);

      // Assert
      expect(onClick).not.toHaveBeenCalled();
    });

    it('removes href attribute', () => {
      // Act
      const clickable = renderDisabledClickable({ href: 'https://example.com/' });

      // Assert
      expect((clickable as HTMLAnchorElement).href).toBe('');
    });
  });

  it('renders a TooltipTrigger when a tooltip is provided', () => {
    // Act
    renderClickable({ tooltip: 'This is clickable' });

    // Assert
    expect(TooltipTrigger).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'This is clickable' } satisfies Partial<TooltipTriggerProps>),
      expect.anything()
    );
  });
});
