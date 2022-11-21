import FileBrowserProvider from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import useIncrementalResponse from 'src/libs/ajax/incremental-response/useIncrementalResponse'
import { useCallbackOne } from 'use-memo-one'


export const useFilesInDirectory = (provider: FileBrowserProvider, path: string) => {
  // useIncrementalResponse reloads when the getFirstPage function changes, so it should not change unless
  // provider or path changes. React's useCallback does not provide that guarantee.
  const getFirstPage = useCallbackOne(opts => provider.getFilesInDirectory(path, opts), [provider, path])
  const result = useIncrementalResponse(getFirstPage)

  const { state: files, ...otherState } = result.state
  return { ...result, state: { ...otherState, files: files! } }
}

export const useDirectoriesInDirectory = (provider: FileBrowserProvider, path: string) => {
  // useIncrementalResponse reloads when the getFirstPage function changes, so it should not change unless
  // provider or path changes. React's useCallback does not provide that guarantee.
  const getFirstPage = useCallbackOne(opts => provider.getDirectoriesInDirectory(path, opts), [provider, path])
  const result = useIncrementalResponse(getFirstPage)

  const { state: directories, ...otherState } = result.state
  return { ...result, state: { ...otherState, directories: directories! } }
}
