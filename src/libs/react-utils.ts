import { delay, safeCurry } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import {
  EffectCallback,
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { h } from 'react-hyperscript-helpers';
import { pollWithCancellation } from 'src/libs/utils';

export { useStore } from '@terra-ui-packages/components';

/**
 * Performs the given effect, but only on component mount.
 * React's hooks eslint plugin flags [] because it's a common mistake. However, sometimes this is
 * exactly the right thing to do. This function makes the intention clear and avoids the lint error.
 */
export const useOnMount = (fn: EffectCallback): void => {
  useEffect(fn, []); // eslint-disable-line react-hooks/exhaustive-deps
};

export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
};

/**
 * Given a value that changes over time, returns a getter function that reads the current value.
 * Useful for asynchronous processes that need to read the current value of e.g. props or state.
 */
export const useGetter = <T>(value: T): (() => T) => {
  const ref = useRef<T>();
  ref.current = value;
  return () => ref.current!;
};

/**
 * Given an initial value, returns a getter/setter pair that can be used to read and update the value.
 * Relies on useState for the setter and useGetter for the getter.
 * */
export const useGetSet = <T>(initialValue: T): [() => T, (value: T) => void] => {
  const [value, setValue] = useState(initialValue);
  return [useGetter(value), setValue];
};

/**
 * Calls the provided function to produce and return a value tied to this component instance.
 * The initializer function is only called once for each component instance, on first render.
 */
export const useInstance = <T>(fn: () => T): T => {
  const ref = useRef<T>();
  if (!ref.current) {
    ref.current = fn();
  }
  return ref.current;
};

type UseCancelableResult = {
  signal: AbortSignal;
  abort: () => void;
};

export const useCancelable = (): UseCancelableResult => {
  const [controller, setController] = useState(new window.AbortController());

  // Abort it automatically in the destructor
  useEffect(() => {
    return () => controller.abort();
  }, [controller]);

  return {
    signal: controller.signal,
    abort: () => {
      controller.abort();
      setController(new window.AbortController());
    },
  };
};

export const useCancellation = (): AbortSignal => {
  const controller = useRef<AbortController>();
  useOnMount(() => {
    const instance = controller.current;
    return () => instance!.abort();
  });
  if (!controller.current) {
    controller.current = new window.AbortController();
  }
  return controller.current.signal;
};

type ComponentWithDisplayName = {
  (props: any, context?: any): ReactNode;
  displayName?: string | undefined;
};

type WithDisplayNameFn = {
  (name: string): <T extends ComponentWithDisplayName>(WrappedComponent: T) => T;
  <T extends ComponentWithDisplayName>(name: string, WrappedComponent: T): T;
};

export const withDisplayName: WithDisplayNameFn = safeCurry(
  <T extends ComponentWithDisplayName>(name: string, WrappedComponent: T): T => {
    WrappedComponent.displayName = name;
    return WrappedComponent;
  }
);

export const combineRefs = (refs) => {
  return (value) => {
    for (const ref of refs) {
      if (_.has('current', ref)) {
        ref.current = value;
      } else if (_.isFunction(ref)) {
        ref(value);
      }
    }
  };
};

type ForwardRefWithNameFn = {
  (name: string): <T, P = any>(WrappedComponent: ForwardRefRenderFunction<T, P>) => ReturnType<typeof forwardRef<T, P>>;
  <T, P>(name: string, WrappedComponent: ForwardRefRenderFunction<T, P>): ReturnType<typeof forwardRef<T, P>>;
};

export const forwardRefWithName: ForwardRefWithNameFn = safeCurry(
  <T, P>(name: string, WrappedComponent: ForwardRefRenderFunction<T, P>) => {
    return withDisplayName(name, forwardRef(WrappedComponent));
  }
);

export const memoWithName = _.curry((name, WrappedComponent) => {
  return withDisplayName(name, memo(WrappedComponent));
});

export const withCancellationSignal = (WrappedComponent) => {
  return withDisplayName('withCancellationSignal', (props) => {
    const signal = useCancellation();
    return h(WrappedComponent, { ...props, signal });
  });
};

export const usePollingEffect = (
  effectFn: () => Promise<any>,
  { ms, leading }: { ms: number; leading: boolean }
): void => {
  const signal = useCancellation();

  useOnMount(() => {
    pollWithCancellation(effectFn, ms, leading, signal);
  });
};

export const useCurrentTime = (initialDelay = 250) => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const signal = useCancellation();
  const delayRef = useRef(initialDelay);
  useOnMount(() => {
    const poll = async () => {
      while (!signal.aborted) {
        await delay(delayRef.current);
        !signal.aborted && setCurrentTime(Date.now());
      }
    };
    poll();
  });
  return [
    currentTime,
    (delay) => {
      delayRef.current = delay;
    },
  ];
};

export const useDebouncedValue = <T>(value: T, wait: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, wait);
    return () => clearTimeout(timeout);
  }, [value, wait]);

  return debouncedValue;
};
