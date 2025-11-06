import { ButtonPrimary, Select } from '@terra-ui-packages/components';
import React from 'react';
import { DelayedSearchInput } from 'src/components/input';
import { Pipeline, PipelineRunStatus } from 'src/libs/ajax/teaspoons/teaspoons-models';

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

const STATUS_OPTIONS: { value: PipelineRunStatus; label: string }[] = [
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'RUNNING', label: 'In Progress' },
  { value: 'SUCCEEDED', label: 'Done' },
  { value: 'FAILED', label: 'Failed' },
];

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

  const PIPELINE_OPTIONS = pipelinesList.map((pipeline) => ({
    value: pipeline.pipelineName,
    label: pipeline.pipelineName,
  }));

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
        {/* Description Filter */}
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

        {/* Job ID Filter */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            minWidth: '200px',
            flex: '1 1 25%',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Job ID</div>
          <DelayedSearchInput
            id='filter-jobId'
            placeholder='Filter by Job ID...'
            value={filters.jobId || ''}
            onChange={(value: string) => handleInputChange('jobId', value)}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px', flex: '1 1 15%' }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Status</div>
          <Select
            id='filter-status'
            options={STATUS_OPTIONS}
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

        {/* Pipeline Name Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px', flex: '1 1 15%' }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Pipeline</div>
          <Select
            id='filter-pipelineName'
            options={PIPELINE_OPTIONS}
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

        <div
          style={{
            display: 'flex',
            flex: '0 0 auto',
            justifyContent: 'center',
          }}
        >
          <ButtonPrimary
            disabled={!hasActiveFilters}
            onClick={handleClearFilters}
            // style={{
            //   height: '2.33rem',
            // }}
          >
            Clear
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
};
