import _ from 'lodash/fp'
import { useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonPrimary, Link, topSpinnerOverlay } from 'src/components/common'
import { DeleteFilesConfirmationModal } from 'src/components/file-browser/DeleteFilesConfirmationModal'
import { icon } from 'src/components/icons'
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import colors from 'src/libs/colors'
import { reportError } from 'src/libs/error'
import * as Utils from 'src/libs/utils'


interface FilesMenuProps {
  disabled?: boolean
  disabledReason?: string
  provider: FileBrowserProvider
  selectedFiles: { [path: string]: FileBrowserFile }
  onClickUpload: () => void
  onDeleteFiles: () => void
}

export const FilesMenu = (props: FilesMenuProps) => {
  const {
    disabled = false,
    disabledReason = 'Unable to edit files',
    provider,
    selectedFiles,
    onClickUpload,
    onDeleteFiles,
  } = props

  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const hasSelectedFiles = !_.isEmpty(selectedFiles)

  return div({
    style: {
      display: 'flex',
      flexFlow: 'row wrap',
      alignItems: 'center',
      width: '100%',
      padding: '0.5rem',
      borderBottom: `0.5px solid ${colors.dark(0.2)}`,
      backgroundColor: colors.light(0.4),
    },
  }, [
    h(ButtonPrimary, {
      disabled,
      tooltip: disabled ? disabledReason : undefined,
      style: { padding: '0.5rem', marginRight: '0.5rem' },
      onClick: onClickUpload
    }, [icon('upload-cloud', {
      // @ts-expect-error
      style: {
        marginRight: '1ch',
      },
    }), ' Upload']),

    h(Link, {
      disabled: disabled || !hasSelectedFiles,
      tooltip: Utils.cond(
        [disabled, () => disabledReason],
        [!hasSelectedFiles, () => 'Select files to delete'],
        () => 'Delete selected files'
      ),
      style: { padding: '0.5rem' },
      onClick: () => setConfirmingDelete(true),
    }, [icon('trash'), ' Delete']),

    confirmingDelete && h(DeleteFilesConfirmationModal, {
      files: _.values(selectedFiles),
      onConfirm: async () => {
        setConfirmingDelete(false)
        setBusy(true)
        try {
          const deleteRequests = Object.values(selectedFiles).map(file => provider.deleteFile(file.path))
          await Promise.all(deleteRequests)
        } catch (error) {
          reportError('Error deleting objects', error)
        } finally {
          setBusy(false)
          onDeleteFiles()
        }
      },
      onDismiss: () => setConfirmingDelete(false),
    }),

    busy && topSpinnerOverlay
  ])
}
