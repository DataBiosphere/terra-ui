import { ButtonSecondary, Icon, Spinner } from '@terra-ui-packages/components';
import React, { useEffect, useState } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import * as Nav from 'src/libs/nav';
import { notify } from 'src/libs/notifications';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { JobDetailsHeader } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/JobDetailsHeader';
import { PipelineRunIOView } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/PipelineRunIOView';
import { RunInformation } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/RunInformation';

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
          paddingLeft: '2rem',
          paddingRight: '2rem',
          paddingTop: '1rem',
          paddingBottom: '2rem',
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

            {/* Timeline and Inputs/Outputs Section */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: '0 0 calc(33.333% - 1rem)' }}>
                <RunInformation pipelineRunResult={pipelineRunResult} />
              </div>

              <div style={{ flex: '0 0 calc(66.667% - 0.5rem)' }}>
                <PipelineRunIOView pipelineRunResult={pipelineRunResult} />
              </div>
            </div>
          </div>
        )}
      </main>
    </FooterWrapper>
  );
};
