import { render, screen } from '@testing-library/react';
import React from 'react';

import { HelpfulTipsWidget, PIPELINE_TIPS } from './HelpfulTipsWidget';

describe('HelpfulTips', () => {
  it('renders all tips from mocked PIPELINE_TIPS', () => {
    render(<HelpfulTipsWidget pipelineName='array_imputation' />);
    expect(screen.getByText('Helpful Tips')).toBeInTheDocument();
    PIPELINE_TIPS.array_imputation.forEach((tip) => {
      expect(screen.getByTestId(`tip-${tip.id}`)).toBeInTheDocument();
    });
  });

  it('does not display the widget if a pipeline doesnt have tips', () => {
    // Add a new pipeline to PIPELINE_TIPS in the component for this test to be meaningful
    // For now, this will just check that unrelated text is not present
    render(<HelpfulTipsWidget pipelineName='some_fake_pipeline' />);
    expect(screen.queryByText('Helpful Tips')).not.toBeInTheDocument();
  });
});
