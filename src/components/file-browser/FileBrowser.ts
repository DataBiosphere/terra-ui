import { div } from 'react-hyperscript-helpers'
import { useFilesInDirectory } from 'src/components/file-browser/file-browser-hooks'
import FileBrowserProvider from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'


interface FileBrowserProps {
  provider: FileBrowserProvider
}

const FileBrowser = ({ provider }: FileBrowserProps) => {
  const r = useFilesInDirectory(provider, '')
  console.log(r)

  return div(['File browser'])
}

export default FileBrowser
