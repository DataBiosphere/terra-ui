import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import PathBreadcrumbs from 'src/components/file-browser/PathBreadcrumbs';

describe('PathBreadcrumbs', () => {
  it('renders path segments (including root path) as buttons', () => {
    // Act
    render(
      h(PathBreadcrumbs, {
        path: 'path/to/directory/',
        rootLabel: 'Files',
        onClickPath: jest.fn(),
      })
    );
    const buttons = screen.getAllByRole('button');
    const buttonLabels = buttons.map((button) => button.textContent);

    // Assert
    expect(buttonLabels).toEqual(['Files', 'path', 'to', 'directory']);
  });

  it('clicking a path segments calls onClickPath with the path up to that segment', async () => {
    // Arrange
    userEvent.setup();

    const onClickPath = jest.fn();
    render(
      h(PathBreadcrumbs, {
        path: 'path/to/directory/',
        rootLabel: 'Files',
        onClickPath,
      })
    );
    const buttons = screen.getAllByRole('button');

    // Act
    await userEvent.click(buttons[0]);
    await userEvent.click(buttons[1]);
    await userEvent.click(buttons[2]);
    await userEvent.click(buttons[3]);

    // Assert
    expect(onClickPath.mock.calls.length).toBe(4);
    const onClickPathCallArgs = onClickPath.mock.calls.map((call) => call[0]);
    expect(onClickPathCallArgs).toEqual(['', 'path/', 'path/to/', 'path/to/directory/']);
  });
});
