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
