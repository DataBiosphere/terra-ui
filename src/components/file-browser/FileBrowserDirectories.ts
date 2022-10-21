import { Fragment, ReactNode, useState } from 'react'
import { details, div, h, li, p, span, summary, ul } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { useDirectoriesInDirectory } from 'src/components/file-browser/file-browser-hooks'
import { basename } from 'src/components/file-browser/file-browser-utils'
import { icon } from 'src/components/icons'
import FileBrowserProvider from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import colors from 'src/libs/colors'


interface FileBrowserDirectoryContentsProps {
  provider: FileBrowserProvider
  isHighlighted: (path: string) => boolean
  level: number
  path: string
  onSelectDirectory: (path: string) => void
}

const renderDirectoryStatus = (level: number, children: ReactNode) => p({ style: { padding: '0.5rem', margin: `0 0 0.25rem ${level * 1.25}rem` } }, [children])

export const FileBrowserDirectoryContents = (props: FileBrowserDirectoryContentsProps) => {
  const { provider, isHighlighted, level, path, onSelectDirectory } = props

  const {
    state: { status, directories },
    hasNextPage,
    loadNextPage
  } = useDirectoriesInDirectory(provider, path)

  if (status === 'Error') {
    return renderDirectoryStatus(level + 1, 'Error loading contents')
  }

  return h(Fragment, [
    directories.length > 0 && ul({
      style: {
        padding: 0,
        margin: 0,
        listStyleType: 'none'
      }
    }, [
      directories.map(directory => li({
        key: directory.path
      }, [
        h(FileBrowserDirectory, {
          provider,
          isHighlighted,
          level: level + 1,
          path: directory.path,
          onSelectDirectory
        })
      ]))
    ]),
    status === 'Loading' && renderDirectoryStatus(level, 'Loading...'),
    hasNextPage && h(Link, {
      style: { display: 'inline-block', padding: '0.25rem 0.5rem', marginLeft: `${level * 1.25}rem` },
      onClick: () => loadNextPage()
    }, ['Load next page'])
  ])
}

interface FileBrowserDirectoryProps {
  provider: FileBrowserProvider
  isHighlighted: (path: string) => boolean
  level: number
  path: string
  onSelectDirectory: (path: string) => void
}

export const FileBrowserDirectory = (props: FileBrowserDirectoryProps) => {
  const { provider, isHighlighted, level, path, onSelectDirectory } = props

  const [isOpen, setIsOpen] = useState(false)
  // Don't load the directory contents until the details element is opened
  const [renderContents, setRenderContents] = useState(false)

  const indent = `${1.25 * (level - 1)}rem`

  return div({
    style: {
      position: 'relative'
    }
  }, [
    // This link cannot be nested inside the summary element, so it's absolutely
    // positioned to overlap it.
    h(Link, {
      style: {
        position: 'absolute',
        left: `calc(${indent} + 1rem + 12px)`,
        right: '0.5rem',
        overflow: 'hidden',
        padding: '0.5rem 0',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        ...(isHighlighted(path) && {
          color: '#000'
        })
      },
      ...(isHighlighted(path) && {
        hover: { color: '#000' }
      }),
      onClick: () => {
        onSelectDirectory(path)
      }
    }, [basename(path)]),
    details({
      onToggle: e => {
        // Avoid a toggle event on parent folders' details elements
        e.stopPropagation()

        const isOpen = (e.target as HTMLDetailsElement).open
        setIsOpen(isOpen)
        if (isOpen) {
          setRenderContents(true)
        }
      }
    }, [
      summary({
        style: {
          display: 'flex',
          alignItems: 'center',
          height: '2rem',
          paddingLeft: `calc(${indent} + 0.5rem`,
          marginBottom: '0.25rem',
          color: colors.accent(),
          cursor: 'pointer',
          listStyleType: 'none',
          ...(isHighlighted(path) && {
            background: colors.accent(0.1),
            color: '#000'
          })
        }
      }, [
        icon(isOpen ? 'angle-down' : 'angle-right', { size: 12 }),
        span({ className: 'sr-only' }, [`${basename(path)} subdirectories`])
      ]),
      renderContents && h(FileBrowserDirectoryContents, {
        provider,
        isHighlighted,
        level,
        path,
        onSelectDirectory
      })
    ])
  ])
}

interface FileBrowserDirectoriesProps {
  provider: FileBrowserProvider
  selectedDirectory: string
  onSelectDirectory: (path: string) => void
}

const FileBrowserDirectories = (props: FileBrowserDirectoriesProps) => {
  const { provider, selectedDirectory, onSelectDirectory } = props

  return div({
    style: {
      marginTop: '0.5rem'
    }
  }, [
    h(FileBrowserDirectoryContents, {
      provider,
      isHighlighted: path => path === selectedDirectory,
      level: 0,
      path: '',
      onSelectDirectory
    })
  ])
}

export default FileBrowserDirectories
