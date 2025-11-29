import { ButtonPrimary, Icon, Link, Spinner, TooltipTrigger, useModalHandler } from '@terra-ui-packages/components';
import { formatDate, formatDatetime } from '@terra-ui-packages/core-utils';
import _, { capitalize } from 'lodash';
import pluralize from 'pluralize';
import React, { ReactNode, useEffect, useState } from 'react';
import { AutoSizer } from 'react-virtualized';
import FooterWrapper from 'src/components/FooterWrapper';
import { FlexTable, HeaderCell, Paginator, Sortable, TooltipCell } from 'src/components/table';
import { Metrics } from 'src/libs/ajax/Metrics';
import { Teaspoons } from 'src/libs/ajax/teaspoons/Teaspoons';
import { GetPipelineRunsResponse, PipelineRun } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import { useCancellation } from 'src/libs/react-utils';
import {
  pipelinesTopBar,
  SCIENTIFIC_SERVICES_SUPPORT_EMAIL,
} from 'src/pages/scientificServices/pipelines/common/scientific-services-common';
import { TEASPOONS_FILE_OUTPUT_TTL_DAYS } from 'src/pages/scientificServices/pipelines/common/teaspoons-service-constants';
import { usePipelinesList } from 'src/pages/scientificServices/pipelines/hooks/usePipelinesList';
import { FilterValues, TableFilters } from 'src/pages/scientificServices/pipelines/tabs/history/controls/TableFilters';
import { ViewErrorModal } from 'src/pages/scientificServices/pipelines/tabs/history/modals/ViewErrorModal';
import { ViewOutputsModal } from 'src/pages/scientificServices/pipelines/tabs/history/modals/ViewOutputsModal';

// If a job is still in "Preparing" state after this many hours, we consider it a failure.
export const PREPARING_JOB_CUTOFF_HOURS = 12;

interface SortProperties {
  field: string;
  direction: 'asc' | 'desc';
}

