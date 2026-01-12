import { expect } from '@storybook/test';
import { screen } from '@testing-library/react';
import React from 'react';
import { PipelineTimelineEvent } from 'src/pages/scientificServices/pipelines/tabs/history/details/sections/timeline/pipeline-timeline-utils';
import { renderWithAppContexts as render } from 'src/testing/test-utils';

import { PipelineRunTimelineEvent } from './PipelineRunTimelineEvent';

describe('PipelineRunTimelineEvent', () => {
  it('should render event label', () => {
    const event: PipelineTimelineEvent = {
      label: 'Quality Checks',
      status: 'SUCCEEDED',
      moreInfo: 'Input data passed QC checks',
    };

    render(<PipelineRunTimelineEvent event={event} isLast={false} />);

    expect(screen.getByText('Quality Checks')).toBeInTheDocument();
  });

  it('should render event moreInfo when provided', () => {
    const event: PipelineTimelineEvent = {
      label: 'Quota Charged',
      status: 'SUCCEEDED',
      moreInfo: '250 samples',
    };

    render(<PipelineRunTimelineEvent event={event} isLast={false} />);

    expect(screen.getByText('250 samples')).toBeInTheDocument();
  });

  it('should render timestamp when provided', () => {
    const event: PipelineTimelineEvent = {
      label: 'Submitted',
      status: 'SUCCEEDED',
      timestamp: '2024-01-01T10:00:00Z',
    };

    render(<PipelineRunTimelineEvent event={event} isLast={false} />);

    expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
  });
});
