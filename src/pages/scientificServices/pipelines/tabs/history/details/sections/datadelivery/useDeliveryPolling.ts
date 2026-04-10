import { useEffect, useRef } from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { DataDeliveryReport } from 'src/libs/ajax/teaspoons/teaspoons-models';

const POLL_INTERVALS_MS = [10_000, 15_000, 30_000, 60_000, 120_000];

interface UseDeliveryPollingOptions {
  jobId: string;
  status: DataDeliveryReport['status'] | 'NOT_STARTED' | 'EXPIRED';
  onUpdate: (report: DataDeliveryReport) => void;
}

/**
 * Polls the pipeline run result while a data delivery is RUNNING using a
 * back-off sequence of intervals [10s, 15s, 30s, 60s, 120s], repeating
 * the final interval until the status transitions to a terminal state.
 */
export const useDeliveryPolling = ({ jobId, status, onUpdate }: UseDeliveryPollingOptions): void => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stopPolling = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (status !== 'RUNNING') return stopPolling;

    const schedulePoll = (index: number) => {
      const delay = POLL_INTERVALS_MS[Math.min(index, POLL_INTERVALS_MS.length - 1)];
      intervalRef.current = setTimeout(async () => {
        try {
          const updated = await Teaspoons().getPipelineRunResult(jobId);
          if (updated.pipelineRunReport.dataDeliveryReport) {
            onUpdate(updated.pipelineRunReport.dataDeliveryReport);
            if (updated.pipelineRunReport.dataDeliveryReport.status !== 'RUNNING') return;
          }
        } catch {
          // silently ignore polling errors
        }
        schedulePoll(index + 1);
      }, delay);
    };

    schedulePoll(0);

    return stopPolling;
  }, [status, jobId]); // eslint-disable-line react-hooks/exhaustive-deps
};