export const JobHistory = () => {
  const signal = useCancellation();
  const [pageNumber, setPageNumber] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pipelineRunsResponse, setPipelineRunsResponse] = useState<GetPipelineRunsResponse>();
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<SortProperties>({
    field: 'created',
    direction: 'desc',
  });

  const { isLoading: isLoadingPipelines, pipelines: pipelinesList } = usePipelinesList();

  // Fetch pipeline runs when the component mounts or when pagination/sorting/filtering controls change
  useEffect(() => {
    async function fetchPipelineRuns() {
      setIsLoading(true);
      try {
        const response = await Teaspoons(signal).getAllPipelineRuns(
          itemsPerPage,
          pageNumber,
          sort?.field,
          sort?.direction,
          filters
        );
        setPipelineRunsResponse(response);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPipelineRuns();
  }, [pageNumber, itemsPerPage, sort, filters, signal]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPageNumber(1);
  };

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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ marginBottom: '0.25rem' }}>
                All files associated with jobs will be automatically deleted after {TEASPOONS_FILE_OUTPUT_TTL_DAYS} days
                from completion.
              </div>
              <div>
                For support, email{' '}
                <a
                  style={{ color: '#46A3E9', textDecoration: 'underline', fontWeight: 'bold' }}
                  href={`mailto:${SCIENTIFIC_SERVICES_SUPPORT_EMAIL}`}
                >
                  {SCIENTIFIC_SERVICES_SUPPORT_EMAIL}
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
              {isLoadingPipelines && <Spinner size={20} />}
              <ButtonPrimary
                type='button'
                disabled={isLoadingPipelines}
                onClick={() => setShowFilters(!showFilters)}
                aria-label={showFilters ? 'Hide filters' : 'Show filters'}
                style={{ minWidth: '140px' }}
              >
                <Icon icon='search' size={16} style={{ marginRight: '0.5rem' }} />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </ButtonPrimary>
            </div>
          </div>
        </div>

        {showFilters && (
          <TableFilters filters={filters} onFilterChange={handleFilterChange} pipelinesList={pipelinesList} />
        )}

        <div style={{ flex: 1, marginTop: '0.75rem' }}>
          {pipelineRunsResponse && !isLoading ? (
            <AutoSizer>
              {({ width, height }) => (
                <FlexTable
                  aria-label='job history table'
                  width={width}
                  height={height}
                  rowHeight={55}
                  rowCount={pipelineRunsResponse.results.length}
                  columns={getColumns(pipelineRunsResponse.results, sort, (sort) => {
                    setSort(sort);
                    setPageNumber(1);
                  })}
                  noContentMessage={
                    filters ? (
                      <div>
                        No results match the selected filters.{' '}
                        <button
                          type='button'
                          style={{
                            color: '#46A3E9',
                            fontWeight: 700,
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontStyle: 'italic',
                          }}
                          onClick={() => setFilters({})}
                        >
                          Clear filters
                        </button>{' '}
                        to see all jobs.
                      </div>
                    ) : (
                      'Nothing to display'
                    )
                  }
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
              filteredDataLength={pipelineRunsResponse?.totalFilteredResults ?? 0}
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

const getColumns = (paginatedRuns: PipelineRun[], sort: SortProperties, onSort: (sort: SortProperties) => void) => {
  return [
    {
      field: 'id',
      headerRenderer: () => <HeaderCell>Job ID</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <JobIdCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 250 },
    },
    {
      field: 'description',
      headerRenderer: () => <HeaderCell>Description</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <DescriptionCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 160 },
    },
    {
      field: 'status',
      headerRenderer: () => <HeaderCell>Status</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <StatusCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 20 },
    },
    {
      field: 'submitted',
      headerRenderer: () => (
        <Sortable sort={sort} field='created' onSort={onSort}>
          <HeaderCell>Submitted</HeaderCell>
        </Sortable>
      ),
      cellRenderer: ({ rowIndex }) => {
        return <SubmittedCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 60 },
    },
    {
      field: 'completed',
      headerRenderer: () => (
        // updated is a proxy for timeCompleted, since timeCompleted is not a value in the TSPS PipelineRuns database table
        <Sortable sort={sort} field='updated' onSort={onSort}>
          <HeaderCell>Completed</HeaderCell>
        </Sortable>
      ),
      cellRenderer: ({ rowIndex }) => {
        return <CompletedCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 60 },
    },
    {
      field: 'dataDeletionDate',
      headerRenderer: () => <HeaderCell>Deletion Date</HeaderCell>,
      cellRenderer: ({ rowIndex }) => {
        return <DataDeletionDateCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 60 },
    },
    {
      field: 'quotaUsed',
      headerRenderer: () => (
        <Sortable sort={sort} field='quotaConsumed' onSort={onSort}>
          <HeaderCell>Quota Used</HeaderCell>
        </Sortable>
      ),
      cellRenderer: ({ rowIndex }) => {
        return <QuotaUsedCell pipelineRun={paginatedRuns[rowIndex]} />;
      },
      size: { basis: 40 },
    },
    // {
    //   field: 'resultURL',
    //   headerRenderer: () => <HeaderCell>Actions</HeaderCell>,
    //   cellRenderer: ({ rowIndex }) => {
    //     return <ActionCell pipelineRun={paginatedRuns[rowIndex]} />;
    //   },
    //   size: { basis: 40 },
    // },
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
        <Link
          href={Nav.getLink('pipelines-history-detail', { jobId: pipelineRun.jobId })}
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
            display: 'block',
          }}
          aria-label={`View details for job ${pipelineRun.jobId}`}
        >
          <TooltipTrigger content={pipelineRun.jobId} side='top'>
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                display: 'block',
              }}
            >
              {pipelineRun.jobId}
            </span>
          </TooltipTrigger>
        </Link>
      </div>
      <div
        style={{
          width: 'fit-content',
          fontWeight: 600,
          backgroundColor: pipelineNameToColor(pipelineRun.pipelineName),
          padding: '0.33rem',
          borderRadius: '4px',
          fontSize: '10px',
        }}
      >
        {pipelineRun.pipelineName} {pipelineRun.pipelineVersion ? `v${pipelineRun.pipelineVersion}` : ''}
      </div>
    </div>
  );
};

const DescriptionCell = ({ pipelineRun }: CellProps): ReactNode => {
  // descriptions can be long, so truncate them and allow the user to hover over them to see the full description
  return <TooltipCell tooltip={null}>{pipelineRun.description}</TooltipCell>;
};

const StatusCell = ({ pipelineRun }: CellProps): ReactNode => {
  return <div style={{ display: 'flex', alignItems: 'center' }}>{getRunStatusIcon(pipelineRun)}</div>;
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
  if (!pipelineRun.outputExpirationDate || !(pipelineRun.status === 'SUCCEEDED')) {
    return <div>N/A</div>;
  }

  const deletionDate = new Date(pipelineRun?.outputExpirationDate);

  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);
  // Check if the deletion date is within the next 3 days
  const isDeletionSoon = deletionDate >= today && deletionDate <= threeDaysFromNow;

  return (
    <div
      style={
        isDeletionSoon
          ? {
              color: colors.danger(),
              fontWeight: 600,
            }
          : {}
      }
    >
      <MediumDateWithTooltip date={deletionDate} />
    </div>
  );
};

const QuotaUsedCell = (props: CellProps): ReactNode => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      {props.pipelineRun.quotaConsumed || 0} {pluralize('sample', props.pipelineRun.quotaConsumed || 0)}
      {props.pipelineRun.status === 'RUNNING' && (
        <TooltipTrigger
          content='This job is still in progress. The amount of quota consumed may change as the job progresses. If the job fails, no quota will be consumed.'
          side='top'
        >
          <Icon icon='info-circle' style={{ marginLeft: '0.25rem', color: colors.primary() }} />
        </TooltipTrigger>
      )}
    </div>
  );
};

