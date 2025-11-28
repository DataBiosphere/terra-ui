import { ButtonSecondary, Icon, Spinner } from '@terra-ui-packages/components';
import React, { useEffect, useState } from 'react';
import FooterWrapper from 'src/components/FooterWrapper';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import { useCancellation } from 'src/libs/react-utils';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { JobBasics } from 'src/pages/scientificServices/pipelines/tabs/history/details/components/JobBasics';
import { JobInputsOutputs } from 'src/pages/scientificServices/pipelines/tabs/history/details/components/JobInputsOutputs';
import { JobTimeline } from 'src/pages/scientificServices/pipelines/tabs/history/details/components/JobTimeline';

export interface JobDetailsProps {
  jobId: string;
}

export const JobDetails = ({ jobId }: JobDetailsProps) => {
  const signal = useCancellation();
  const [pipelineRunResult, setPipelineRunResult] = useState<PipelineRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobDetails() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Teaspoons(signal).getPipelineRunResult(jobId);

        // Add mock outputs to the response for testing
        const mockResponse: PipelineRunResponse = {
          ...response,
          pipelineRunReport: {
            ...response.pipelineRunReport,
            inputs: {
              'Output Basename': 'test',
              'Minimum Imputation Quality': '0.3',
              'Multi-Sample VCF': 'bla.vcf.gz',
            },
            outputs: {
              'Imputed Multi-Sample VCF': 'gs://fc-secure-bucket/imputation-results/chr1-22.dose.vcf.gz',
              'Imputed Multi-Sample VCF Index': 'gs://fc-secure-bucket/imputation-results/chr1-22.info',
              'Contigs Metrics TSV': 'gs://fc-secure-bucket/imputation-results/qc-report.html',
              'Imputation Chunks QC TSV': 'gs://fc-secure-bucket/imputation-results/summary-statistics.tsv',
            },
            outputExpirationDate: '2025-12-28T10:20:01Z',
          },
        };

        setPipelineRunResult(mockResponse);
      } catch (err) {
        setError('Failed to load job details. Please try again later.');
        // eslint-disable-next-line no-console
        console.error('Error fetching job details:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobDetails();
  }, [jobId, signal]);

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

        {error && (
          <div
            style={{
              padding: '1rem',
              backgroundColor: colors.danger(0.1),
              border: `1px solid ${colors.danger()}`,
              borderRadius: '4px',
              color: colors.danger(),
            }}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && pipelineRunResult && (
          <div>
            {/* Job Summary Widget */}
            <JobBasics pipelineRunResult={pipelineRunResult} />

            {/* Timeline and Inputs/Outputs Section */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
              {/* Timeline - 1/3 width */}
              <div style={{ flex: '0 0 calc(33.333% - 1rem)' }}>
                <JobTimeline pipelineRunResult={pipelineRunResult} />
              </div>

              {/* Inputs & Outputs - 2/3 width */}
              <div style={{ flex: '0 0 calc(66.667% - 0.5rem)' }}>
                <JobInputsOutputs pipelineRunResult={pipelineRunResult} />
              </div>
            </div>
          </div>
        )}
      </main>
    </FooterWrapper>
  );
};
