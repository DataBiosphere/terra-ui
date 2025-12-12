import { useEffect, useState } from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineWithDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { notify } from 'src/libs/notifications';
import { useCancellation } from 'src/libs/react-utils';

export interface UsePipelineDetailsResult {
  pipelineDetails: PipelineWithDetails | null;
  isLoading: boolean;
  error: Error | undefined;
}

export const usePipelineDetails = (pipelineName: string, pipelineVersion: number): UsePipelineDetailsResult => {
  const signal = useCancellation();
  const [pipelineDetails, setPipelineDetails] = useState<PipelineWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  const fetchPipelineDetails = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await Teaspoons(signal).getPipelineDetails(pipelineName, pipelineVersion);
      setPipelineDetails(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch pipeline details');
      setError(error);
      notify('error', error.message);
      setPipelineDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineDetails();
  }, [pipelineName, pipelineVersion, signal]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    pipelineDetails,
    isLoading,
    error,
  };
};
