import React from 'react';
import { PipelineRunResponse } from 'src/libs/ajax/teaspoons/teaspoons-models';
import { PipelineWidgetContainer } from 'src/pages/scientificServices/pipelines/tabs/run/widgets/PipelineWidgetContainer';

interface JobInputsOutputsProps {
  pipelineRunResult: PipelineRunResponse;
}

export const JobInputsOutputs = ({ pipelineRunResult }: JobInputsOutputsProps) => {
  return (
    <PipelineWidgetContainer title='Inputs & Outputs'>
      <div>Inputs & Outputs content will go here</div>
    </PipelineWidgetContainer>
  );
};
