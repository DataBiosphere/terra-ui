import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Pipeline } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { mockPipeline } from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { FilterValues, TableFilters } from './TableFilters';

jest.mock('src/components/input', () => ({
  ...jest.requireActual('src/components/input'),
  DelayedSearchInput: jest.requireActual('src/components/input').SearchInput,
}));

describe('TableFilters', () => {
  const mockPipelinesList: Pipeline[] = [mockPipeline('array_imputation'), mockPipeline('glimpse_imputation')];

  const defaultProps = {
    filters: {},
    onFilterChange: jest.fn(),
    pipelinesList: mockPipelinesList,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Filter Controls Display', () => {
    it('renders all four filter controls', () => {
      render(<TableFilters {...defaultProps} />);

      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Filter by description...')).toBeInTheDocument();

      expect(screen.getByText('Job ID')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Filter by Job ID...')).toBeInTheDocument();

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('All Statuses')).toBeInTheDocument();

      expect(screen.getByText('Pipeline')).toBeInTheDocument();
      expect(screen.getByText('All Pipelines')).toBeInTheDocument();
    });

    it('renders clear button', () => {
      render(<TableFilters {...defaultProps} />);

      const clearButton = screen.getByRole('button', { name: 'Clear' });
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Description Filter', () => {
    it('displays current description filter value', () => {
      const filters: FilterValues = { description: 'test description' };
      render(<TableFilters {...defaultProps} filters={filters} />);

      const descriptionInput = screen.getByPlaceholderText('Filter by description...');
      expect(descriptionInput).toHaveValue('test description');
    });

    it('calls onFilterChange when description is entered', async () => {
      const onFilterChange = jest.fn();

      render(<TableFilters {...defaultProps} onFilterChange={onFilterChange} />);

      const descriptionInput = screen.getByPlaceholderText('Filter by description...');
      fireEvent.change(descriptionInput, { target: { value: 'my description' } });

      expect(onFilterChange).toHaveBeenLastCalledWith({
        description: 'my description',
      });
    });

    it('calls onFilterChange with undefined when description is cleared', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      const filters: FilterValues = { description: 'existing' };

      render(<TableFilters {...defaultProps} filters={filters} onFilterChange={onFilterChange} />);

      const descriptionInput = screen.getByPlaceholderText('Filter by description...');
      await user.clear(descriptionInput);

      expect(onFilterChange).toHaveBeenCalledWith({
        description: undefined,
      });
    });
  });

  describe('Job ID Filter', () => {
    it('displays current job ID filter value', () => {
      const filters: FilterValues = { jobId: 'job-123' };
      render(<TableFilters {...defaultProps} filters={filters} />);

      const jobIdInput = screen.getByPlaceholderText('Filter by Job ID...');
      expect(jobIdInput).toHaveValue('job-123');
    });

    it('calls onFilterChange when job ID is entered', async () => {
      const onFilterChange = jest.fn();

      render(<TableFilters {...defaultProps} onFilterChange={onFilterChange} />);

      const jobIdInput = screen.getByPlaceholderText('Filter by Job ID...');
      fireEvent.change(jobIdInput, { target: { value: 'job-456' } });

      expect(onFilterChange).toHaveBeenCalledWith({
        jobId: 'job-456',
      });
    });

    it('calls onFilterChange with undefined when job ID is cleared', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      const filters: FilterValues = { jobId: 'job-123' };

      render(<TableFilters {...defaultProps} filters={filters} onFilterChange={onFilterChange} />);

      const jobIdInput = screen.getByPlaceholderText('Filter by Job ID...');
      await user.clear(jobIdInput);

      expect(onFilterChange).toHaveBeenCalledWith({
        jobId: undefined,
      });
    });
  });

  describe('Status Filter', () => {
    it('displays current status filter value', () => {
      const filters: FilterValues = { status: 'SUCCEEDED' };
      render(<TableFilters {...defaultProps} filters={filters} />);

      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('calls onFilterChange when status is selected', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();

      render(<TableFilters {...defaultProps} onFilterChange={onFilterChange} />);

      const statusControl = screen.getByText('All Statuses');
      await user.click(statusControl);

      const failedOption = screen.getByText('Failed');
      await user.click(failedOption);

      expect(onFilterChange).toHaveBeenCalledWith({
        status: 'FAILED',
      });
    });

    it('displays all status options when dropdown is opened', async () => {
      const user = userEvent.setup();

      render(<TableFilters {...defaultProps} />);

      const statusControl = screen.getByText('All Statuses');
      await user.click(statusControl);

      expect(screen.getByText('Preparing')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  describe('Pipeline Filter', () => {
    it('displays current pipeline filter value', () => {
      const filters: FilterValues = { pipelineName: 'array_imputation' };
      render(<TableFilters {...defaultProps} filters={filters} />);

      expect(screen.getByText('array_imputation')).toBeInTheDocument();
    });

    it('calls onFilterChange when pipeline is selected', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();

      render(<TableFilters {...defaultProps} onFilterChange={onFilterChange} />);

      const pipelineControl = screen.getByText('All Pipelines');
      await user.click(pipelineControl);

      const arrayImputationOption = screen.getByText('array_imputation');
      await user.click(arrayImputationOption);

      expect(onFilterChange).toHaveBeenCalledWith({
        pipelineName: 'array_imputation',
      });
    });

    it('displays all pipeline options from pipelinesList', async () => {
      const user = userEvent.setup();

      render(<TableFilters {...defaultProps} />);

      const pipelineControl = screen.getByText('All Pipelines');
      await user.click(pipelineControl);

      expect(screen.getByText('array_imputation')).toBeInTheDocument();
      expect(screen.getByText('glimpse_imputation')).toBeInTheDocument();
    });
  });

  describe('Clear Button', () => {
    it('disables clear button when no filters are active', () => {
      render(<TableFilters {...defaultProps} />);

      const clearButton = screen.getByRole('button', { name: 'Clear' });
      expect(clearButton).toHaveAttribute('aria-disabled', 'true');
    });

    it('enables clear button when filters are active', () => {
      const filters: FilterValues = { description: 'test' };
      render(<TableFilters {...defaultProps} filters={filters} />);

      const clearButton = screen.getByRole('button', { name: 'Clear' });
      expect(clearButton).toHaveAttribute('aria-disabled', 'false');
    });

    it('calls onFilterChange with empty object when clear is clicked', async () => {
      const user = userEvent.setup();
      const onFilterChange = jest.fn();
      const filters: FilterValues = {
        description: 'test',
        jobId: 'job-123',
        status: 'SUCCEEDED',
        pipelineName: 'array_imputation',
      };

      render(<TableFilters {...defaultProps} filters={filters} onFilterChange={onFilterChange} />);

      const clearButton = screen.getByRole('button', { name: 'Clear' });
      await user.click(clearButton);

      expect(onFilterChange).toHaveBeenCalledWith({});
    });
  });

  describe('Multiple Filters', () => {
    it('preserves other filter values when one filter changes', async () => {
      const onFilterChange = jest.fn();
      const filters: FilterValues = {
        description: 'existing description',
        status: 'SUCCEEDED',
      };

      render(<TableFilters {...defaultProps} filters={filters} onFilterChange={onFilterChange} />);

      const jobIdInput = screen.getByPlaceholderText('Filter by Job ID...');
      fireEvent.change(jobIdInput, { target: { value: 'new-job-id' } });

      expect(onFilterChange).toHaveBeenCalledWith({
        description: 'existing description',
        status: 'SUCCEEDED',
        jobId: 'new-job-id',
      });
    });

    it('displays all active filters simultaneously', () => {
      const filters: FilterValues = {
        description: 'test description',
        jobId: 'job-789',
        status: 'RUNNING',
        pipelineName: 'glimpse_imputation',
      };

      render(<TableFilters {...defaultProps} filters={filters} />);

      const descriptionInput = screen.getByPlaceholderText('Filter by description...');
      const jobIdInput = screen.getByPlaceholderText('Filter by Job ID...');

      expect(descriptionInput).toHaveValue('test description');
      expect(jobIdInput).toHaveValue('job-789');
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('glimpse_imputation')).toBeInTheDocument();
    });
  });
});
