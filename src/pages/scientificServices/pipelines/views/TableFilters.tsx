import React from 'react';
import { TextInput } from 'src/components/input';
import { PipelineRunStatus } from 'src/libs/ajax/teaspoons/teaspoons-models';

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

const STATUS_OPTIONS: PipelineRunStatus[] = ['SUCCEEDED', 'RUNNING', 'FAILED', 'PREPARING'];

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {/* Description Filter */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            minWidth: '200px',
            maxWidth: '400px',
            flex: 1,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Description</div>
          <TextInput
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
            maxWidth: '400px',
            flex: 1,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Job ID</div>
          <TextInput
            id='filter-jobId'
            placeholder='Filter by Job ID...'
            value={filters.jobId || ''}
            onChange={(value: string) => handleInputChange('jobId', value)}
            styleProps={{ width: '100%' }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Status</div>
          <select
            id='filter-status'
            value={filters.status || ''}
            onChange={(e) => handleInputChange('status', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value=''>All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Pipeline Name Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px' }}>Pipeline</div>
          <select
            id='filter-pipelineName'
            value={filters.pipelineName || ''}
            onChange={(e) => handleInputChange('pipelineName', e.target.value)}
            style={{
              padding: '0.5rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value=''>All Pipelines</option>
            {availablePipelineNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
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
