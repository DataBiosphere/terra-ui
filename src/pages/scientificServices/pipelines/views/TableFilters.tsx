import { Select } from '@terra-ui-packages/components';
import React from 'react';
import { DelayedSearchInput, TextInput } from 'src/components/input';
import { PipelineRunStatus } from 'src/libs/ajax/teaspoons/teaspoons-models';
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
  availablePipelineNames: string[];
}

const STATUS_OPTIONS: string[] = ['Succeeded', 'Running', 'Failed', 'Preparing'];

export const TableFilters: React.FC<TableFiltersProps> = ({ filters, onFilterChange, availablePipelineNames }) => {
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
            styleProps={{ width: '100%' }}
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
            styleProps={{ width: '100%' }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px', flex: '1 1 15%' }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Status</div>
          <Select
            id='filter-status'
            options={STATUS_OPTIONS.map((status) => ({ value: status, label: status }))}
            value={filters.status ? { value: filters.status, label: filters.status } : 'bla'}
            placeholder='All Statuses'
            onChange={(selected) => {
              if (selected === null) {
                return;
              }
              // @ts-ignore
              handleInputChange('status', selected.value);
            }}
            isClearable
            styles={{ container: (base) => ({ ...base, minWidth: '150px' }) }}
          />
        </div>

        {/* Pipeline Name Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px', flex: '1 1 15%' }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Pipeline</div>
          <Select
            id='filter-pipelineName'
            options={availablePipelineNames.map((name) => ({ value: name, label: name }))}
            value={filters.pipelineName ? { value: filters.pipelineName, label: filters.pipelineName } : null}
            placeholder='All Pipelines'
            onChange={(selected) => {
              if (selected === null) {
                return;
              }
              // @ts-ignore
              handleInputChange('pipelineName', selected.value);
            }}
            isClearable
            styles={{ container: (base) => ({ ...base, minWidth: '150px' }) }}
          />
        </div>

        {/* Clear Filters Button */}
        <div style={{ display: 'flex', flex: '0 0 auto' }}>
          <button
            type='button'
            disabled={!hasActiveFilters}
            onClick={handleClearFilters}
            style={{
              color: hasActiveFilters ? '#46A3E9' : '#aaa',
              fontWeight: 600,
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              padding: '0.5rem',
              cursor: hasActiveFilters ? 'default' : 'not-allowed',
              fontSize: '14px',
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
