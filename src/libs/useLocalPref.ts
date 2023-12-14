import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';

/**
 * The overloaded definition is required to match the signature of useState
 * If a default value is specified, the result is T
 * If a default value is not specified, the resulting type is T | undefined
 */
type UseLocalPrefHook = {
  <T>(persistenceId: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>];
  <T = undefined>(persistenceId: string, defaultValue?: T): [T | undefined, Dispatch<SetStateAction<T | undefined>>];
};

/**
 * A hook for managing state that is persisted in local storage
 * Other than the persistence in local storage, works exactly like useState
 * @param persistenceId the id under which the value will be stored
 * @param defaultValue an optional initial stave value, if there is nothing already stored
 */
export const useLocalPref: UseLocalPrefHook = <T>(
  persistenceId: string,
  defaultValue: T
): ReturnType<typeof useState<T>> => {
  const [stateVal, setStateVal] = useState(() => getLocalPref(persistenceId) || defaultValue);
  useEffect(() => setLocalPref(persistenceId, stateVal), [stateVal, persistenceId]);
  return [stateVal, setStateVal];
};
