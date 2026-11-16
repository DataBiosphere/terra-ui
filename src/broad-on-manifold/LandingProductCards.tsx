import { Link, ThemeProvider } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import { broadCostObjectRequestUrl } from 'src/broad-on-manifold/broad-on-manifold-utils';
import { ProductCard } from 'src/broad-on-manifold/ProductCard';
import { icon } from 'src/components/icons';
import { Metrics } from 'src/libs/ajax/Metrics';
import { brands } from 'src/libs/brands';
import Events, { MetricsEventName } from 'src/libs/events';
import * as Nav from 'src/libs/nav';

const captureLandingEvent = (event: MetricsEventName) => () =>
  void Metrics().captureEvent(event, { source: 'landingPage' });

// The two cards together are as wide as the row of three landing cards they replace.
const rowWidth = 'calc(225px * 3 + 1rem * 2)';

/**
 * Landing-page choice between the two products a Broad Institute member can use: Terra workspaces and Broad on
 * Manifold projects. Shown in place of the usual landing cards only to signed-in Broad users.
 */
export const LandingProductCards = (): ReactNode => {
  return (
    <div style={{ width: rowWidth, maxWidth: '100%', margin: '2rem 0 1rem' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 1rem' }}>Choose where to work</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: '1rem' }}>
        <ProductCard
          id='terra-product-card'
          logo={{ src: brands.terra.logos.color, alt: 'Terra', height: 40 }}
          audience='Terra users'
          title='Terra workspaces'
          description='Work with classic Terra workspaces on Google Cloud. Run analyses, run workflows, and share data and results.'
          primaryAction={{ label: 'View Workspaces', href: Nav.getLink('workspaces') }}
          links={[
            { label: 'View Example Workflows', href: Nav.getLink('library-showcase') },
            { label: 'Browse Data on DUOS', href: 'https://duos.org', external: true },
          ]}
        />
        <ThemeProvider theme={brands.manifold.theme}>
          <ProductCard
            id='manifold-product-card'
            logo={{ src: brands.manifold.logos.color, alt: 'Manifold', height: 30 }}
            audience='Broad Institute members'
            title='Manifold projects'
            description="Work with AI agent-first Manifold workbenches on the Broad Institute's AWS deployment. Run analyses, run workflows, and share data and results."
            primaryAction={{
              label: 'View Manifold projects',
              href: Nav.getLink('broad-on-manifold'),
              onClick: captureLandingEvent(Events.broadOnManifoldViewProjects),
            }}
            links={[
              {
                label: 'Request a cost object',
                href: broadCostObjectRequestUrl,
                external: true,
                onClick: captureLandingEvent(Events.broadOnManifoldRequestCostObject),
              },
            ]}
          />
        </ThemeProvider>
      </div>
      <p style={{ textAlign: 'center', fontSize: 15, margin: '1.25rem 0 0' }}>
        Not sure which to use?{' '}
        <Link
          href={Nav.getLink('broad-on-manifold-choosing-a-platform')}
          onClick={captureLandingEvent(Events.broadOnManifoldHelpMeChoose)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}
        >
          Compare Terra and Manifold
          {icon('arrowRight', { size: 14 })}
        </Link>
      </p>
    </div>
  );
};
