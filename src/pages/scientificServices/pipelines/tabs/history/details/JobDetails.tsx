import { ButtonSecondary, Icon, Spinner } from '@terra-ui-packages/components';
import React, { useEffect, useState } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { DataDeliveryView } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/datadelivery/DataDeliveryView';
import { JobDetailsHeader } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/JobDetailsHeader';
import { JobIOView } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/JobIOView';
import { PipelineRunTimeline } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/timeline/PipelineRunTimeline';

export interface JobDetailsProps {
  jobId: string;
}

export const JobDetails = ({ jobId }: JobDetailsProps) => {
  const [pipelineRunResult, setPipelineRunResult] = useState<PipelineRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchJobDetails() {
      setIsLoading(true);
      try {
        const response = await Teaspoons().getPipelineRunResult(jobId);

        setPipelineRunResult(response);
      } catch (err) {
        notify('error', 'Failed to load job details');
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobDetails();
  }, [jobId]);

  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar('job history')}
      <main
        style={{
          padding: '1rem 2rem 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <ButtonSecondary
            onClick={() => Nav.goToPath('pipelines-history')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Icon icon='arrowLeft' size={16} />
            View All
          </ButtonSecondary>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Spinner />
          </div>
        )}

        {!isLoading && pipelineRunResult && (
          <div>
            <JobDetailsHeader pipelineRunResult={pipelineRunResult} />

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: '0 0 30%', minWidth: '200px' }}>
                <PipelineRunTimeline pipelineRunResult={pipelineRunResult} />
                {/* actually this needs to only show when status is Success, component needs to handle empty report. */}
                <DataDeliveryView
                  dataDeliveryReport={pipelineRunResult.dataDeliveryReport || null}
                  pipelineRunResult={pipelineRunResult}
                />
              </div>
              <div style={{ flex: 1 }}>
                <JobIOView pipelineRunResult={pipelineRunResult} />
              </div>
            </div>
          </div>
        )}
      </main>
    </FooterWrapper>
  );
};