const ActionCell = ({ pipelineRun }: CellProps): ReactNode => {
  const outputsModal = useModalHandler(() => {
    return <ViewOutputsModal jobId={pipelineRun.jobId} onDismiss={outputsModal.close} />;
  });

  const errorModal = useModalHandler(() => {
    return <ViewErrorModal pipelineRun={pipelineRun} onDismiss={errorModal.close} />;
  });

  // `!!` converts the expression to a boolean
  const jobOutputsDeleted = !!(
    pipelineRun.status === 'SUCCEEDED' &&
    pipelineRun.outputExpirationDate &&
    new Date() >= new Date(pipelineRun.outputExpirationDate)
  );

  return (
    <div>
      {pipelineRun.status === 'SUCCEEDED' && (
        <>
          <TooltipTrigger
            content={
              jobOutputsDeleted
                ? `The outputs for this job have been deleted. Outputs are available for ${TEASPOONS_FILE_OUTPUT_TTL_DAYS} days after job completion.`
                : undefined
            }
            side='top'
          >
            <span style={{ cursor: jobOutputsDeleted ? 'not-allowed' : 'pointer' }}>
              <button
                type='button'
                disabled={jobOutputsDeleted}
                style={{
                  color: jobOutputsDeleted ? colors.disabled() : '#46A3E9',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: jobOutputsDeleted ? 'not-allowed' : 'pointer',
                  font: 'inherit',
                }}
                onClick={() => {
                  outputsModal.open({ jobId: pipelineRun.jobId });
                  Metrics().captureEvent(Events.teaspoons.viewJobOutputs, {
                    pipelineName: pipelineRun.pipelineName,
                    pipelineVersion: pipelineRun.pipelineVersion,
                  });
                }}
              >
                View Outputs
              </button>
            </span>
          </TooltipTrigger>
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
            onClick={() => {
              errorModal.open({ jobId: pipelineRun.jobId });
              Metrics().captureEvent(Events.teaspoons.viewJobErrors, {
                pipelineName: pipelineRun.pipelineName,
                pipelineVersion: pipelineRun.pipelineVersion,
              });
            }}
          >
            View Error
          </button>
          {errorModal.maybeRender()}
        </>
      )}
      {pipelineRun.status === 'PREPARING' && hoursElapsedSinceSubmission(pipelineRun) > PREPARING_JOB_CUTOFF_HOURS && (
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
            onClick={() => {
              errorModal.open({ jobId: pipelineRun.jobId });
              Metrics().captureEvent(Events.teaspoons.viewJobErrors, {
                pipelineName: pipelineRun.pipelineName,
                pipelineVersion: pipelineRun.pipelineVersion,
              });
            }}
          >
            View Error
          </button>
          {errorModal.maybeRender()}
        </>
      )}
    </div>
  );
};

const getRunStatusIcon = (pipelineRun: PipelineRun): ReactNode => {
  switch (pipelineRun.status) {
    case 'SUCCEEDED':
      return (
        <div style={{ display: 'flex', alignItems: 'center', color: colors.success(), gap: '0.5rem' }}>
          <Icon icon='success-standard' /> Done
        </div>
      );
    case 'RUNNING':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon icon='sync' /> In Progress
        </div>
      );
    case 'PREPARING': {
      // In most cases, jobs stuck in Preparing can be considered failures.
      // However, we have a window where we still show "Preparing" in case the user happens
      // to check the Job History page while the job submission is still in progress (i.e. due to a slow/large file upload).
      const hoursElapsed = hoursElapsedSinceSubmission(pipelineRun);

      if (hoursElapsed > PREPARING_JOB_CUTOFF_HOURS) {
        return (
          <div style={{ display: 'flex', alignItems: 'center', color: colors.danger(), gap: '0.5rem' }}>
            <Icon icon='warning-standard' /> Failed
          </div>
        );
      }

      return (
        <TooltipCell
          tooltip={`This job is either still uploading data or has failed before submission. Jobs stuck in Preparing for more than ${PREPARING_JOB_CUTOFF_HOURS} hours will be marked as failed.`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon icon='sync' /> Preparing
          </div>
        </TooltipCell>
      );
    }
    case 'FAILED':
      return (
        <div style={{ display: 'flex', alignItems: 'center', color: colors.danger(), gap: '0.5rem' }}>
          <Icon icon='warning-standard' /> Failed
        </div>
      );
    default:
      return <div style={{ display: 'flex', alignItems: 'center' }}>{capitalize(pipelineRun.status)}</div>;
  }
};

export const pipelineNameToColor = (pipelineName: string): string => {
  switch (pipelineName) {
    case 'array_imputation':
      return '#4D72AA4D';
    default:
      return '#AA4D8B4D';
  }
};

const hoursElapsedSinceSubmission = (pipelineRun: PipelineRun): number => {
  const submittedTime = new Date(pipelineRun.timeSubmitted);
  const currentTime = new Date();
  return (currentTime.getTime() - submittedTime.getTime()) / (1000 * 60 * 60);
};
