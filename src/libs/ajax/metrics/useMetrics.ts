import { useMemo } from "react";
import { Ajax } from "src/libs/ajax";

export type CaptureEventFn = (event: string, details?: {}) => void;

export interface UseMetricsContract {
  captureEvent: CaptureEventFn;
}

export const useMetricsEvent = (): UseMetricsContract => {
  const sendEvent = useMemo(() => Ajax().Metrics.captureEvent, []);
  // By returning a wrapper function, we can handle the fire-and-forget promise mechanics properly here
  // instead of burdening the consumer side with silencing the Typescript/lint complaints, which can be
  // quite awkward in some nested functional uses.
  const captureEvent: CaptureEventFn = (event: string, details?: {}): void => {
    // fire and forget
    void sendEvent(event, details);
  };
  return { captureEvent };
};
