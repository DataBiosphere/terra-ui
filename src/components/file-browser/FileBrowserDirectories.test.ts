import '@testing-library/jest-dom'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { h } from 'react-hyperscript-helpers'
import { useDirectoriesInDirectory } from 'src/components/file-browser/file-browser-hooks'
import { FileBrowserDirectory } from 'src/components/file-browser/FileBrowserDirectories'
import FileBrowserProvider from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import { asMockedFn } from 'src/testing/test-utils'


jest.mock('src/components/file-browser/file-browser-hooks', () => ({
  ...jest.requireActual('src/components/file-browser/file-browser-hooks'),
  useDirectoriesInDirectory: jest.fn()
}))

type UseDirectoriesInDirectoryResult = ReturnType<typeof useDirectoriesInDirectory>

const mockFileBrowserProvider: FileBrowserProvider = {} as FileBrowserProvider

describe('FileBrowserDirectory', () => {
  it('renders the directory name', () => {
    // Act
    render(h(FileBrowserDirectory, {
      activeDescendant: 'node-0',
      level: 0,
      id: 'node-0',
      path: 'path/to/directory/',
      provider: mockFileBrowserProvider,
      rootLabel: 'Workspace bucket',
      selectedDirectory: '',
      setActiveDescendant: () => {},
      onSelectDirectory: jest.fn()
    }))

    // Assert
    screen.getByText('directory')
  })

  it('it calls onSelectDirectory callback with path when directory name is clicked', async () => {
    // Arrange
    const user = userEvent.setup()

    const onSelectDirectory = jest.fn()
    render(h(FileBrowserDirectory, {
      activeDescendant: 'node-0',
      id: 'node-0',
      level: 0,
      path: 'path/to/directory/',
      provider: mockFileBrowserProvider,
      rootLabel: 'Workspace bucket',
      selectedDirectory: '',
      setActiveDescendant: () => {},
      onSelectDirectory
    }))

    // Act
    const link = screen.getByText('directory')
    await user.click(link)

    // Assert
    expect(onSelectDirectory).toHaveBeenCalledWith('path/to/directory/')
  })

  it('fetches and renders directory contents when expanded', async () => {
    // Arrange
    const user = userEvent.setup()

    const directories = [
      {
        path: 'path/to/directory/subdirectory1'
      },
      {
        path: 'path/to/directory/subdirectory2'
      },
      {
        path: 'path/to/directory/subdirectory3'
      }
    ]

    const useDirectoriesInDirectoryResult: UseDirectoriesInDirectoryResult = {
      state: { directories, status: 'Ready' },
      hasNextPage: undefined,
      loadNextPage: () => Promise.resolve(),
      loadAllRemainingItems: () => Promise.resolve(),
      reload: () => Promise.resolve()
    }

    asMockedFn(useDirectoriesInDirectory).mockReturnValue(useDirectoriesInDirectoryResult)

    render(h(FileBrowserDirectory, {
      activeDescendant: 'node-0',
      id: 'node-0',
      level: 0,
      path: 'path/to/directory/',
      provider: mockFileBrowserProvider,
      rootLabel: 'Workspace bucket',
      selectedDirectory: '',
      setActiveDescendant: () => {},
      onSelectDirectory: jest.fn()
    }))

    // Act
    const contentsFetchedBeforeExpanding = asMockedFn(useDirectoriesInDirectory).mock.calls.length > 0
    const toggle = screen.getByTestId('toggle-expanded')
    await user.click(toggle)
    const contentsFetchedAfterExpanding = asMockedFn(useDirectoriesInDirectory).mock.calls.length > 0

    const subdirectoryList = screen.getByRole('group')
    const renderedSubdirectories = Array.from(subdirectoryList.children).map(el => el.children[1].textContent)

    // Assert
    expect(contentsFetchedBeforeExpanding).toBe(false)
    expect(contentsFetchedAfterExpanding).toBe(true)

    expect(renderedSubdirectories).toEqual(['subdirectory1', 'subdirectory2', 'subdirectory3'])
  })

  it.each([
    { state: { status: 'Loading', directories: [] }, expectedMessage: 'Loading...' },
    { state: { status: 'Error', error: new Error('Something went wrong'), directories: [] }, expectedMessage: 'Error loading contents' }
  ] as { state: UseDirectoriesInDirectoryResult['state']; expectedMessage: string }[])(
    'it renders a status message while loading contents or on an error loading contents ($state.status)',
    async ({ state, expectedMessage }) => {
      // Arrange
      const user = userEvent.setup()

      const useDirectoriesInDirectoryResult: UseDirectoriesInDirectoryResult = {
        state,
        hasNextPage: false,
        loadNextPage: () => Promise.resolve(),
        loadAllRemainingItems: () => Promise.resolve(),
        reload: () => Promise.resolve()
      }

      asMockedFn(useDirectoriesInDirectory).mockReturnValue(useDirectoriesInDirectoryResult)

      render(h(FileBrowserDirectory, {
        activeDescendant: 'node-0',
        id: 'node-0',
        level: 0,
        path: 'path/to/directory/',
        provider: mockFileBrowserProvider,
        rootLabel: 'Workspace bucket',
        selectedDirectory: '',
        setActiveDescendant: () => {},
        onSelectDirectory: jest.fn()
      }))

      // Act
      const toggle = screen.getByTestId('toggle-expanded')
      await user.click(toggle)

      // Assert
      screen.getByText(expectedMessage)
    }
  )

  describe('when next page is available', () => {
    // Arrange
    const loadNextPage = jest.fn()
    const loadAllRemainingItems = jest.fn()

    const directories = [
      {
        path: 'path/to/directory/subdirectory1'
      }
    ]

    const useDirectoriesInDirectoryResult: UseDirectoriesInDirectoryResult = {
      state: { directories, status: 'Ready' },
      hasNextPage: true,
      loadNextPage,
      loadAllRemainingItems,
      reload: () => Promise.resolve()
    }

    beforeEach(() => {
      asMockedFn(useDirectoriesInDirectory).mockReturnValue(useDirectoriesInDirectoryResult)
    })

    it('renders a button to load next page', async () => {
      // Arrange
      const user = userEvent.setup()

      render(h(FileBrowserDirectory, {
        activeDescendant: 'node-0',
        id: 'node-0',
        level: 0,
        path: 'path/to/directory/',
        provider: mockFileBrowserProvider,
        rootLabel: 'Workspace bucket',
        selectedDirectory: '',
        setActiveDescendant: () => {},
        onSelectDirectory: jest.fn()
      }))

      const toggle = screen.getByTestId('toggle-expanded')
      await user.click(toggle)

      // Assert
      const loadNextPageButton = screen.getByText('Load next page')
      await user.click(loadNextPageButton)
      expect(loadNextPage).toHaveBeenCalled()
    })
  })
})
