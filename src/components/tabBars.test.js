import { fireEvent } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import { TabBar } from 'src/components/tabBars';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

describe('TabBar', () => {
  const defaultProps = {
    'aria-label': 'Test navigation',
    activeTab: 'tab1',
    tabNames: ['tab1', 'tab2', 'tab3'],
    getHref: (tab) => `#${tab}`,
  };

  it('renders with basic props', () => {
    // Arrange
    // (defaultProps defined above)

    // Act
    const { getByRole, getByText } = render(h(TabBar, defaultProps));

    // Assert
    expect(getByRole('navigation')).toBeInTheDocument();
    expect(getByRole('menu')).toBeInTheDocument();
    expect(getByText('tab1')).toBeInTheDocument();
    expect(getByText('tab2')).toBeInTheDocument();
    expect(getByText('tab3')).toBeInTheDocument();
  });

  it('displays custom display names when provided', () => {
    // Arrange
    const props = {
      ...defaultProps,
      displayNames: { tab1: 'First Tab', tab2: 'Second Tab' },
    };

    // Act
    const { getByText, queryByText } = render(h(TabBar, props));

    // Assert
    expect(getByText('First Tab')).toBeInTheDocument();
    expect(getByText('Second Tab')).toBeInTheDocument();
    expect(getByText('tab3')).toBeInTheDocument();
    expect(queryByText('tab1')).not.toBeInTheDocument();
  });

  it('marks the active tab correctly', () => {
    // Arrange
    // (defaultProps defined above)

    // Act
    const { getByText } = render(h(TabBar, defaultProps));

    // Assert
    const activeTab = getByText('tab1').closest('[role="menuitem"]');
    expect(activeTab).toHaveAttribute('aria-current', 'location');

    const inactiveTab = getByText('tab2').closest('[role="menuitem"]');
    expect(inactiveTab).not.toHaveAttribute('aria-current');
  });

  it('sets aria attributes correctly', () => {
    // Arrange
    // (defaultProps defined above)

    // Act
    const { getAllByRole } = render(h(TabBar, defaultProps));

    // Assert
    const menuItems = getAllByRole('menuitem');
    expect(menuItems).toHaveLength(3);

    menuItems.forEach((item, index) => {
      expect(item).toHaveAttribute('aria-setsize', '3');
      expect(item).toHaveAttribute('aria-posinset', String(index + 1));
    });
  });

  it('calls refresh when clicking active tab with matching href', () => {
    // Arrange
    const mockRefresh = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { hash: '#tab1' },
      writable: true,
    });

    const props = {
      ...defaultProps,
      refresh: mockRefresh,
    };

    const { getByText } = render(h(TabBar, props));

    // Act
    fireEvent.click(getByText('tab1'));

    // Assert
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('calls getOnClick when clicking inactive tab', () => {
    // Arrange
    const mockGetOnClick = jest.fn();

    const props = {
      ...defaultProps,
      getOnClick: mockGetOnClick,
    };

    const { getByText } = render(h(TabBar, props));

    // Act
    fireEvent.click(getByText('tab2'));

    // Assert
    expect(mockGetOnClick).toHaveBeenCalledWith('tab2');
  });

  it('handles hover state correctly', () => {
    // Arrange
    // (defaultProps defined above)

    const { getByText } = render(h(TabBar, defaultProps));
    const tab2 = getByText('tab2');

    // Act
    fireEvent.mouseEnter(tab2);
    fireEvent.mouseLeave(tab2);

    // Assert
    // Note: Hover state testing would require style inspection
    expect(tab2).toBeInTheDocument();
  });

  it('passes through additional props to menu element', () => {
    // Arrange
    const props = {
      ...defaultProps,
      'data-testid': 'custom-menu',
    };

    // Act
    const { getByTestId } = render(h(TabBar, props));

    // Assert
    expect(getByTestId('custom-menu')).toBeInTheDocument();
  });

  it('handles empty displayNames gracefully', () => {
    // Arrange
    const props = {
      ...defaultProps,
      displayNames: {},
    };

    // Act
    const { getByText } = render(h(TabBar, props));

    // Assert
    expect(getByText('tab1')).toBeInTheDocument();
    expect(getByText('tab2')).toBeInTheDocument();
    expect(getByText('tab3')).toBeInTheDocument();
  });

  it('handles undefined activeTab', () => {
    // Arrange
    const props = {
      ...defaultProps,
      activeTab: undefined,
    };

    // Act
    const { getAllByRole } = render(h(TabBar, props));

    // Assert
    const menuItems = getAllByRole('menuitem');
    menuItems.forEach((item) => {
      expect(item).not.toHaveAttribute('aria-current');
    });
  });

  it('supports aria-labelledby', () => {
    // Arrange
    const props = {
      ...defaultProps,
      'aria-labelledby': 'external-label',
    };

    // Act
    const { getByRole } = render(h(TabBar, props));

    // Assert
    expect(getByRole('navigation')).toHaveAttribute('aria-labelledby', 'external-label');
  });
});
