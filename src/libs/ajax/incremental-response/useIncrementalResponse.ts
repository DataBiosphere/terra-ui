import { useCallback, useEffect, useRef, useState } from "react";
import LoadedState, { NoneState } from "src/libs/type-utils/LoadedState";

import IncrementalResponse from "./IncrementalResponse";

type GetIncrementalResponse<T> = (options: { signal: AbortSignal }) => Promise<IncrementalResponse<T>>;

type UseIncrementalResponseResult<T> = {
  state: Exclude<LoadedState<T[]>, NoneState>;
  hasNextPage: boolean | undefined;
  loadNextPage: () => Promise<void>;
  loadAllRemainingItems: () => Promise<void>;
  reload: () => Promise<void>;
};

const useIncrementalResponse = <T>(getFirstPage: GetIncrementalResponse<T>): UseIncrementalResponseResult<T> => {
  const response = useRef<IncrementalResponse<T> | null>(null);
  const [state, setState] = useState<Exclude<LoadedState<T[]>, NoneState>>({ status: "Loading", state: [] });
  const abortController = useRef(new AbortController());

  const loadPageAndUpdateState = useCallback(async (getPage: GetIncrementalResponse<T>) => {
    setState((previousState) => ({
      status: "Loading",
      state: previousState.state,
    }));
    try {
      const signal = abortController.current.signal;
      response.current = await getPage({ signal });
      setState({ status: "Ready", state: response.current.items });
    } catch (error) {
      setState((previousState) => ({
        status: "Error",
        state: previousState.state,
        error: error as Error,
      }));
    }
  }, []);

  const loadNextPage = useCallback(async () => {
    if (response.current?.hasNextPage) {
      await loadPageAndUpdateState(({ signal }) => response.current!.getNextPage({ signal }));
    }
  }, [loadPageAndUpdateState]);

  const loadAllRemainingItems = useCallback(async () => {
    if (response.current?.hasNextPage) {
      await loadPageAndUpdateState(async ({ signal }) => {
        let r = response.current!;
        while (r.hasNextPage) {
          r = await r.getNextPage({ signal });
        }
        return r;
      });
    }
  }, [loadPageAndUpdateState]);

  const reload = useCallback(async () => {
    setState({ status: "Loading", state: [] });
    await loadPageAndUpdateState(getFirstPage);
  }, [loadPageAndUpdateState, getFirstPage]);

  useEffect(() => {
    reload();
  }, [reload, getFirstPage]);

  const isLoading = state.status === "Loading";

  return {
    state,
    hasNextPage: isLoading ? undefined : response.current?.hasNextPage,
    loadAllRemainingItems:
      isLoading || !response.current?.hasNextPage ? () => Promise.resolve() : loadAllRemainingItems,
    loadNextPage: isLoading || !response.current?.hasNextPage ? () => Promise.resolve() : loadNextPage,
    reload,
  };
};

export default useIncrementalResponse;
