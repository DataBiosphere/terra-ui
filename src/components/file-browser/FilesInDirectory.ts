import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import { useFilesInDirectory } from 'src/components/file-browser/file-browser-hooks'
import { basename } from 'src/components/file-browser/file-browser-utils'
import FilesTable from 'src/components/file-browser/FilesTable'
import { icon } from 'src/components/icons'
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


interface FilesInDirectoryProps {
  provider: FileBrowserProvider
  path: string
  rootLabel?: string
  onClickFile: (file: FileBrowserFile) => void
}

const FilesInDirectory = (props: FilesInDirectoryProps) => {
  const { provider, path, rootLabel = 'Files', onClickFile } = props

  const {
    state: { status, files },
    hasNextPage,
    loadAllRemainingItems,
    loadNextPage
  } = useFilesInDirectory(provider, path)

  const isLoading = status === 'Loading'

  return div({
    style: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 0 0'
    }
  }, [
    h(FilesTable, {
      'aria-label': `Files in ${path === '' ? rootLabel : basename(path)}`,
      files,
      noFilesMessage: Utils.cond(
        [status === 'Loading', () => 'Loading files...'],
        [status === 'Error', () => 'Unable to load files'],
        () => 'No files have been uploaded yet'
      ),
      onClickFile
    }),
    div({
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '1rem',
        borderTop: `1px solid ${colors.dark(0.2)}`,
        background: '#fff'
      }
    }, [
      div([
        `${files.length} files. `,
        isLoading && h(Fragment, [
          'Loading more... ',
          icon('loadingSpinner', { size: 12 })
        ])
      ]),
      hasNextPage !== false && div([
        h(Link, {
          disabled: isLoading,
          style: { marginLeft: '1ch' },
          onClick: () => loadNextPage()
        }, ['Load next page']),
        h(Link, {
          disabled: isLoading,
          style: { marginLeft: '1ch' },
          tooltip: 'This may take a long time for folders containing several thousand objects.',
          onClick: () => loadAllRemainingItems()
        }, ['Load all'])
      ])
    ])
  ])
}

export default FilesInDirectory
