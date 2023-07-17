import { getByText, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { h } from 'react-hyperscript-helpers';
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider';

import { FilesMenu } from './FilesMenu';

jest.mock('src/components/Modal', () => {
  const { mockModalModule } = jest.requireActual('src/components/Modal.mock');
  return mockModalModule();
});

describe('FilesMenu', () => {
  describe('deleting files', () => {
    const deleteFile = jest.fn((_path: string) => Promise.resolve());
    const mockProvider = { deleteFile } as Partial<FileBrowserProvider> as FileBrowserProvider;

    const selectedFiles: { [path: string]: FileBrowserFile } = {
      'path/to/file1.txt': {
        path: 'path/to/file1.txt',
        url: 'gs://test-bucket/path/to/file1.txt',
        size: 1024,
        createdAt: 1667408400000,
        updatedAt: 1667408400000,
      },
      'path/to/file2.bam': {
        path: 'path/to/file2.bam',
        url: 'gs://test-bucket/path/to/file2.bam',
        size: 1024 ** 2,
        createdAt: 1667410200000,
        updatedAt: 1667410200000,
      },
      'path/to/file3.vcf': {
        path: 'path/to/file3.vcf',
        url: 'gs://test-bucket/path/to/file3.vcf',
        size: 1024 ** 3,
        createdAt: 1667412000000,
        updatedAt: 1667412000000,
      },
    };

    const onDeleteFiles = jest.fn();

    let user;

    beforeEach(async () => {
      // Arrange
      user = userEvent.setup();

      render(
        h(FilesMenu, {
          path: 'path/to/',
          provider: mockProvider,
          selectedFiles,
          onClickUpload: () => {},
          onCreateDirectory: () => {},
          onDeleteFiles,
        })
      );

      // Act
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);
    });

    it('prompts for confirmation before deleting files', () => {
      // Assert
      getByText(screen.getByRole('dialog'), 'Delete 3 files');
      expect(deleteFile).not.toHaveBeenCalled();
    });

    it('deletes selected files', async () => {
      // Act
      const confirmDeleteButton = screen.getByText('Delete files');
      await user.click(confirmDeleteButton);

      // Assert
      expect(deleteFile.mock.calls).toEqual([['path/to/file1.txt'], ['path/to/file2.bam'], ['path/to/file3.vcf']]);
    });

    it('calls onDeleteFiles callback', async () => {
      // Act
      const confirmDeleteButton = screen.getByText('Delete files');
      await user.click(confirmDeleteButton);

      // Assert
      expect(onDeleteFiles).toHaveBeenCalled();
    });
  });

  it('creates new folder', async () => {
    // Arrange
    const user = userEvent.setup();

    const createEmptyDirectory = jest.fn((path: string) => Promise.resolve({ path }));
    const mockProvider = {
      supportsEmptyDirectories: true,
      createEmptyDirectory,
    } as Partial<FileBrowserProvider> as FileBrowserProvider;

    const onCreateDirectory = jest.fn();

    render(
      h(FilesMenu, {
        path: 'path/to/directory/',
        provider: mockProvider,
        selectedFiles: {},
        onClickUpload: () => {},
        onCreateDirectory,
        onDeleteFiles: () => {},
      })
    );

    // Act
    const newFolderButton = screen.getByText('New folder');
    await user.click(newFolderButton);

    const nameInput = screen.getByLabelText('Folder name *');
    await user.type(nameInput, 'test-folder');

    const createButton = screen.getByText('Create Folder');
    await user.click(createButton);

    // Assert
    expect(createEmptyDirectory).toHaveBeenCalledWith('path/to/directory/test-folder/');
    expect(onCreateDirectory).toHaveBeenCalledWith({ path: 'path/to/directory/test-folder/' });
  });
});
