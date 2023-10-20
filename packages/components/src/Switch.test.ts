import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';

import { renderWithTheme } from './internal/test-utils';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders a switch', () => {
    // Act
    renderWithTheme(h(Switch, { checked: false, onChange: jest.fn() }));

    // Assert
    screen.getByRole('switch');
  });

  it.each([{ checked: true }, { checked: false }])('is controlled ($checked)', ({ checked }) => {
    // Act
    renderWithTheme(h(Switch, { checked, onChange: jest.fn() }));

    // Assert
    const inputElement: HTMLInputElement = screen.getByRole('switch');
    expect(inputElement.checked).toBe(checked);
  });

  it('renders labels for each state', () => {
    // Arrange
    const onLabel = 'On';
    const offLabel = 'Off';

    // Act
    renderWithTheme(h(Switch, { checked: false, onLabel, offLabel, onChange: jest.fn() }));

    // Assert
    screen.getByText(onLabel);
    screen.getByText(offLabel);
  });

  it('calls onChange with new value', async () => {
    // Arrange
    const user = userEvent.setup();

    const onChange = jest.fn();
    renderWithTheme(h(Switch, { checked: false, onChange }));

    const inputElement = screen.getByRole('switch');

    // Act
    await user.click(inputElement);

    // Assert
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('forwards ref object to input element', () => {
    // Arrange
    const ref = { current: null };

    // Act
    renderWithTheme(h(Switch, { ref, checked: false, onChange: jest.fn() }));

    // Assert
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('forwards function ref to input element', () => {
    // Arrange
    const ref = jest.fn();

    // Act
    renderWithTheme(h(Switch, { ref, checked: false, onChange: jest.fn() }));

    // Assert
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });
});
