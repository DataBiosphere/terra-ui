import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import DirectoryTree from 'src/components/file-browser/DirectoryTree'
import FilesInDirectory from 'src/components/file-browser/FilesInDirectory'
import FileBrowserProvider from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import colors from 'src/libs/colors'


interface FileBrowserProps {
  provider: FileBrowserProvider
  title: string
}

const FileBrowser = ({ provider, title }: FileBrowserProps) => {
  const [path, setPath] = useState('')

  return div({ style: { display: 'flex', height: '100%' } }, [
    div({
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: 300,
        height: '100%',
        borderRight: `0.5px solid ${colors.dark(0.2)}`
      }
    }, [
      div({
        style: {
          padding: '1rem 0.5rem',
          borderBottom: `0.5px solid ${colors.dark(0.2)}`,
          backgroundColor: colors.light(0.4)
        }
      }, [title]),
      div({
        style: {
          flex: '1 0 0',
          overflow: 'hidden auto',
          background: '#fff'
        }
      }, [
        h(DirectoryTree, {
          provider,
          selectedDirectory: path,
          onSelectDirectory: setPath
        })
      ])
    ]),
    div({ style: { flex: '1 0 0' } }, [
      h(FilesInDirectory, { provider, path })
    ])
  ])
}

export default FileBrowser
