import { ButtonPrimary, Icon, Select } from '@terra-ui-packages/components';
import React, { useEffect, useState } from 'react';
import { DelayedSearchInput } from 'src/components/input';
import { Pipeline, PipelineRunStatus } from 'src/libs/ajax/teaspoons/teaspoons-models';
import colors from 'src/libs/colors';

export interface FilterValues {
  description?: string;
  jobId?: string;
  status?: PipelineRunStatus;
  pipelineName?: string;
}

interface TableFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  pipelinesList: Pipeline[];
}

export const TableFilters: React.FC<TableFiltersProps> = ({ filters, onFilterChange, pipelinesList }) => {
  const handleInputChange = (field: keyof FilterValues, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== undefined && value !== '');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: '#eff0f1',
        border: '1px solid #d7d9dc',
        borderRadius: '0.25rem',
        padding: '0.75rem 0.75rem',
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <DescriptionFilterControl filters={filters} handleInputChange={handleInputChange} />
        <JobIdFilterControl filters={filters} handleInputChange={handleInputChange} />
        <StatusFilterControl filters={filters} handleInputChange={handleInputChange} />
        <PipelineFilterControl filters={filters} handleInputChange={handleInputChange} pipelinesList={pipelinesList} />

        <div
          style={{
            display: 'flex',
            flex: '0 0 auto',
            justifyContent: 'center',
          }}
        >
          <ButtonPrimary disabled={!hasActiveFilters} onClick={handleClearFilters}>
            Clear
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
};

const DescriptionFilterControl = ({
  filters,
  handleInputChange,
}: {
  filters: FilterValues;
  handleInputChange: (field: keyof FilterValues, value: string) => void;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        minWidth: '200px',
        flex: '1 1 25%',
      }}
    >
      <div style={{ fontWeight: 600, fontSize: '14px' }}>Description</div>
      <DelayedSearchInput
        id='filter-description'
        placeholder='Filter by description...'
        value={filters.description || ''}
        onChange={(value: string) => handleInputChange('description', value)}
      />
    </div>
  );
};

const JobIdFilterControl = ({
  filters,
  handleInputChange,
}: {
  filters: FilterValues;
  handleInputChange: (field: keyof FilterValues, value: string) => void;
}) => {
  const isValidUUID = (value: string): boolean => {
    if (!value) return true; // Empty is valid (no filter applied yet)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  };

  const [unvalidatedValue, setUnvalidatedValue] = useState(filters.jobId || '');
  const showValidationWarning = unvalidatedValue && !isValidUUID(unvalidatedValue);

  useEffect(() => {
    setUnvalidatedValue(filters.jobId || '');
  }, [filters.jobId]);

  const handleChange = (value: string) => {
    setUnvalidatedValue(value);
    // Only update the job id filter if the value is a valid UUID, to avoid
    // spamming the backend with invalid queries (which will throw 400 Bad Request errors)
    if (isValidUUID(value)) {
      handleInputChange('jobId', value);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        minWidth: '200px',
        flex: '1 1 25%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>Job ID</div>
        {showValidationWarning && (
          <div style={{ color: colors.danger(), fontSize: '14px' }}>
            <Icon icon='warning-standard' size={14} /> Enter a valid job ID
          </div>
        )}
      </div>
      <DelayedSearchInput
        id='filter-jobId'
        placeholder='Filter by Job ID...'
        value={unvalidatedValue}
        onChange={handleChange}
      />
    </div>
  );
};

const StatusFilterControl = ({
  filters,
  handleInputChange,
}: {
  filters: FilterValues;
  handleInputChange: (field: keyof FilterValues, value: string) => void;
}) => {
  const statusOptions: { value: PipelineRunStatus; label: string }[] = [
    { value: 'PREPARING', label: 'Preparing' },
    { value: 'RUNNING', label: 'In Progress' },
    { value: 'SUCCEEDED', label: 'Done' },
    { value: 'FAILED', label: 'Failed' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px', flex: '1 1 15%' }}>
      <div style={{ fontWeight: 600, fontSize: '14px' }}>Status</div>
      <Select
        id='filter-status'
        options={statusOptions}
        value={filters.status}
        placeholder='All Statuses'
        styles={{
          control: (provided) => ({
            ...provided,
            minHeight: '2.25rem',
            height: '2.25rem',
          }),
        }}
        onChange={(selectedStatus) => {
          if (selectedStatus === null) {
            // Clear the status filter
            handleInputChange('status', '');
            return;
          }
          handleInputChange('status', selectedStatus.value);
        }}
        isClearable
      />
    </div>
  );
};

const PipelineFilterControl = ({
  filters,
  handleInputChange,
  pipelinesList,
}: {
  filters: FilterValues;
  handleInputChange: (field: keyof FilterValues, value: string) => void;
  pipelinesList: Pipeline[];
}) => {
  const pipelineOptions = pipelinesList.map((pipeline) => ({
    value: pipeline.pipelineName,
    label: pipeline.pipelineName,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px', flex: '1 1 15%' }}>
      <div style={{ fontWeight: 600, fontSize: '14px' }}>Pipeline</div>
      <Select
        id='filter-pipelineName'
        options={pipelineOptions}
        value={filters.pipelineName}
        placeholder='All Pipelines'
        styles={{
          control: (provided) => ({
            ...provided,
            minHeight: '2.25rem',
            height: '2.25rem',
          }),
        }}
        onChange={(selectedPipeline) => {
          if (selectedPipeline === null) {
            // Clear the pipeline name filter
            handleInputChange('pipelineName', '');
            return;
          }
          handleInputChange('pipelineName', selectedPipeline.value);
        }}
        isClearable
      />
    </div>
  );
};
