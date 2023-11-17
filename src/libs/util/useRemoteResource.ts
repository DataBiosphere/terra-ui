import { useCallback, useEffect, useState } from 'react';
import { reportError } from 'src/libs/error';

/**
 * Custom LoadedState because we always have a value for the profile from the global state.
 */
interface RemoteResourceLoadedState<T> {
  /** Status of a request to refresh the remote resource. */
  status: 'Loading' | 'Ready' | 'Error';

  /** The remote resource. */
  resource: T;
}

export interface UseRemoteResourceResult<T> {
  /** The remote ressource and its refresh status. */
  resourceState: RemoteResourceLoadedState<T>;
}

export const useRemoteResource = <T>(
  initialState: T,
  callback: () => Promise<T>,
  errorMessage: string
): UseRemoteResourceResult<T> => {
  const [resource, setResource] = useState(initialState);

  const [status, setStatus] = useState<'Loading' | 'Ready' | 'Error'>('Loading');

  const load = useCallback(async () => {
    setStatus('Loading');
    try {
      const newResource = await callback();
      setResource(newResource);
      setStatus('Ready');
    } catch (err) {
      reportError(errorMessage, err);
      setStatus('Error');
    }
  }, [callback, errorMessage]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    resourceState: { status, resource },
  };
};
