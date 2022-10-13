import { useCallback, useEffect, useRef, useState } from 'react'
import { FileBrowserBackend, IncrementalResponse } from 'src/components/file-browser/file-browser-backends'
import { useCallbackOne } from 'use-memo-one'


type GetIncrementalResponse<T> = (options: { signal: AbortSignal }) => Promise<IncrementalResponse<T>>

export const useIncrementalResponse = <T>(getFirstPage: GetIncrementalResponse<T>) => {
  const response = useRef<IncrementalResponse<T> | null>(null)
  const abortController = useRef(new AbortController())

  const [error, setError] = useState<Error | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<T[]>([])

  const loadPageAndUpdateState = useCallback(async (getPage: GetIncrementalResponse<T>) => {
    setIsLoading(true)
    try {
      const signal = abortController.current.signal
      response.current = await getPage({ signal })
      setResults(response.current.results)
      setHasNextPage(response.current.hasNextPage)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadNextPage = useCallback(async () => {
    if (response.current?.hasNextPage) {
      await loadPageAndUpdateState(({ signal }) => response.current!.getNextPage({ signal }))
    }
  }, [loadPageAndUpdateState])

  const loadAllRemaining = useCallback(async () => {
    if (response.current?.hasNextPage) {
      await loadPageAndUpdateState(async ({ signal }) => {
        let r = response.current!
        while (r.hasNextPage) {
          r = await r.getNextPage({ signal })
        }
        return r
      })
    }
  }, [loadPageAndUpdateState])

  const reload = useCallback(async () => {
    setResults([])
    await loadPageAndUpdateState(getFirstPage)
  }, [loadPageAndUpdateState, getFirstPage])

  useEffect(() => {
    reload()
  }, [reload, getFirstPage])

  return {
    error,
    hasNextPage: isLoading ? undefined : hasNextPage,
    isLoading,
    loadAllRemaining: isLoading || !hasNextPage ? () => Promise.resolve() : loadAllRemaining,
    loadNextPage: isLoading || !hasNextPage ? () => Promise.resolve() : loadNextPage,
    reload,
    results
  }
}

export const useDirectoriesInDirectory = (backend: FileBrowserBackend, path: string) => {
  // useIncrementalResponse reloads when the getFirstPage function changes, so it should not change unless
  // backend or path changes. React's useCallback does not provide that guarantee.
  const getFirstPage = useCallbackOne(opts => backend.getDirectoriesInDirectory(path, opts), [backend, path])
  return useIncrementalResponse(getFirstPage)
}

export const useFilesInDirectory = (backend: FileBrowserBackend, path: string) => {
  // useIncrementalResponse reloads when the getFirstPage function changes, so it should not change unless
  // backend or path changes. React's useCallback does not provide that guarantee.
  const getFirstPage = useCallbackOne(opts => backend.getFilesInDirectory(path, opts), [backend, path])
  return useIncrementalResponse(getFirstPage)
}
