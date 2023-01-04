import { useEffect, useState } from 'react'
import FileBrowserProvider, { FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import { reportError } from 'src/libs/error'
import { useCancellation } from 'src/libs/react-utils'
import LoadedState, { NoneState } from 'src/libs/type-utils/LoadedState'


type UseFileDownloadCommandOptions = {
  file: FileBrowserFile
  provider: FileBrowserProvider
}

type UseFileDownloadCommandResult = Exclude<LoadedState<string, unknown>, NoneState>

export const useFileDownloadCommand = (opts: UseFileDownloadCommandOptions) => {
  const { file, provider } = opts

  const [result, setResult] = useState<UseFileDownloadCommandResult>({ status: 'Loading', state: null })

  const signal = useCancellation()

  useEffect(() => {
    (async () => {
      setResult({ status: 'Loading', state: null })
      try {
        const url = await provider.getDownloadCommandForFile(file.path, { signal })
        setResult({ status: 'Ready', state: url })
      } catch (error) {
        reportError('Unable to get download command', error)
        setResult({ status: 'Error', state: null, error })
      }
    })()
  }, [file, provider, signal])

  return result
}
