import { Icon, Spinner, useModalHandler } from '@terra-ui-packages/components';
import { formatDate, formatDatetime } from '@terra-ui-packages/core-utils';
import _, { capitalize } from 'lodash';
import pluralize from 'pluralize';
import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { AutoSizer } from 'react-virtualized';
import FooterWrapper from 'src/components/FooterWrapper';
import { FlexTable, HeaderCell, Paginator, TooltipCell } from 'src/components/table';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { GetPipelineRunsResponse, PipelineRun, PipelineRunStatus } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { useCancellation } from 'src/libs/react-utils';
import { pipelinesTopBar } from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { ViewErrorModal } from 'src/pages/scientificServices/pipelines/views/modals/ViewErrorModal';
import { ViewOutputsModal } from 'src/pages/scientificServices/pipelines/views/modals/ViewOutputsModal';

/*
   Right now, this will show all pipeline runs. Once we support more than one pipeline,
   we'll need to add a filter for the pipeline name.
*/
export const JobHistory = () => {
  const signal = useCancellation();

  const [pageNumber, setPageNumber] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pipelineRunsResponse, setPipelineRunsResponse] = useState<GetPipelineRunsResponse>();
  const nextPageToken = useRef<string>();

  useEffect(() => {
    async function fetchPipelineRuns() {
      const response = await Teaspoons(signal).getAllPipelineRuns(itemsPerPage, nextPageToken.current);
      setPipelineRunsResponse(response);
      nextPageToken.current = response.pageToken;
    }
    fetchPipelineRuns();
  }, [pageNumber, signal]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <FooterWrapper alwaysShow>
      {pipelinesTopBar('job history')}
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
          <div style={{ marginBottom: '0.25rem' }}>
            All files associated with jobs will be automatically deleted after 2 weeks from completion.
          </div>
          <div>
            For support, email{' '}
            <a
              style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
              href='mailto:scientific-services-support@broadinstitute.org'
            >
              scientific-services-support@broadinstitute.org
            </a>
          </div>
        </div>
        <div style={{ flex: 1, marginTop: '1rem' }}>
          {pipelineRunsResponse ? (
            <AutoSizer>
              {({ width, height }) => (
                // Sorting is unsupported on this table for now. Eventually
                // we may update the paginated Teaspoons getAllPipelineRuns endpoint
                // to support filters and sorting. Until then, the results will be
                // sorted by creation date, with the most recent displayed first.
                <FlexTable
                  aria-label='job history table'
                  width={width}
                  height={height}
                  rowHeight={55}
                  rowCount={pipelineRunsResponse.results.length}
                  columns={getColumns(pipelineRunsResponse.results)}
                  noContentMessage={pipelineRunsResponse.totalResults > 0 ? ' ' : 'Nothing to display'}
                  tabIndex={-1}
                  variant={undefined}
                  styleHeader={() => ({ backgroundColor: '#eff0f1' })}
                />
              )}
            </AutoSizer>
          ) : (
            <Spinner />
          )}
        </div>
        {!_.isEmpty(pipelineRunsResponse?.results) && (
          <div style={{ marginBottom: '0.5rem' }}>
            {/* @ts-ignore */}
            <Paginator
              filteredDataLength={pipelineRunsResponse?.totalResults ?? 0}
              unfilteredDataLength={pipelineRunsResponse?.totalResults ?? 0}
              pageNumber={pageNumber}
              setPageNumber={(v) => {
                setPageNumber(v);
              }}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={(v) => {
                setPageNumber(1);
                setItemsPerPage(v);
              }}
            />
          </div>
        )}
      </main>
    </FooterWrapper>
  );
};

const getColumns = (paginatedRuns: PipelineRun[]) => {
  return [
    {
      field: 'id',
      headerRenderer: () => <HeaderCell>Job ID</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <JobIdCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 140 },
    },
    {
      field: 'description',
      headerRenderer: () => <HeaderCell>Description</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <DescriptionCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 140 },
    },
    {
      field: 'status',
      headerRenderer: () => <HeaderCell>Status</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <StatusCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 50 },
    },
    {
      field: 'submitted',
      headerRenderer: () => <HeaderCell>Submitted</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <SubmittedCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 80 },
    },
    {
      field: 'completed',
      headerRenderer: () => <HeaderCell>Completed</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <CompletedCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 80 },
    },
    {
      field: 'dataDeletionDate',
      headerRenderer: () => <HeaderCell>Deletion Date</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <DataDeletionDateCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 80 },
    },
    {
      field: 'quotaUsed',
      headerRenderer: () => <HeaderCell>Quota Used</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <QuotaUsedCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 30 },
    },
    {
      field: 'resultURL',
      headerRenderer: () => <HeaderCell>Actions</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <ActionCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 100 },
    },
  ];
};

