import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
import { h } from 'react-hyperscript-helpers';
import HelpfulLinksBox from 'src/workflows-app/components/HelpfulLinksBox';

describe('HelpfulLinksBox', () => {
  it('should render all links for Covid-19 workflow', () => {
    // ** ACT **
    render(
      h(HelpfulLinksBox, {
        method: { name: 'fetch_sra_to_bam' },
      })
    );

    // ** ASSERT **
    expect(screen.getByText('Have questions?')).toBeInTheDocument();
    expect(screen.getByText('Covid-19 Surveillance tutorial guide')).toBeInTheDocument();
    expect(screen.getByText('Covid-19 Featured Workspace')).toBeInTheDocument();
    expect(screen.getByText('How to set up and run a workflow')).toBeInTheDocument();
  });

  it('should render not render links related to Covid workflow for a non-Covid-19 workflow', () => {
    // ** ACT **
    render(
      h(HelpfulLinksBox, {
        method: { name: 'my_workflow' },
      })
    );

    // ** ASSERT **
    expect(screen.getByText('Have questions?')).toBeInTheDocument();
    expect(screen.getByText('How to set up and run a workflow')).toBeInTheDocument();
    expect(screen.queryByText('Covid-19 Surveillance tutorial guide')).not.toBeInTheDocument();
    expect(screen.queryByText('Covid-19 Featured Workspace')).not.toBeInTheDocument();
  });
});
