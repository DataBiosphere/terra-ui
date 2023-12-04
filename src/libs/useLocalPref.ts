import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { getLocalPref, setLocalPref } from 'src/libs/prefs';

type UseLocalPrefHook = {
  <T>(persistenceId: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>];
  <T = undefined>(persistenceId: string, defaultValue?: T): [T | undefined, Dispatch<SetStateAction<T | undefined>>];
};

export const useLocalPref: UseLocalPrefHook = <T>(
  persistenceId: string,
  defaultValue: T
): ReturnType<typeof useState<T>> => {
  const [stateVal, setStateVal] = useState(() => getLocalPref(persistenceId) || defaultValue);
  useEffect(() => setLocalPref(persistenceId, stateVal), [stateVal, persistenceId]);
  return [stateVal, setStateVal];
};
