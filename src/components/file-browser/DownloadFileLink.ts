import { h } from 'react-hyperscript-helpers'
import { ButtonPrimary } from 'src/components/common'
import { basename } from 'src/components/file-browser/file-browser-utils'
import { useFileDownloadUrl } from 'src/components/file-browser/useFileDownloadUrl'
import { spinner } from 'src/components/icons'
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import * as Utils from 'src/libs/utils'


interface DownloadFileLinkProps {
  file: FileBrowserFile
  provider: FileBrowserProvider
}

export const DownloadFileLink = (props: DownloadFileLinkProps) => {
  const { file, provider } = props

  const { status, state: downloadUrl } = useFileDownloadUrl({ file, provider })

  return h(ButtonPrimary, {
    ...Utils.newTabLinkProps,
    disabled: !downloadUrl,
    download: basename(file.path),
    href: downloadUrl,
  }, [
    'Download',
    // @ts-expect-error
    status === 'Loading' && spinner({ size: 12, style: { color: '#fff', marginLeft: '1ch' } }),
  ])
}
