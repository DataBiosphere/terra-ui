import { Icon, Spinner } from '@terra-ui-packages/components';
import _, { capitalize } from 'lodash';
import React, { ReactNode, useState } from 'react';
import { AutoSizer } from 'react-virtualized';
import FooterWrapper from 'src/components/FooterWrapper';
import { FlexTable, HeaderCell, Paginator } from 'src/components/table';
import { GetJobsResponse, JobReport, Teaspoons, TeaspoonsJobStatus } from 'src/libs/ajax/teaspoons/Teaspoons';
import { useCancellation, useOnMount } from 'src/libs/react-utils';
import { imputationTopBar } from 'src/pages/scientificServices/imputation/common/scientific-services-common';

export const JobHistory = () => {
  const signal = useCancellation();

  const [jobsResponse, setJobsResponse] = useState<GetJobsResponse>();

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
      <main
        style={{
          paddingLeft: '2rem',
          paddingRight: '2rem',
          paddingTop: '1rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          rowGap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h3>Job History</h3>
          <div>All files associated with jobs will be auto deleted after 2 weeks from completed.</div>
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
                  height={height}
                  rowHeight={64}
                  // @ts-expect-error - FlexTable is not yet converted to TypeScript
                  sort='asc'
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
        {!_.isEmpty(jobsResponse?.results) && (
          <div style={{ marginBottom: '0.5rem' }}>
            {
              // @ts-expect-error
              <Paginator
                filteredDataLength={jobsResponse?.results.length}
                unfilteredDataLength={jobsResponse?.results.length}
                pageNumber={1}
                setPageNumber={() => {}}
                itemsPerPage={10}
                setItemsPerPage={() => {}}
              />
            }
          </div>
        )}
      </main>
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
      size: { basis: 120 },
    },
    {
      field: 'description',
      headerRenderer: () => <HeaderCell>Description</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <DescriptionCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 120 },
    },
    {
      field: 'status',
      headerRenderer: () => <HeaderCell>Status</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <StatusCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 50 },
    },
    {
      field: 'submitted',
      headerRenderer: () => <HeaderCell>Submitted</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <SubmittedCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 100 },
    },
    {
      field: 'completed',
      headerRenderer: () => <HeaderCell>Completed</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <CompletedCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 100 },
    },
    {
      field: 'quotaUsed',
      headerRenderer: () => <HeaderCell>Quota Used</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <QuotaUsedCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 50 },
    },
    {
      field: 'resultURL',
      headerRenderer: () => <HeaderCell>Actions</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <ActionCell job={paginatedJobs[rowIndex]} />;
      },
      size: { basis: 100 },
    },
  ];
};

// interface SortProperties {
//   field: keyof JobReport;
//   direction: 'asc' | 'desc';
// }

interface CellProps {
  // eslint-disable-next-line react/no-unused-prop-types
  job: JobReport;
}

const JobIdCell = (props: CellProps): ReactNode => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{props.job.id}</div>
      <div
        style={{
          fontWeight: 600,
          backgroundColor: '#4D72AA4D',
          padding: '0.33rem',
          borderRadius: '4px',
          fontSize: '10px',
        }}
      >
        array_imputation v1
      </div>
    </div>
  );
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

const QuotaUsedCell = (props: CellProps): ReactNode => {
  return <div>500</div>;
};

const ActionCell = (props: CellProps): ReactNode => {
  return (
    <div>
      {props.job.status === 'SUCCEEDED' && (
        <a href={props.job.resultURL} style={{ color: '#46A3E9', fontWeight: 700, textDecoration: 'underline' }}>
          Download Output
        </a>
      )}
      {props.job.status === 'FAILED' && (
        <a href={props.job.resultURL} style={{ color: '#46A3E9', fontWeight: 700, textDecoration: 'underline' }}>
          See Details
        </a>
      )}
    </div>
  );
};

const getJobStatusIcon = (status: TeaspoonsJobStatus): ReactNode => {
  switch (status) {
    case 'SUCCEEDED':
      return (
        <div style={{ display: 'flex', alignItems: 'center', color: '#74AE43', gap: '0.5rem' }}>
          <Icon icon='success-standard' /> {capitalize(status)}
        </div>
      );
    case 'FAILED':
      return (
        <div style={{ display: 'flex', alignItems: 'center', color: '#DB3214', gap: '0.5rem' }}>
          <Icon icon='warning-standard' /> {capitalize(status)}
        </div>
      );
    default:
      return <div style={{ display: 'flex', alignItems: 'center' }}>{capitalize(status)}</div>;
  }
};
