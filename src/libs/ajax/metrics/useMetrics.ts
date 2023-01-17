import { useMemo } from 'react'
import { Ajax } from 'src/libs/ajax'


export type CaptureEventFn = (event: string, details?: {}) => void

export const useMetricsEvent = (): CaptureEventFn => {
  const sendEvent = useMemo(() => Ajax().Metrics.captureEvent, [])
  const captureEvent: CaptureEventFn = (event: string, details?: {}): void => {
    void sendEvent(event, details)
  }
  return captureEvent
}
