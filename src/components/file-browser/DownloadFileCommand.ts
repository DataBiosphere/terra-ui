import { Fragment } from 'react'
import { h, p, pre, span } from 'react-hyperscript-helpers'
import { ClipboardButton } from 'src/components/ClipboardButton'
import { useFileDownloadCommand } from 'src/components/file-browser/useFileDownloadCommand'
import { spinner } from 'src/components/icons'
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import colors from 'src/libs/colors'


interface DownloadFileCommandProps {
  file: FileBrowserFile
  provider: FileBrowserProvider
}

export const DownloadFileCommand = (props: DownloadFileCommandProps) => {
  const { file, provider } = props

  const { status, state: downloadCommand } = useFileDownloadCommand({ file, provider })

  return h(Fragment, [
    p({ style: { marginBottom: '0.5rem', fontWeight: 500 } }, [
      'Terminal download command',
      // @ts-expect-error
      status === 'Loading' && spinner({ size: 12, style: { color: '#000', marginLeft: '1ch' } }),
    ]),
    pre({
      style: {
        display: 'flex',
        alignItems: 'center',
        margin: 0,
        padding: '0 0.5rem',
        background: colors.light(0.4),
      }
    }, [
      span({
        style: {
          overflowX: 'auto',
          flex: '1 1 0',
          padding: '1rem 0',
        },
        tabIndex: 0
      }, [downloadCommand || ' ']),
      h(ClipboardButton, {
        'aria-label': 'Copy SAS URL to clipboard',
        children: undefined,
        disabled: !downloadCommand,
        style: { marginLeft: '1ch' },
        text: downloadCommand,
        onClick: undefined,
      })
    ])
  ])
}
