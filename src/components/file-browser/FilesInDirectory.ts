import { Dispatch, Fragment, SetStateAction, useEffect, useRef } from 'react'
import { div, h, p, span } from 'react-hyperscript-helpers'
import { Link } from 'src/components/common'
import Dropzone from 'src/components/Dropzone'
import { useFilesInDirectory } from 'src/components/file-browser/file-browser-hooks'
import { basename } from 'src/components/file-browser/file-browser-utils'
import { FilesMenu } from 'src/components/file-browser/FilesMenu'
import FilesTable from 'src/components/file-browser/FilesTable'
import { icon } from 'src/components/icons'
import { UploadProgressModal } from 'src/components/ProgressBar'
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import colors from 'src/libs/colors'
import { useUploader } from 'src/libs/uploads'
import * as Utils from 'src/libs/utils'


interface FilesInDirectoryProps {
  editDisabled?: boolean
  editDisabledReason?: string
  provider: FileBrowserProvider
  path: string
  rootLabel?: string
  selectedFiles: { [path: string]: FileBrowserFile }
  setSelectedFiles: Dispatch<SetStateAction<{ [path: string]: FileBrowserFile }>>
  onClickFile: (file: FileBrowserFile) => void
}

const FilesInDirectory = (props: FilesInDirectoryProps) => {
  const {
    editDisabled = false,
    editDisabledReason,
    path,
    provider,
    rootLabel = 'Files',
    selectedFiles,
    setSelectedFiles,
    onClickFile
  } = props

  const directoryLabel = path === '' ? rootLabel : basename(path)

  const loadedAlertElementRef = useRef<HTMLSpanElement | null>(null)

  const {
    state: { status, files },
    hasNextPage,
    loadAllRemainingItems,
    loadNextPage,
    reload,
  } = useFilesInDirectory(provider, path)

  const { uploadState, uploadFiles, cancelUpload } = useUploader(file => {
    return provider.uploadFileToDirectory(path, file)
  })

  const isLoading = status === 'Loading'

  useEffect(() => {
    loadedAlertElementRef.current!.innerHTML = Utils.switchCase(status,
      ['Loading', () => ''],
      ['Ready', () => `Loaded ${files.length} files in ${directoryLabel}`],
      ['Error', () => `Error loading files in ${directoryLabel}`]
    )
  }, [directoryLabel, files, status])

  return div({
    style: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 0 0'
    }
  }, [
    h(Dropzone, {
      disabled: editDisabled || uploadState.active,
      style: { display: 'flex', flexFlow: 'column nowrap', height: '100%' },
      activeStyle: { backgroundColor: colors.accent(0.2), cursor: 'copy' },
      multiple: true,
      maxFiles: 0, // no limit on number of files
      onDropAccepted: async files => {
        await uploadFiles(files)
        reload()
      }
      // @ts-expect-error
    }, [({ openUploader }) => h(Fragment, [
      h(FilesMenu, {
        disabled: editDisabled,
        disabledReason: editDisabledReason,
        provider,
        selectedFiles,
        onClickUpload: openUploader,
        onDeleteFiles: () => {
          setSelectedFiles({})
          reload()
        },
      }),

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
      }, [`Loading files in ${directoryLabel}`]),

      files.length > 0 && h(Fragment, [
        h(FilesTable, {
          'aria-label': `Files in ${directoryLabel}`,
          files,
          selectedFiles,
          setSelectedFiles,
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
            `${files.length} files `,
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
      ]),
      files.length === 0 && p({
        style: {
          marginTop: '1rem',
          fontStyle: 'italic',
          textAlign: 'center',
        }
      }, [
        Utils.cond(
          [status === 'Loading', () => 'Loading files...'],
          [status === 'Error', () => 'Unable to load files'],
          () => 'No files have been uploaded yet'
        )
      ])
    ])]),
    uploadState.active && h(UploadProgressModal, {
      status: uploadState,
      abort: cancelUpload
    }),
  ])
}

export default FilesInDirectory
