import _ from 'lodash/fp';
import { useRef } from 'react';
import { div, h } from 'react-hyperscript-helpers';

export const ArrowKeyNavigation = ({ keyDownHandler, children, ...props }) => {
  const ref = useRef();

  // Figure out which child elements are focusable/clickable
  const focusableElements = () => {
    return ref.current.querySelectorAll('a, button, input, select, textarea, [tabindex]');
  };

  // Figure out which focusable element sent the event
  const findIndex = (event) => _.findIndex((f) => f === event.target, focusableElements());

  // A function to pass into the key handlers to focus the next element
  const focusOn = (index) => {
    const focusable = focusableElements();
    const count = focusable.length;

    // Wrap around the ends and ensure the number is positive
    const i = (index % count) + (index < 0 ? count : 0);
    focusable[i].focus();
  };

  return div(
    {
      ref,
      onKeyDown: (event) => {
        // Don't bother with the recursive calculation if it's the Tab, Enter or Space key
        switch (event.key) {
          case 'Tab':
          case 'Enter':
          case ' ':
            return;

          default:
            const i = findIndex(event);
            i > -1 && keyDownHandler(event, i, focusOn);
        }
      },
      ...props,
    },
    [children]
  );
};

/**
 * Sets up a collection of children to support horizontal navigation with the arrow keys as well as home/end.
 * This is particularly useful to support accessibility in compound ARIA components such as tablists and menus.
 *
 * @param children The children provided to this element.
 *  These must be functions which accept a props object containing `forwardedRef` and `onKeyDown` properties.
 * @param props
 * @returns An array of children for inclusion in higher-level elements
 */
export const HorizontalNavigation = ({ children, ...props }) =>
  h(
    ArrowKeyNavigation,
    {
      keyDownHandler: (event, i, focusOn) => {
        switch (event.key) {
          case 'ArrowLeft':
            focusOn(i - 1);
            break;
          case 'ArrowRight':
            focusOn(i + 1);
            break;
          case 'Home':
            focusOn(0);
            break;
          case 'End':
            focusOn(-1);
            break;
          default:
            break;
        }
      },
      ...props,
    },
    [children]
  );

/**
 * Sets up a collection of children to support vertical navigation with the arrow keys as well as home/end and pgup/pgdn
 * This is particularly useful to support accessibility in compound ARIA components such as tablists and menus.
 *
 * @param children The children provided to this element.
 *  These must be functions which accept a props object containing `forwardedRef` and `onKeyDown` properties.
 * @param props
 * @returns An array of children for inclusion in higher-level elements
 */
export const VerticalNavigation = ({ children, ...props }) =>
  h(
    ArrowKeyNavigation,
    {
      keyDownHandler: (event, i, focusOn) => {
        switch (event.key) {
          case 'ArrowUp':
            focusOn(i - 1);
            break;
          case 'ArrowDown':
            focusOn(i + 1);
            break;
          case 'Home':
          case 'PageUp':
            focusOn(0);
            break;
          case 'End':
          case 'PageDown':
            focusOn(-1);
            break;
          default:
            break;
        }
      },
      ...props,
    },
    [children]
  );
