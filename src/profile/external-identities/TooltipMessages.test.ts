import { screen } from '@testing-library/react';
import { renderWithAppContexts } from 'src/testing/test-utils';

import { tooltipMessages } from './TooltipMessages';

describe('TooltipMessages', () => {
  it('renders the RAS tooltip message correctly', () => {
    renderWithAppContexts(tooltipMessages.ras);
    expect(
      screen.getByText(
        /Linking with RAS will allow Terra to automatically determine if you can access controlled datasets hosted in Terra based on your valid passport visas or your valid dbGaP applications via eRA Commons./
      )
    ).toBeInTheDocument();
    expect(screen.getByText('AnVIL Portal')).toBeInTheDocument();
    expect(screen.getByText('AnVIL Portal').closest('a')).toHaveAttribute('href', 'https://anvilproject.org/');
  });

  it('renders the Fence tooltip message correctly', () => {
    renderWithAppContexts(tooltipMessages.fence);
    expect(
      screen.getByText(
        /Linking with NHLBI BDC will allow Terra to automatically determine if you can access controlled datasets hosted on the Gen3 platform./
      )
    ).toBeInTheDocument();
    expect(screen.getByText('NHLBI BioData Catalyst')).toBeInTheDocument();
    expect(screen.getByText('NHLBI BioData Catalyst').closest('a')).toHaveAttribute(
      'href',
      'https://gen3.biodatacatalyst.nhlbi.nih.gov/'
    );
  });

  it('renders the DCF Fence tooltip message correctly', () => {
    renderWithAppContexts(tooltipMessages.dcf_fence);
    expect(
      screen.getByText(
        /Linking with NCI CRDC will allow Terra to automatically determine if you can access controlled datasets hosted on the Gen3 platform./
      )
    ).toBeInTheDocument();
    expect(screen.getByText('NCI Data Commons Framework Services')).toBeInTheDocument();
    expect(screen.getByText('NCI Data Commons Framework Services').closest('a')).toHaveAttribute(
      'href',
      'https://nci-crdc.datacommons.io/'
    );
  });

  it('renders the Kids First tooltip message correctly', () => {
    renderWithAppContexts(tooltipMessages.kids_first);
    expect(
      screen.getByText(
        /Linking with Kids First DRC will allow Terra to automatically determine if you can access controlled datasets hosted on the Gen3 platform./
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Kids First Data Catalog Portal')).toBeInTheDocument();
    expect(screen.getByText('Kids First Data Catalog Portal').closest('a')).toHaveAttribute(
      'href',
      'https://data.kidsfirstdrc.org/'
    );
  });
});
