import { Dispatch, Fragment, ReactNode, SetStateAction, useEffect, useRef, useState } from 'react'
import { h, li, p, span, ul } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { useDirectoriesInDirectory } from 'src/components/file-browser/file-browser-hooks'
import { basename } from 'src/components/file-browser/file-browser-utils'
import { icon } from 'src/components/icons'
import Interactive, { InteractiveProps } from 'src/components/Interactive' // eslint-disable-line import/named
import FileBrowserProvider from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


interface FileBrowserDirectoryContentsProps {
  activeDescendant: string
  level: number
  parentId: string
  path: string
  provider: FileBrowserProvider
  rootLabel: string
  selectedDirectory: string
  setActiveDescendant: Dispatch<SetStateAction<string>>
  onFinishedLoading: () => void
  onSelectDirectory: (path: string) => void
}

const renderDirectoryStatus = (level: number, children: ReactNode) => p({
  style: {
    // Match padding + border of tree items.
    padding: 'calc(0.25rem + 1px) 0.5rem',
    // Align with arrow icons of tree items.
    margin: `0 0 0 ${level + 0.75}rem`
  }
}, [children])

export const FileBrowserDirectoryContents = (props: FileBrowserDirectoryContentsProps) => {
  const {
    activeDescendant,
    level,
    parentId,
    path,
    provider,
    rootLabel,
    selectedDirectory,
    setActiveDescendant,
    onFinishedLoading,
    onSelectDirectory
  } = props

  const directoryLabel = path === '' ? rootLabel : basename(path)

  const loadedAlertElementRef = useRef<HTMLSpanElement | null>(null)

  const {
    state: { status, directories },
    hasNextPage,
    loadNextPage
  } = useDirectoriesInDirectory(provider, path)

  useEffect(() => {
    if (status === 'Ready' || status === 'Error') {
      onFinishedLoading()
    }

    if (status === 'Ready') {
      loadedAlertElementRef.current!.innerHTML = `Loaded ${directoryLabel} subdirectories`
    }
    if (status === 'Error') {
      loadedAlertElementRef.current!.innerHTML = `Error loading ${directoryLabel} subdirectories`
    }
  }, [directoryLabel, onFinishedLoading, status])

  return h(Fragment, [
    span({
      ref: loadedAlertElementRef,
      'aria-live': 'polite',
      className: 'sr-only',
      role: 'alert',
    }),
    status === 'Loading' && span({
      'aria-live': 'assertive',
      className: 'sr-only',
      role: 'alert',
    }, [`Loading ${directoryLabel} subdirectories`]),
    status === 'Error' && renderDirectoryStatus(level, 'Error loading subdirectories'),
    (status === 'Ready' || directories.length > 0) && ul({
      'aria-label': `${directoryLabel} subdirectories`,
      role: 'group',
      style: {
        padding: 0,
        margin: 0,
        listStyleType: 'none'
      }
    }, [
      directories.map((directory, index) => {
        return h(FileBrowserDirectory, {
          key: directory.path,
          activeDescendant,
          id: `${parentId}-${index}`,
          level: level + 1,
          path: directory.path,
          provider,
          rootLabel,
          selectedDirectory,
          setActiveDescendant,
          onSelectDirectory
        })
      }),
      hasNextPage && li({
        // aria-level starts at 1, level starts at 0.
        'aria-level': level + 1,
        id: `${parentId}-load-next`,
        role: 'treeitem',
        style: {
          display: 'flex',
          flexDirection: 'column'
        }
      }, [
        h(Link, {
          role: 'presentation',
          tabIndex: -1,
          style: {
            // Align with directory tree item arrow icons.
            padding: `0.25rem 0.5rem 0.25rem ${level + 1.25}rem`,
            borderColor: `${parentId}-load-next` === activeDescendant ? colors.accent() : 'transparent',
            borderStyle: 'solid',
            borderWidth: '1px 0'
          },
          onClick: () => loadNextPage()
        }, ['Load next page'])
      ])
    ])
  ])
}

interface FileBrowserDirectoryProps {
  activeDescendant: string
  id: string
  provider: FileBrowserProvider
  level: number
  path: string
  rootLabel: string
  selectedDirectory: string
  setActiveDescendant: Dispatch<SetStateAction<string>>
  onSelectDirectory: (path: string) => void
}

export const FileBrowserDirectory = (props: FileBrowserDirectoryProps) => {
  const {
    activeDescendant,
    id,
    level,
    path,
    provider,
    rootLabel,
    selectedDirectory,
    setActiveDescendant,
    onSelectDirectory
  } = props
  const isSelected = path === selectedDirectory

  const [isExpanded, setIsExpanded] = useState(false)
  const [hasLoadedContents, setHasLoadedContents] = useState(false)

  return li({
    'aria-expanded': isExpanded,
    // Label with the link to read only the directory basename instead of both the basename and the subdirectories list label.
    'aria-labelledby': `${id}-link`,
    // aria-level starts at 1, level starts at 0.
    'aria-level': level + 1,
    // aria-selected: false results in every tree item being read as "selected".
    'aria-selected': isSelected ? true : undefined,
    // Data attribute allows getting the directory path from the activedescendant element ID.
    'data-path': path,
    id,
    role: 'treeitem',
    style: {
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }
  }, [
    // Wrapper span provides a larger click target than just the icon.
    span({
      'aria-hidden': true,
      'data-testid': 'toggle-expanded',
      style: {
        position: 'absolute',
        top: '1px',
        left: `${level - 1}rem`,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '2rem',
        height: '1.5rem'
      },
      onClick: () => setIsExpanded(v => !v)
    }, [
      icon(Utils.cond(
        [isExpanded && hasLoadedContents, () => 'angle-down'],
        [isExpanded && !hasLoadedContents, () => 'loadingSpinner'],
        [!isExpanded, () => 'angle-right']
      ), {
        // @ts-expect-error
        color: isSelected ? '#000' : colors.accent(),
        size: 14
      })
    ]),
    h(Link, {
      id: `${id}-link`,
      role: 'presentation',
      tabIndex: -1,
      style: {
        display: 'inline-block',
        overflow: 'hidden',
        maxWidth: '100%',
        padding: `0.25rem 0.5rem 0.25rem ${level + 1.25}rem`,
        borderColor: id === activeDescendant ? colors.accent() : 'transparent',
        borderStyle: 'solid',
        borderWidth: '1px 0',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        ...(isSelected && {
          color: '#000'
        })
      },
      ...(isSelected && {
        hover: { color: '#000' }
      }),
      onClick: () => {
        onSelectDirectory(path)
      }
    }, [path === '' ? rootLabel : basename(path)]),
    isExpanded && h(FileBrowserDirectoryContents, {
      activeDescendant,
      level,
      parentId: id,
      path,
      provider,
      rootLabel,
      selectedDirectory,
      setActiveDescendant,
      onFinishedLoading: () => setHasLoadedContents(true),
      onSelectDirectory
    })
  ])
}

