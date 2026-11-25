import { withFakeTimers } from '@terra-ui-packages/test-utils';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Icon } from './Icon';
import { getPopupRoot } from './internal/PopupPortal';
import { renderWithTheme } from './internal/test-utils';
import { TooltipTrigger, TooltipTriggerProps } from './TooltipTrigger';

describe('TooltipTrigger', () => {
  const tooltipContent = 'This is a tooltip';

  const renderTooltipTrigger = (
    props: Partial<TooltipTriggerProps> = {},
    childProps: Partial<JSX.IntrinsicElements['button']> = {}
  ) => {
    return renderWithTheme(
      <TooltipTrigger content={tooltipContent} {...props}>
        <button type='button' {...childProps} />
      </TooltipTrigger>
    );
  };

  it('shows tooltip when hovering on child', async () => {
    // Arrange
    const user = userEvent.setup();

    renderTooltipTrigger();

    const btn = screen.getByRole('button');

    // Act
    await user.hover(btn);
    const isShownAfterHover = !!within(getPopupRoot()).queryByText(tooltipContent);

    await user.unhover(btn);
    const isShownAfterUnhover = !!within(getPopupRoot()).queryByText(tooltipContent);

    // Assert
    expect(isShownAfterHover).toBe(true);
    expect(isShownAfterUnhover).toBe(false);
  });

  it('does not let the pointer interact with a tooltip by default', async () => {
    // Arrange
    const user = userEvent.setup();

    renderTooltipTrigger();

    // Act
    await user.hover(screen.getByRole('button'));

    // Assert
    expect(within(getPopupRoot()).getByRole('tooltip')).toHaveStyle({ pointerEvents: 'none' });
  });

  it(
    'keeps a copyable tooltip open while hovering on the tooltip itself, so its text can be selected',
    withFakeTimers(async () => {
      // Arrange
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderTooltipTrigger({ copyable: true });

      const btn = screen.getByRole('button');

      // Act
      await user.hover(btn);
      await user.unhover(btn);
      const tooltip = within(getPopupRoot()).getByRole('tooltip');
      await user.hover(tooltip);
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      const isShownWhileHoveringTooltip = !!within(getPopupRoot()).queryByText(tooltipContent);

      await user.unhover(tooltip);
      act(() => {
        jest.advanceTimersByTime(150);
      });
      const isShownAfterUnhoveringTooltip = !!within(getPopupRoot()).queryByText(tooltipContent);

      // Assert
      expect(isShownWhileHoveringTooltip).toBe(true);
      expect(isShownAfterUnhoveringTooltip).toBe(false);
    })
  );

  it('copies all of a copyable tooltip with its copy button', async () => {
    // Arrange
    const user = userEvent.setup();

    renderTooltipTrigger({ copyable: true });

    // Act
    await user.hover(screen.getByRole('button'));
    const tooltip = within(getPopupRoot()).getByRole('tooltip');
    await user.click(within(tooltip).getByRole('button', { name: 'Copy to clipboard' }));

    // Assert
    expect(await navigator.clipboard.readText()).toBe(tooltipContent);
    expect(within(tooltip).getByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });

  it('does not show a copy button by default', async () => {
    // Arrange
    const user = userEvent.setup();

    renderTooltipTrigger();

    // Act
    await user.hover(screen.getByRole('button'));

    // Assert
    expect(within(within(getPopupRoot()).getByRole('tooltip')).queryByRole('button')).toBeNull();
  });

  it('shows tooltip when focusing on child', () => {
    // Arrange
    renderTooltipTrigger();

    const btn = screen.getByRole('button');

    // Act
    act(() => {
      btn.focus();
    });
    const isShownAfterFocus = !!within(getPopupRoot()).queryByText(tooltipContent);

    act(() => {
      btn.blur();
    });
    const isShownAfterBlur = !!within(getPopupRoot()).queryByText(tooltipContent);

    // Assert
    expect(isShownAfterFocus).toBe(true);
    expect(isShownAfterBlur).toBe(false);
  });

  it('calls child event handlers when hovering/unhovering', async () => {
    // Arrange
    const user = userEvent.setup();

    const onMouseEnter = jest.fn();
    const onMouseLeave = jest.fn();
    renderTooltipTrigger({}, { onMouseEnter, onMouseLeave });

    const btn = screen.getByRole('button');

    // Act
    await user.hover(btn);
    await user.unhover(btn);

    // Assert
    expect(onMouseEnter).toHaveBeenCalled();
    expect(onMouseLeave).toHaveBeenCalled();
  });

  it('calls child event handlers when focusing/blurring', () => {
    // Arrange
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    renderTooltipTrigger({}, { onFocus, onBlur });

    const btn = screen.getByRole('button');

    // Act
    act(() => {
      btn.focus();
    });

    act(() => {
      btn.blur();
    });

    // Assert
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
  });

  it(
    'allows delaying showing the tooltip',
    withFakeTimers(async () => {
      // Arrange
      renderTooltipTrigger({ delay: 1000 });

      const btn = screen.getByRole('button');

      // Act
      act(() => {
        btn.focus();
      });

      const tooltip = within(getPopupRoot()).getByText(tooltipContent);

      const isShownAfterFocus = tooltip.style.display !== 'none';

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const isShownAfterDelay = tooltip.style.display !== 'none';

      // Assert
      expect(isShownAfterFocus).toBe(false);
      expect(isShownAfterDelay).toBe(true);
    })
  );

  describe('accessibility', () => {
    it('marks child as described by tooltip content', () => {
      // Act
      renderTooltipTrigger();

      // Assert
      const btn = screen.getByRole('button');
      expect(btn).toHaveAccessibleDescription(tooltipContent);
    });

    it('can label child with tooltip content instead of describing it', () => {
      // Act
      renderTooltipTrigger({
        useTooltipAsLabel: true,
      });

      // Assert
      const btn = screen.getByRole('button');
      expect(btn).not.toHaveAccessibleDescription();
      expect(btn).toHaveAccessibleName(tooltipContent);
    });

    it('automatically labels child with tooltip content if child only contains an unlabelled icon', () => {
      // Act
      renderTooltipTrigger(
        {},
        {
          children: <Icon icon='plus' />,
        }
      );

      // Assert
      const btn = screen.getByRole('button');
      expect(btn).not.toHaveAccessibleDescription();
      expect(btn).toHaveAccessibleName(tooltipContent);
    });
  });
});
