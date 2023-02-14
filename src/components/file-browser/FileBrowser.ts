import { Fragment, useCallback, useEffect, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import DirectoryTree from 'src/components/file-browser/DirectoryTree'
import { basename, dirname } from 'src/components/file-browser/file-browser-utils'
import { FileDetails } from 'src/components/file-browser/FileDetails'
import FilesInDirectory from 'src/components/file-browser/FilesInDirectory'
import PathBreadcrumbs from 'src/components/file-browser/PathBreadcrumbs'
import Modal from 'src/components/Modal'
import RequesterPaysModal from 'src/components/RequesterPaysModal'
import FileBrowserProvider, { FileBrowserDirectory, FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import colors from 'src/libs/colors'
import { dataTableVersionsPathRoot } from 'src/libs/data-table-versions'
import { requesterPaysProjectStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'


interface FileBrowserProps {
  provider: FileBrowserProvider
  rootLabel: string
  title: string
  workspace: any // TODO: Type for workspace
}

const FileBrowser = ({ provider, rootLabel, title, workspace }: FileBrowserProps) => {
  const [path, setPath] = useState('')

  // refreshKey is a hack to make hooks in DirectoryTree and FilesInDirectory reload
  // after selecting a workspace to bill requester pays request to.
  const [refreshKey, setRefreshKey] = useState(0)

  const [focusedFile, setFocusedFile] = useState<FileBrowserFile | null>(null)

  const [selectedFiles, setSelectedFiles] = useState<{ [path: string]: FileBrowserFile }>({})
  useEffect(() => {
    setSelectedFiles({})
  }, [path])

  const [showRequesterPaysModal, setShowRequesterPaysModal] = useState(false)
  const onError = useCallback((error: Error) => {
    if ((error as any).requesterPaysError) {
      setShowRequesterPaysModal(true)
    }
  }, [])

  const editWorkspaceError = Utils.editWorkspaceError(workspace)
  const { editDisabled, editDisabledReason } = Utils.cond(
    [!!editWorkspaceError, () => ({ editDisabled: true, editDisabledReason: editWorkspaceError })],
    [path.startsWith(`${dataTableVersionsPathRoot}/`), () => ({
      editDisabled: true,
      editDisabledReason: 'This folder is managed by data table versioning and cannot be edited here.',
    })],
    () => ({ editDisabled: false, editDisabledReason: undefined })
  )

  const reloadRequests = Utils.subscribable()

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
            key: refreshKey,
            provider,
            reloadRequests,
            rootLabel,
            selectedDirectory: path,
            onError,
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
          key: refreshKey,
          editDisabled,
          editDisabledReason,
          provider,
          path,
          rootLabel,
          selectedFiles,
          setSelectedFiles,
          // TODO: Aaron
          onClickFile: setFocusedFile,
          onCreateDirectory: (directory: FileBrowserDirectory) => {
            setPath(directory.path)
            const parentPath = dirname(directory.path)
            reloadRequests.next(parentPath)
          },
          onDeleteDirectory: () => {
            const parentPath = dirname(path)
            setPath(parentPath)
            reloadRequests.next(parentPath)
          },
          onError,
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

    showRequesterPaysModal && h(RequesterPaysModal, {
      onDismiss: () => setShowRequesterPaysModal(false),
      onSuccess: selectedGoogleProject => {
        requesterPaysProjectStore.set(selectedGoogleProject)
        setShowRequesterPaysModal(false)
        setRefreshKey(k => k + 1)
      }
    }),
  ])
}

export default FileBrowser
