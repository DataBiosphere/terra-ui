import { useEffect, useRef } from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { DataDeliveryReport } from 'src/libs/ajax/teaspoons/teaspoons-models';

const POLL_INTERVAL_MS = 10_000; // 10 seconds

interface UseDeliveryPollingOptions {
  jobId: string;
  status: DataDeliveryReport['status'] | 'NOT_STARTED' | 'EXPIRED';
  onUpdate: (report: DataDeliveryReport) => void;
}

/**
 * Polls the pipeline run result every 10 seconds while a data delivery is RUNNING,
 * and stops automatically once the status transitions to a terminal state.
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

    intervalRef.current = setInterval(async () => {
      try {
        const updated = await Teaspoons().getPipelineRunResult(jobId);
        if (updated.pipelineRunReport.dataDeliveryReport) {
          onUpdate(updated.pipelineRunReport.dataDeliveryReport);
          if (updated.pipelineRunReport.dataDeliveryReport.status !== 'RUNNING') stopPolling();
        }
      } catch {
        // silently ignore polling errors
      }
    }, POLL_INTERVAL_MS);

    return stopPolling;
  }, [status, jobId]); // eslint-disable-line react-hooks/exhaustive-deps
};
