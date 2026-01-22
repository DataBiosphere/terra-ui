import { screen } from '@testing-library/react';
import React from 'react';
import { PipelineInput } from 'src/libs/ajax/teaspoons/teaspoons-models';
import {
  mockPipelineRunResponse,
  mockPipelineWithDetails,
} from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { JobInputsView } from './JobInputsView';

describe('JobInputsView', () => {
  const mockInputDefinitions: PipelineInput[] = mockPipelineWithDetails('array_imputation').inputs;

  const mockInputs: Record<string, string> = {
    minDr2ForInclusion: '0.8',
    allowChunkFailures: 'true',
    multiSampleVcf: 'gs://bucket/path/to/file.vcf',
    outputBasename: 'outputs',
  };

  const mockRunResponse = mockPipelineRunResponse('SUCCEEDED');

  const mockPipelineRunReport = {
    ...mockRunResponse,
    pipelineRunReport: {
      ...mockRunResponse.pipelineRunReport,
      userInputs: mockInputs,
    },
  };

  it('renders all input items when inputs are provided', () => {
    render(<JobInputsView inputDefinitions={mockInputDefinitions} pipelineRunResult={mockPipelineRunReport} />);

    expect(screen.getByText('minimum imputation quality for inclusion')).toBeInTheDocument();
    expect(screen.getByText('Allow chunk failures')).toBeInTheDocument();
    expect(screen.getByText('multi-sample VCF file')).toBeInTheDocument();
    expect(screen.getByText('output basename')).toBeInTheDocument();
  });

  it('renders input values', () => {
    render(<JobInputsView inputDefinitions={mockInputDefinitions} pipelineRunResult={mockPipelineRunReport} />);

    expect(screen.getByText('gs://bucket/path/to/file.vcf')).toBeInTheDocument();
    expect(screen.getByText('0.8')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('outputs')).toBeInTheDocument();
  });

  it('renders input type badges', () => {
    render(<JobInputsView inputDefinitions={mockInputDefinitions} pipelineRunResult={mockPipelineRunReport} />);

    expect(screen.getByText('file')).toBeInTheDocument();
    expect(screen.getByText('float')).toBeInTheDocument();
    expect(screen.getByText('boolean')).toBeInTheDocument();
    expect(screen.getByText('string')).toBeInTheDocument();
  });

  it('uses display name when available', () => {
    render(<JobInputsView inputDefinitions={mockInputDefinitions} pipelineRunResult={mockPipelineRunReport} />);

    expect(screen.getByText('output basename')).toBeInTheDocument();
    expect(screen.queryByText('outputBasename')).not.toBeInTheDocument();
  });

  it('falls back to input key when display name is not available', () => {
    const inputsWithUnknownKey = {
      unknownInput: 'some value',
    };

    const reportWithUnknownInput = {
      ...mockRunResponse,
      pipelineRunReport: {
        ...mockRunResponse.pipelineRunReport,
        userInputs: inputsWithUnknownKey,
      },
    };

    render(<JobInputsView inputDefinitions={mockInputDefinitions} pipelineRunResult={reportWithUnknownInput} />);

    expect(screen.getByText('unknownInput')).toBeInTheDocument();
  });

  it('renders "There was an error." when inputs object is empty', () => {
    const reportWithEmptyInputs = {
      ...mockRunResponse,
      pipelineRunReport: {
        ...mockRunResponse.pipelineRunReport,
        userInputs: {},
      },
    };

    render(<JobInputsView inputDefinitions={mockInputDefinitions} pipelineRunResult={reportWithEmptyInputs} />);

    expect(screen.getByText('There was an error.')).toBeInTheDocument();
  });

  it('renders "There was an error." when inputs is undefined', () => {
    const reportWithUndefinedInputs = {
      ...mockRunResponse,
      pipelineRunReport: {
        ...mockRunResponse.pipelineRunReport,
        userInputs: undefined,
      },
    };

    render(<JobInputsView inputDefinitions={mockInputDefinitions} pipelineRunResult={reportWithUndefinedInputs} />);

    expect(screen.getByText('There was an error.')).toBeInTheDocument();
  });

  it('does not render input items when inputs object is empty', () => {
    const reportWithEmptyInputs = {
      ...mockRunResponse,
      pipelineRunReport: {
        ...mockRunResponse.pipelineRunReport,
        userInputs: {},
      },
    };

    render(<JobInputsView inputDefinitions={mockInputDefinitions} pipelineRunResult={reportWithEmptyInputs} />);

    expect(screen.queryByText('minimum imputation quality for inclusion')).not.toBeInTheDocument();
    expect(screen.queryByText('Allow chunk failures')).not.toBeInTheDocument();
    expect(screen.queryByText('multi-sample VCF file')).not.toBeInTheDocument();
    expect(screen.queryByText('output basename')).not.toBeInTheDocument();
  });
});
