import { render, screen } from '@testing-library/react';
import React from 'react';

import { HelpfulTipsWidget, PIPELINE_TIPS } from './HelpfulTipsWidget';

describe('HelpfulTips', () => {
  it('renders all tips for a pipeline', () => {
    render(<HelpfulTipsWidget pipelineName='array_imputation' />);

    expect(screen.getByText('Helpful Tips')).toBeInTheDocument();

    PIPELINE_TIPS.array_imputation.forEach((tip) => {
      expect(screen.getByTestId(`tip-${tip.id}`)).toBeInTheDocument();
    });
  });

  it('does not display the widget if a pipeline doesnt have tips', () => {
    render(<HelpfulTipsWidget pipelineName='some_fake_pipeline' />);

    expect(screen.queryByText('Helpful Tips')).not.toBeInTheDocument();
  });
});
