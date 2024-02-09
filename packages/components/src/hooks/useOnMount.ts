import { EffectCallback, useEffect } from 'react';

export const useOnMount = (fn: EffectCallback): void => {
  useEffect(fn, []); // eslint-disable-line react-hooks/exhaustive-deps
};
