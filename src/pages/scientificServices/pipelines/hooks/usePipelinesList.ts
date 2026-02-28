import { useEffect, useState } from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { notify } from 'src/libs/notifications';
import { useCancellation } from 'src/libs/react-utils';

export interface UsePipelinesListResult {
  pipelines: Pipeline[];
  isLoading: boolean;
  error: Error | undefined;
}

export const usePipelinesList = (): UsePipelinesListResult => {
  const signal = useCancellation();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  const fetchPipelines = async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await Teaspoons(signal).getPipelines();

      // Add mock pipelines for testing
      const mockPipeline1: Pipeline = {
        pipelineName: 'lowpass_wgs_imputation',
        displayName: 'All of Us + AnVIL Lowpass WGS Imputation',
        pipelineVersion: 1,
        description: 'Mock pipeline for testing quota display',
      };

      const mockPipeline2: Pipeline = {
        pipelineName: 'sv_imputation',
        displayName: 'All of Us + AnVIL SV Imputation',
        pipelineVersion: 1,
        description: 'Structural variant imputation pipeline',
      };

      setPipelines([...response.results, mockPipeline1, mockPipeline2]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch pipelines');
      setError(error);
      notify('error', error.message);
      setPipelines([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, [signal]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    pipelines,
    isLoading,
    error,
  };
};
