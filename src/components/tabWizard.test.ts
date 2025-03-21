import { calculateProgressBarWidth } from './tabWizard';

describe('calculateProgressBarWidth', () => {
  let setProgressBarWidth: jest.Mock;

  const mockElementProperties = (element: Element, properties: Record<string, number>) => {
    Object.entries(properties).forEach(([key, value]) => {
      Object.defineProperty(element, key, { value });
    });
  };

  beforeEach(() => {
    setProgressBarWidth = jest.fn();

    // Arrange: Create and append DOM elements
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="MainTabWrapper">
        <div role="menu" style="position: relative; left: 10px;">
          <div role="menuitem" aria-posinset="1" style="width: 100px;"></div>
          <div role="menuitem" aria-posinset="2" style="width: 150px;"></div>
          <div role="menuitem" aria-posinset="3" style="width: 200px;"></div>
        </div>
      </div>
    `;
    document.body.appendChild(container);

    // Mock clientWidth and offsetLeft values
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    const parentWrapper = document.querySelector('.MainTabWrapper') as HTMLElement;
    const menuWrapper = document.querySelector('[role="menu"]') as HTMLElement;

    mockElementProperties(menuItems[0], { clientWidth: 100 });
    mockElementProperties(menuItems[1], { clientWidth: 150 });
    mockElementProperties(menuItems[2], { clientWidth: 200 });
    mockElementProperties(parentWrapper, { offsetLeft: 0 });
    mockElementProperties(menuWrapper, { offsetLeft: 10 });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('calculates the correct progress bar width for the active tab', () => {
    // Act
    calculateProgressBarWidth('Tab 2', ['Tab 1', 'Tab 2', 'Tab 3'], setProgressBarWidth);

    // Assert
    expect(setProgressBarWidth).toHaveBeenCalledWith(10 + 100 + 150 + 10); // 10px [padding] + 100px [Tab 1] + 150px [Tab 2] + 10px [padding]
  });

  it('does not call setProgressBarWidth if elements are missing', () => {
    // Arrange: Remove elements
    document.body.innerHTML = '';

    // Act
    calculateProgressBarWidth('Tab 2', ['Tab 1', 'Tab 2', 'Tab 3'], setProgressBarWidth);

    // Assert
    expect(setProgressBarWidth).not.toHaveBeenCalled();
  });

  it('handles case when active tab is not found', () => {
    // Act
    calculateProgressBarWidth('Nonexistent Tab', ['Tab 1', 'Tab 2', 'Tab 3'], setProgressBarWidth);

    // Assert
    expect(setProgressBarWidth).not.toHaveBeenCalled();
  });
});
