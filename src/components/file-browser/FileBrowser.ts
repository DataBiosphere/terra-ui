import { Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import DirectoryTree from 'src/components/file-browser/DirectoryTree'
import FilesInDirectory from 'src/components/file-browser/FilesInDirectory'
import PathBreadcrumbs from 'src/components/file-browser/PathBreadcrumbs'
import UriViewer from 'src/components/UriViewer'
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'


interface FileBrowserProps {
  provider: FileBrowserProvider
  title: string
  workspace: any // TODO: Type for workspace
}

const FileBrowser = ({ provider, title, workspace }: FileBrowserProps) => {
  const [path, setPath] = useState('')

  const [focusedFile, setFocusedFile] = useState<FileBrowserFile | null>(null)

  const [selectedFiles, setSelectedFiles] = useState<{ [path: string]: FileBrowserFile }>({})
  useEffect(() => {
    setSelectedFiles({})
  }, [path])

  const editWorkspaceError = Utils.editWorkspaceError(workspace)
  const canEditWorkspace = !editWorkspaceError

  return h(Fragment, [
    div({ style: { display: 'flex', height: '100%' } }, [
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
            onSelectDirectory: selectedDirectoryPath => {
              setPath(selectedDirectoryPath)
            }
          })
        ])
      ]),
      div({
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: '1 0 0'
        }
      }, [
        div({
          style: {
            display: 'flex',
            flexFlow: 'row wrap',
            alignItems: 'center',
            width: '100%',
            padding: '0.5rem',
            borderBottom: `0.5px solid ${colors.dark(0.2)}`,
            backgroundColor: colors.light(0.4)
          }
        }, [
          h(PathBreadcrumbs, {
            path,
            rootLabel: 'Workspace bucket',
            onClickPath: setPath
          })
        ]),
        h(FilesInDirectory, {
          editDisabled: !canEditWorkspace,
          editDisabledReason: editWorkspaceError,
          provider,
          path,
          rootLabel: 'Workspace bucket',
          selectedFiles,
          setSelectedFiles,
          onClickFile: setFocusedFile
        })
      ])
    ]),

    focusedFile && h(UriViewer, {
      workspace,
      uri: focusedFile.url,
      onDismiss: () => setFocusedFile(null)
    })
  ])
}

export default FileBrowser
