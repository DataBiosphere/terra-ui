import pluralize from 'pluralize'
import { div, h } from 'react-hyperscript-helpers'
import { DeleteConfirmationModal } from 'src/components/common'
import { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import colors from 'src/libs/colors'

import { basename } from './file-browser-utils'


type DeleteFilesConfirmationModalProps = {
  files: FileBrowserFile[]
}

export const DeleteFilesConfirmationModal = ({ files, ...props }: DeleteFilesConfirmationModalProps) => {
  const numFiles = files.length
  // @ts-expect-error
  return h(DeleteConfirmationModal, {
    ...props,
    title: `Delete ${pluralize('file', numFiles, true)}`,
    buttonText: `Delete ${numFiles === 1 ? 'file' : 'files'}`
  }, [
    // Size the scroll container to cut off the last row to hint that there's more content to be scrolled into view
    // Row height calculation is font size * line height + padding + border
    div({ style: { maxHeight: 'calc((1em * 1.15 + 1rem + 1px) * 10.5)', overflowY: 'auto', margin: '0 -1.25rem' } },
      files.map((file, i) => div({
        style: {
          borderTop: i === 0 ? undefined : `1px solid ${colors.light()}`,
          padding: '0.5rem 1.25rem'
        }
      }, [basename(file.path)]))
    )
  ])
}
