import { render, screen } from '@testing-library/react';
import React from 'react';
import { PipelineWithDetails } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { mockPipelineWithDetails } from 'src/pages/scientificServices/pipelines/utils/mock-utils';
import { PipelineOutputsWidget } from 'src/pages/scientificServices/pipelines/widgets/PipelineOutputsWidget';

describe('PipelineOutputsWidget', () => {
  it('renders all outputs for a pipeline', () => {
    const pipelineDetails = mockPipelineWithDetails('array_imputation');
    const expectedOutputDescriptions: Record<string, { description: string }> = Object.fromEntries(
      pipelineDetails.outputs.map((output) => [
        output.name,
        { description: output.description || 'No description available' },
      ])
    );

    render(<PipelineOutputsWidget selectedPipelineDetails={pipelineDetails} />);

    expect(screen.getByText('Pipeline Outputs')).toBeInTheDocument();

    pipelineDetails.outputs?.forEach((output) => {
      expect(screen.getByText(output.name)).toBeInTheDocument();
      expect(screen.getByText(expectedOutputDescriptions[output.name].description)).toBeInTheDocument();
    });
  });

  it('displays "no description available" for outputs without a description', () => {
    const pipelineDetails = {
      ...mockPipelineWithDetails('array_imputation'),
      outputs: [{ name: 'unknownOutput', type: 'STRING' }],
    } as PipelineWithDetails;

    render(<PipelineOutputsWidget selectedPipelineDetails={pipelineDetails} />);

    expect(screen.getByText('unknownOutput')).toBeInTheDocument();
    expect(screen.getByText('No description available')).toBeInTheDocument();
  });

  it('displays "no outputs" message for pipelines without outputs', () => {
    const pipelineDetails = { ...mockPipelineWithDetails('array_imputation'), outputs: [] };
    render(<PipelineOutputsWidget selectedPipelineDetails={pipelineDetails} />);

    expect(screen.getByText('This pipeline does not have any outputs')).toBeInTheDocument();
  });

  it('displays "select a pipeline" prior to pipeline details being loaded', () => {
    render(<PipelineOutputsWidget selectedPipelineDetails={undefined} />);

    expect(screen.queryByText('Pipeline Outputs')).toBeInTheDocument();
    expect(screen.getByText('Select a pipeline to see outputs')).toBeInTheDocument();
  });
});
