import { render, screen } from '@testing-library/react';
import React from 'react';
import { mockPipeline } from 'src/pages/scientificServices/pipelines/utils/mock-utils';

import { HelpfulTipsWidget, PIPELINE_TIPS } from './HelpfulTipsWidget';

describe('HelpfulTipsWidget', () => {
  it('renders the widget title and pipeline-specific tips for a pipeline with tips', () => {
    render(<HelpfulTipsWidget selectedPipeline={mockPipeline('array_imputation')} />);

    expect(screen.getByText('Getting Started + Helpful Hints')).toBeInTheDocument();
    expect(screen.getByText('Input requirements:')).toBeInTheDocument();

    PIPELINE_TIPS.array_imputation.forEach((tip) => {
      expect(screen.getByTestId(`tip-${tip.id}`)).toBeInTheDocument();
    });

    expect(screen.getByTestId('tip-cloud-inputs')).toBeInTheDocument();
    expect(screen.getByTestId('tip-cloud-outputs')).toBeInTheDocument();
  });

  it('always renders the common cloud inputs/outputs tips, regardless of pipeline', () => {
    render(<HelpfulTipsWidget selectedPipeline={mockPipeline('new_imputation_pipeline')} />);

    expect(screen.getByTestId('tip-cloud-inputs')).toBeInTheDocument();
    expect(screen.getByTestId('tip-cloud-outputs')).toBeInTheDocument();
  });

  it('does not render the "Input requirements" section for a pipeline without specific tips', () => {
    render(<HelpfulTipsWidget selectedPipeline={mockPipeline('new_imputation_pipeline')} />);

    expect(screen.queryByText('Input requirements:')).not.toBeInTheDocument();
  });

  it('still renders the widget and common tips for a pipeline without specific tips', () => {
    render(<HelpfulTipsWidget selectedPipeline={mockPipeline('new_imputation_pipeline')} />);

    expect(screen.getByText('Getting Started + Helpful Hints')).toBeInTheDocument();
    expect(screen.getByTestId('tip-cloud-inputs')).toBeInTheDocument();
    expect(screen.getByTestId('tip-cloud-outputs')).toBeInTheDocument();
  });

  it('does not render the widget when no pipeline is selected', () => {
    render(<HelpfulTipsWidget selectedPipeline={undefined} />);

    expect(screen.queryByText('Getting Started + Helpful Hints')).not.toBeInTheDocument();
  });

  it('renders tips for a different pipeline (low_pass_imputation)', () => {
    render(<HelpfulTipsWidget selectedPipeline={mockPipeline('low_pass_imputation')} />);

    PIPELINE_TIPS.low_pass_imputation.forEach((tip) => {
      expect(screen.getByTestId(`tip-${tip.id}`)).toBeInTheDocument();
    });
    expect(screen.getByTestId('tip-cloud-inputs')).toBeInTheDocument();
    expect(screen.getByTestId('tip-cloud-outputs')).toBeInTheDocument();
  });
});
