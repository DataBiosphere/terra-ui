import { div, li, ul } from 'react-hyperscript-helpers'
import { useFilesInDirectory } from 'src/components/file-browser/file-browser-hooks'
import FileBrowserProvider from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'


interface FilesInDirectoryProps {
  provider: FileBrowserProvider
  path: string
}

const FilesInDirectory = (props: FilesInDirectoryProps) => {
  const { provider, path } = props

  const { state: { files } } = useFilesInDirectory(provider, path)

  return div([
    ul([
      files.map(file => li({
        key: file.path
      }, [file.path]))
    ])
  ])
}

export default FilesInDirectory