interface CellProps {
  // I have absolutely no clue why TS thinks this is unused
  // eslint-disable-next-line react/no-unused-prop-types
  pipelineRun: PipelineRun;
}

const JobIdCell = ({ pipelineRun }: CellProps): ReactNode => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <TooltipCell
          tooltip={pipelineRun.jobId}
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
        >
          {pipelineRun.jobId}
        </TooltipCell>
      </div>
      <div
        style={{
          width: 'fit-content',
          fontWeight: 600,
          backgroundColor: '#4D72AA4D',
          padding: '0.33rem',
          borderRadius: '4px',
          fontSize: '10px',
        }}
      >
        {pipelineRun.pipelineName}
      </div>
    </div>
  );
};

const DescriptionCell = ({ pipelineRun }: CellProps): ReactNode => {
  // descriptions can be long, so truncate them and allow the user to hover over them to see the full description
  return <TooltipCell tooltip={null}>{pipelineRun.description}</TooltipCell>;
};

const StatusCell = ({ pipelineRun }: CellProps): ReactNode => {
  return <div style={{ display: 'flex', alignItems: 'center' }}>{getRunStatusIcon(pipelineRun.status)}</div>;
};

/** Format date like "Feb 15, 2025", and enable tooltip with precise time */
const MediumDateWithTooltip = ({ date }: { date: string | Date }): React.JSX.Element => {
  return <TooltipCell tooltip={formatDatetime(date)}>{formatDate(date)}</TooltipCell>;
};

const SubmittedCell = ({ pipelineRun }: CellProps): ReactNode => {
  return <MediumDateWithTooltip date={pipelineRun.timeSubmitted} />;
};

const CompletedCell = ({ pipelineRun }: CellProps): ReactNode => {
  return <div>{pipelineRun.timeCompleted ? <MediumDateWithTooltip date={pipelineRun.timeCompleted} /> : ''}</div>;
};

const DataDeletionDateCell = ({ pipelineRun }: CellProps): ReactNode => {
  if (!pipelineRun.timeCompleted || !(pipelineRun.status === 'SUCCEEDED')) {
    return <div>N/A</div>;
  }

  const completionDate = new Date(pipelineRun?.timeCompleted);
  const deletionDate = new Date(completionDate);
  deletionDate.setDate(deletionDate.getDate() + 14);

  return <MediumDateWithTooltip date={deletionDate} />;
};

const QuotaUsedCell = (props: CellProps): ReactNode => {
  return (
    <div>
      {props.pipelineRun.quotaConsumed
        ? `${props.pipelineRun.quotaConsumed} ${pluralize('sample', props.pipelineRun.quotaConsumed)}`
        : 'N/A'}
    </div>
  );
};

const ActionCell = ({ pipelineRun }: CellProps): ReactNode => {
  const outputsModal = useModalHandler(() => {
    return <ViewOutputsModal jobId={pipelineRun.jobId} onDismiss={outputsModal.close} />;
  });

  const errorModal = useModalHandler(() => {
    return <ViewErrorModal jobId={pipelineRun.jobId} onDismiss={errorModal.close} />;
  });

  return (
    <div>
      {pipelineRun.status === 'SUCCEEDED' && (
        <>
          <button
            type='button'
            style={{
              color: '#46A3E9',
              fontWeight: 700,
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              font: 'inherit',
            }}
            onClick={() => outputsModal.open({ jobId: pipelineRun.jobId })}
          >
            View Outputs
          </button>
          {outputsModal.maybeRender()}
        </>
      )}
      {pipelineRun.status === 'FAILED' && (
        <>
          <button
            type='button'
            style={{
              color: '#46A3E9',
              fontWeight: 700,
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              font: 'inherit',
            }}
            onClick={() => errorModal.open({ jobId: pipelineRun.jobId })}
          >
            View Error
          </button>
          {errorModal.maybeRender()}
        </>
      )}
    </div>
  );
};

const getRunStatusIcon = (status: PipelineRunStatus): ReactNode => {
  switch (status) {
    case 'SUCCEEDED':
      return (
        <div style={{ display: 'flex', alignItems: 'center', color: '#74AE43', gap: '0.5rem' }}>
          <Icon icon='success-standard' /> Done
        </div>
      );
    case 'RUNNING':
      return <div style={{ display: 'flex', alignItems: 'center' }}>In Progress</div>;
    case 'FAILED':
      return (
        <div style={{ display: 'flex', alignItems: 'center', color: '#DB3214', gap: '0.5rem' }}>
          <Icon icon='warning-standard' /> Failed
        </div>
      );
    default:
      return <div style={{ display: 'flex', alignItems: 'center' }}>{capitalize(status)}</div>;
  }
};