interface FileBrowserDirectoriesProps {
  provider: FileBrowserProvider
  selectedDirectory: string
  onSelectDirectory: (path: string) => void
}

const FileBrowserDirectories = (props: FileBrowserDirectoriesProps) => {
  const {
    provider,
    selectedDirectory,
    onSelectDirectory
  } = props

  const treeElementRef = useRef<HTMLUListElement | null>(null)

  const [activeDescendant, setActiveDescendant] = useState('node-0')

  return h(Interactive, {
    as: 'ul',
    ref: treeElementRef,
    // aria-activedescendant tells which tree item is "focused", while actual focus stays on the tree itself.
    'aria-activedescendant': activeDescendant,
    'aria-label': 'Workspace files',
    role: 'tree',
    tabIndex: 0,
    style: {
      padding: 0,
      border: '2px solid transparent',
      margin: 0,
      listStyleType: 'none'
    },
    hover: {
      border: `2px solid ${colors.accent()}`
    },
    onKeyDown: e => {
      // If the key isn't relevant to tree navigation, do nothing.
      if (!(e.key === 'Enter' || e.key.startsWith('Arrow'))) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      const currentTreeItem = document.getElementById(activeDescendant)

      if (!currentTreeItem) {
        // If the active descendant isn't found (for example, if it was in a group that has been collapsed),
        // then reset the active descendant to the first item in the tree.
        setActiveDescendant('node-0')
      } else if (e.key === 'Enter') {
        if (currentTreeItem.id.endsWith('-load-next')) {
          // If on a load next page tree item, load the next page.
          (currentTreeItem.firstElementChild as HTMLElement)!.click()
        } else {
          // Otherwise, select the path for the current tree item.
          onSelectDirectory(currentTreeItem.dataset.path!)
        }
      } else if (e.key === 'ArrowLeft') {
        const isExpanded = currentTreeItem.getAttribute('aria-expanded') === 'true'
        if (isExpanded) {
          // Close the tree item if it is open.
          (currentTreeItem.firstElementChild as HTMLElement)!.click()
        } else {
          // If the tree item is closed, move to the parent tree item (if there is one).
          const parentGroup = currentTreeItem.parentElement!
          if (parentGroup.getAttribute('role') === 'group') {
            // If the parent group is a group within the tree, move up the tree.
            // Else if the parent group is the tree itself, do nothing.
            const parentTreeItem = parentGroup.parentElement!
            setActiveDescendant(parentTreeItem.id)
          }
        }
      } else if (e.key === 'ArrowRight') {
        const expanded = currentTreeItem.getAttribute('aria-expanded')
        if (expanded === 'false') {
          // Open the tree item if it is currently closed.
          (currentTreeItem.firstElementChild as HTMLElement)!.click()
        } else if (expanded === 'true') {
          // Move to the first child node.
          // If the current tree item has no children, then do nothing.
          const firstChildTreeItem = currentTreeItem.lastElementChild!.firstElementChild
          if (firstChildTreeItem) {
            setActiveDescendant(firstChildTreeItem.id)
          }
        }
      } else if (e.key === 'ArrowDown') {
        // Move to the next tree item without opening/closing any tree items.
        const allTreeItemIds = Array.from(treeElementRef.current!.querySelectorAll('[role="treeitem"]')).map(el => el.id)
        const indexOfCurrentTreeItem = allTreeItemIds.findIndex(id => id === activeDescendant)
        if (indexOfCurrentTreeItem < allTreeItemIds.length - 1) {
          setActiveDescendant(allTreeItemIds[indexOfCurrentTreeItem + 1])
        }
      } else if (e.key === 'ArrowUp') {
        // Move to the previous tree item without opening/closing any tree items.
        const allTreeItemIds = Array.from(treeElementRef.current!.querySelectorAll('[role="treeitem"]')).map(el => el.id)
        const indexOfCurrentTreeItem = allTreeItemIds.findIndex(id => id === activeDescendant)
        if (indexOfCurrentTreeItem > 1) {
          setActiveDescendant(allTreeItemIds[indexOfCurrentTreeItem - 1])
        }
      }
    }
  } as InteractiveProps<'ul'>, [
    h(FileBrowserDirectory, {
      activeDescendant,
      provider,
      id: 'node-0',
      level: 0,
      path: '',
      rootLabel: 'Workspace bucket',
      selectedDirectory,
      setActiveDescendant,
      onSelectDirectory
    })
  ])
}

export default FileBrowserDirectories
