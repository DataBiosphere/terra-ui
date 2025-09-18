import { useEffect, useState } from 'react';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { Pipeline, PipelineWithDetails, UserPipelineQuotaDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { notify } from 'src/libs/notifications';
import { useCancellation } from 'src/libs/react-utils';

export interface UseUserQuotaResult {
  quota: UserPipelineQuotaDetails | undefined;
  pipelineDetails: PipelineWithDetails | undefined;
  meetsMinimumQuota: boolean | undefined;
  isLoading: boolean;
}

export const useUserQuota = (selectedPipeline?: Pipeline): UseUserQuotaResult => {
  const signal = useCancellation();
  const [quota, setQuota] = useState<UserPipelineQuotaDetails>();
  const [pipelineDetails, setPipelineDetails] = useState<PipelineWithDetails>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchUserQuota = async () => {
    if (!selectedPipeline) {
      setQuota(undefined);
      setPipelineDetails(undefined);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [quotaResponse, pipelineDetailsResponse] = await Promise.all([
        Teaspoons(signal).getQuotaForPipeline(selectedPipeline.pipelineName),
        Teaspoons(signal).getPipelineDetails(selectedPipeline.pipelineName, selectedPipeline.pipelineVersion),
      ]);

      setQuota(quotaResponse);
      setPipelineDetails(pipelineDetailsResponse);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quota and pipeline details';
      notify('error', errorMessage);
      setQuota(undefined);
      setPipelineDetails(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserQuota();
  }, [selectedPipeline, signal]); // eslint-disable-line react-hooks/exhaustive-deps

  const meetsMinimumQuota =
    quota &&
    selectedPipeline &&
    quota.quotaLimit - quota.quotaConsumed > (pipelineDetails?.pipelineQuota?.minQuotaConsumed || 0);

  return {
    quota,
    pipelineDetails,
    isLoading,
    meetsMinimumQuota,
  };
};
