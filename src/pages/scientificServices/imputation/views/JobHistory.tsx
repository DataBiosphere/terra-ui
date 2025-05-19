import { Icon, Spinner } from '@terra-ui-packages/components';
import React, { ReactNode, useState } from 'react';
import { AutoSizer } from 'react-virtualized';
import FooterWrapper from 'src/components/FooterWrapper';
import { FlexTable, HeaderCell } from 'src/components/table';
import { GetJobsResponse, JobReport, mockJobResponse, Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { WorkspaceWrapper as Workspace } from 'src/libs/ajax/workspaces/workspace-models';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { imputationTopBar } from 'src/pages/scientificServices/imputation/common/scientific-services-common';

export const JobHistory = () => {
  const signal = useCancellation();

  const [jobsResponse, setJobsResponse] = useState<GetJobsResponse>();
  const [sort, setSort] = useState<SortProperties>({ field: 'id', direction: 'asc' });

  const onSort = (newSort: SortProperties): void => {
    setSort(newSort);
  };

  useOnMount(() => {
    // TODO: pagination
    async function fetchJobs() {
      const response = await Teaspoons(signal).getAllJobs();
      setJobsResponse(response);
    }
    fetchJobs();
  });

  return (
    <FooterWrapper alwaysShow>
      {imputationTopBar('job history')}
      <div style={{ margin: '2rem' }}>
        <h3>Job History</h3>
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', rowGap: '0.5rem' }}>
            All files associated with jobs will be auto deleted after 2 weeks from completed.
            <div>
              For support, email{' '}
              <a
                style={{ color: '#46A3E9', textDecoration: 'underline' }}
                href='mailto:scientific-services-support@broadinstitute.org'
              >
                scientific-services-support@broadinstitute.org
              </a>
            </div>
          </div>
          <div style={{ flex: 1, marginTop: '1rem' }}>
            {jobsResponse ? (
              <AutoSizer>
                {({ width, height }) => (
                  <FlexTable
                    aria-label='job history table'
                    width={width}
                    height={250} // TODO
                    // @ts-expect-error - FlexTable is not yet converted to TypeScript
                    sort={sort}
                    rowCount={jobsResponse.results.length}
                    columns={getColumns(jobsResponse.results)}
                    noContentMessage={jobsResponse.totalResults === 0 ? ' ' : 'Nothing to display'}
                    tabIndex={-1}
                  />
                )}
              </AutoSizer>
            ) : (
              <Spinner />
            )}
          </div>
        </div>
      </div>
    </FooterWrapper>
  );
};

const getColumns = (paginatedJobs: JobReport[]) => {
  return [
    {
      field: 'id',
      headerRenderer: () => <HeaderCell>Job ID</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <JobIdCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 475 },
    },
    {
      field: 'description',
      headerRenderer: () => <HeaderCell>Description</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <DescriptionCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 475 },
    },
    {
      field: 'status',
      headerRenderer: () => <HeaderCell>Status</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <StatusCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 475 },
    },
    {
      field: 'submitted',
      headerRenderer: () => <HeaderCell>Submitted</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <SubmittedCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 475 },
    },
    {
      field: 'completed',
      headerRenderer: () => <HeaderCell>Completed</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <CompletedCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 475 },
    },
    {
      field: 'resultURL',
      headerRenderer: () => <HeaderCell>Result</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <ResultCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 475 },
    },
  ];
};

interface SortProperties {
  field: keyof JobReport;
  direction: 'asc' | 'desc';
}

interface JobHistoryTableHeaderProps {
  sort: SortProperties;
  field: string;
  onSort: (newSort: SortProperties) => void;
  children: string;
}

interface CellProps {
  job: JobReport;
}

const JobIdCell = (props: CellProps): ReactNode => {
  return <div style={{ fontSize: 12 }}>{props.job.id}</div>;
};

const DescriptionCell = (props: CellProps): ReactNode => {
  return <div>{props.job.description}</div>;
};

const StatusCell = (props: CellProps): ReactNode => {
  return <div style={{ display: 'flex', alignItems: 'center' }}>{getJobStatusIcon(props.job.status)}</div>;
};

const SubmittedCell = (props: CellProps): ReactNode => {
  return <div>{props.job.submitted}</div>;
};

const CompletedCell = (props: CellProps): ReactNode => {
  return <div>{props.job.completed}</div>;
};

const ResultCell = (props: CellProps): ReactNode => {
  return <div>{props.job.resultURL}</div>;
};

const getJobStatusIcon = (status: string): ReactNode => {
  switch (status) {
    case 'DONE':
      return (
        <div style={{ display: 'flex', alignItems: 'center', color: '#74AE43', gap: '0.5rem' }}>
          <Icon icon='check' /> Done
        </div>
      );
    case 'FAILED':
      return (
        <div style={{ display: 'flex', alignItems: 'center', color: '#DB3214', gap: '0.5rem' }}>
          <Icon icon='warning-standard' /> Failed
        </div>
      );
    default:
      return <div style={{ display: 'flex', alignItems: 'center' }}>{status}</div>;
  }
};
