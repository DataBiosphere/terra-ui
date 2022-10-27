import { useCallback, useEffect, useRef, useState } from 'react'
import type IncrementalResponse from 'src/libs/ajax/IncrementalResponse'


type GetIncrementalResponse<T> = (options: { signal: AbortSignal }) => Promise<IncrementalResponse<T>>

const useIncrementalResponse = <T>(getFirstPage: GetIncrementalResponse<T>) => {
  const response = useRef<IncrementalResponse<T> | null>(null)
  const abortController = useRef(new AbortController())

  const [error, setError] = useState<Error | null>(null)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<T[]>([])

  const loadPageAndUpdateState = useCallback(async (getPage: GetIncrementalResponse<T>) => {
    setIsLoading(true)
    try {
      const signal = abortController.current.signal
      response.current = await getPage({ signal })
      setItems(response.current.items)
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
    setItems([])
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
    items
  }
}

export default useIncrementalResponse
