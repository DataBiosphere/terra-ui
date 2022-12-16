import { useEffect, useState } from 'react'
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import { reportError } from 'src/libs/error'
import { useCancellation } from 'src/libs/react-utils'
import LoadedState, { NoneState } from 'src/libs/type-utils/LoadedState'


type UseFileDownloadUrlOptions = {
  file: FileBrowserFile
  provider: FileBrowserProvider
}

type UseFileDownloadUrlResult = Exclude<LoadedState<string, unknown>, NoneState>

export const useFileDownloadUrl = (opts: UseFileDownloadUrlOptions) => {
  const { file, provider } = opts

  const [result, setResult] = useState<UseFileDownloadUrlResult>({ status: 'Loading', state: null })

  const signal = useCancellation()

  useEffect(() => {
    (async () => {
      setResult({ status: 'Loading', state: null })
      try {
        const url = await provider.getDownloadUrlForFile(file.path, { signal })
        setResult({ status: 'Ready', state: url })
      } catch (error) {
        reportError('Unable to get download URL', error)
        setResult({ status: 'Error', state: null, error })
      }
    })()
  }, [file, provider, signal])

  return result
}
