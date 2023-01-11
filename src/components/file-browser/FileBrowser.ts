import { Fragment, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import DirectoryTree from 'src/components/file-browser/DirectoryTree'
import { basename } from 'src/components/file-browser/file-browser-utils'
import { FileDetails } from 'src/components/file-browser/FileDetails'
import FilesInDirectory from 'src/components/file-browser/FilesInDirectory'
import PathBreadcrumbs from 'src/components/file-browser/PathBreadcrumbs'
import Modal from 'src/components/Modal'
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import colors from 'src/libs/colors'
import { dataTableVersionsPathRoot } from 'src/libs/data-table-versions'
import * as Utils from 'src/libs/utils'


interface FileBrowserProps {
  provider: FileBrowserProvider
  rootLabel: string
  title: string
  workspace: any // TODO: Type for workspace
}

const FileBrowser = ({ provider, rootLabel, title, workspace }: FileBrowserProps) => {
  const [path, setPath] = useState('')

  const [focusedFile, setFocusedFile] = useState<FileBrowserFile | null>(null)

  const [selectedFiles, setSelectedFiles] = useState<{ [path: string]: FileBrowserFile }>({})
  useEffect(() => {
    setSelectedFiles({})
  }, [path])

  const editWorkspaceError = Utils.editWorkspaceError(workspace)
  const { editDisabled, editDisabledReason } = Utils.cond(
    [!!editWorkspaceError, () => ({ editDisabled: true, editDisabledReason: editWorkspaceError })],
    [path.startsWith(`${dataTableVersionsPathRoot}/`), () => ({
      editDisabled: true,
      editDisabledReason: 'This folder is managed by data table versioning and cannot be edited here.',
    })],
    () => ({ editDisabled: false, editDisabledReason: undefined })
  )

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
            rootLabel,
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
            rootLabel,
            onClickPath: setPath
          })
        ]),
        h(FilesInDirectory, {
          editDisabled,
          editDisabledReason,
          provider,
          path,
          rootLabel,
          selectedFiles,
          setSelectedFiles,
          onClickFile: setFocusedFile
        })
      ])
    ]),

    focusedFile && h(Modal, {
      'aria-label': 'File details',
      showCancel: false,
      title: basename(focusedFile.path),
      onDismiss: () => setFocusedFile(null),
    }, [
      h(FileDetails, { file: focusedFile, provider })
    ]),
  ])
}

export default FileBrowser
