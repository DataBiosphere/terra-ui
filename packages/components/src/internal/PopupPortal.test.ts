import { render } from '@testing-library/react';
import { div, h } from 'react-hyperscript-helpers';

import { getPopupRoot, PopupPortal, popupRootId } from './PopupPortal';

describe('getPopupRoot', () => {
  afterEach(() => {
    // Cleanup
    document.getElementById(popupRootId)?.remove();
  });

  it('creates popup root element if one does not exist', () => {
    // Act
    const popupRoot = getPopupRoot();

    // Assert
    expect(popupRoot).toBeInTheDocument();
    expect(popupRoot).toHaveAttribute('id', popupRootId);
    expect(popupRoot.role).toBe('complementary');
  });

  it('returns existing popup root element', () => {
    // Act
    const popupRoot1 = getPopupRoot();
    const popupRoot2 = getPopupRoot();

    // Assert
    expect(popupRoot1).toBe(popupRoot2);
    expect(document.querySelectorAll(`#${popupRootId}`).length).toBe(1);
  });
});

describe('PopupPortal', () => {
  it('renders children into popup root element', () => {
    // Act
    render(h(PopupPortal, [div(['Hello world'])]));

    // Assert
    expect(document.getElementById(popupRootId)).toHaveTextContent('Hello world');
  });
});
