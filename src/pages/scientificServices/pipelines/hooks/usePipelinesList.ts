import { useEffect, useState } from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { notify } from 'src/libs/notifications';
import { useCancellation } from 'src/libs/react-utils';

export interface UsePipelinesListResult {
  pipelines: Pipeline[];
  uniquePipelines: Pipeline[]; // Pipelines de-duplicated by pipelineName
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
      setPipelines(response.results);
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

  const uniquePipelines = pipelines.reduce((acc: Pipeline[], pipeline) => {
    if (!acc.some((p) => p.pipelineName === pipeline.pipelineName)) {
      acc.push(pipeline);
    }
    return acc;
  }, []);

  return {
    pipelines,
    uniquePipelines,
    isLoading,
    error,
  };
};
