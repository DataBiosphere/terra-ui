import { safeCurry } from '@terra-ui-packages/core-utils';
import _ from 'lodash/fp';
import {
  EffectCallback,
  forwardRef,
  ForwardRefRenderFunction,
  memo,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import { h } from 'react-hyperscript-helpers';
import { Atom, delay, pollWithCancellation } from 'src/libs/utils';

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

export const useUniqueId = (): string => {
  return useInstance(() => _.uniqueId('unique-id-'));
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
  (props: any, context?: any): ReactElement<any, any> | null;
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

/**
 * Hook that returns the value of a given store. When the store changes, the component will re-render
 */
export const useStore = <T>(theStore: Atom<T>): T => {
  const [value, setValue] = useState(theStore.get());
  useEffect(() => {
    return theStore.subscribe((v) => setValue(v)).unsubscribe;
  }, [theStore]);
  return value;
};

type UseLabelAssertOptions = {
  allowContent?: boolean;
  allowId?: boolean;
  allowLabelledBy?: boolean;
  allowTooltip?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  id?: string;
  tooltip?: string;
};

/**
 * Asserts that a component has an accessible label, and alerts the developer how to fix it if it doesn't.
 *
 * @param componentName The name of the component, which will be printed to the console if there's an alert.
 * @param [allowLabelledBy] If true (default), the component can have an aria-labelledby linked to another element. Set to false to only allow aria-label.
 * @param [allowId] If true, the component can have an id linked to a label using htmlFor. This is true for form elements.
 * @param [allowTooltip] If true, the component can have a tooltip which will be used if needed as the label.
 * @param [allowContent] If true, the component can used nested textual content as its label, as long as it's not a single unlabelled icon
 * @param [ariaLabel] Optional: The label provided to the component
 * @param [ariaLabelledBy] Optional: The ID of the label provided to the component
 * @param [id]: Optional: The ID of the component if allowId is true
 * @param [tooltip] Optional: The tooltip provided to the component if allowTooltip is true
 */
export const useLabelAssert = (componentName: string, options: UseLabelAssertOptions) => {
  const {
    allowContent = false,
    allowId = false,
    allowLabelledBy = true,
    allowTooltip = false,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    id,
    tooltip,
  } = options;

  const printed = useRef(false);

  if (!printed.current) {
    // Ensure that the properties contain a label
    if (!(ariaLabel || (allowLabelledBy && ariaLabelledBy) || (allowId && id) || (allowTooltip && tooltip))) {
      printed.current = true;

      // eslint-disable-next-line no-console
      console.warn(`For accessibility, ${componentName} needs a label. Resolve this by doing any of the following: ${
        allowContent
          ? `
  * add a child component with textual content or a label
  * if the child is an icon, add a label to it`
          : ''
      }${
        allowTooltip
          ? `
  * add a tooltip property to this component, which will also be used as the aria-label`
          : ''
      }
  * add an aria-label property to this component${
    allowLabelledBy
      ? `
  * add an aria-labelledby property referencing the id of another component containing the label`
      : ''
  }${
        allowId
          ? `
  * create a label component and point its htmlFor property to this component's id`
          : ''
      }`);
    }
  }
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
