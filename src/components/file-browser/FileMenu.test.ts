import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider';

import { FileMenu } from './FileMenu';

describe('File menu', () => {
  const file: FileBrowserFile = {
    path: 'path/to/file.txt',
    url: 'gs://test-bucket/path/to/file.txt',
    contentType: 'text/plain',
    size: 1024,
    createdAt: 1667408400000,
    updatedAt: 1667408400000,
  };

  it('calls onRename when rename is selected', async () => {
    // Arrange
    const user = userEvent.setup();

    const onRename = jest.fn();
    render(h(FileMenu, { file, onRename }));

    // Act
    const menuButton = screen.getByLabelText('Action menu for file: file.txt');
    await user.click(menuButton);
    await user.click(screen.getByText('Rename'));

    // Assert
    expect(onRename).toHaveBeenCalledWith(file);
  });
});
