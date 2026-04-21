import { createContext, useContext, useEffect, useState } from 'react';
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

// Allows PipelinesLayout to provide the already-fetched result so child
// components that call usePipelinesList() don't trigger a second request.
export const PipelinesListContext = createContext<UsePipelinesListResult | undefined>(undefined);

export const usePipelinesList = (): UsePipelinesListResult => {
  const contextValue = useContext(PipelinesListContext);

  const signal = useCancellation();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (contextValue !== undefined) return;

    const fetchPipelines = async () => {
      setIsLoading(true);
      setError(undefined);

      try {
        const response = await Teaspoons(signal).getPipelines();
        setPipelines(response.results);
      } catch (err) {
        const fetchError = err instanceof Error ? err : new Error('Failed to fetch pipelines');
        setError(fetchError);
        notify('error', fetchError.message);
        setPipelines([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPipelines();
  }, [signal, contextValue]); // eslint-disable-line react-hooks/exhaustive-deps

  if (contextValue !== undefined) {
    return contextValue;
  }

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
