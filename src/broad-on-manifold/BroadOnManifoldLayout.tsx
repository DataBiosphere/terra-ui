import { Link, ThemeProvider } from '@terra-ui-packages/components';
import React, { PropsWithChildren, ReactNode } from 'react';
import { manifoldColors } from 'src/broad-on-manifold/broad-on-manifold-utils';
import FooterWrapper from 'src/components/FooterWrapper';
import { TopBar, TopBarBranding } from 'src/components/TopBar';
import { brands } from 'src/libs/brands';
import * as Nav from 'src/libs/nav';

const manifoldTopBar: TopBarBranding = {
  backgroundColor: manifoldColors.dark(),
  foregroundColor: 'white',
  borderColor: manifoldColors.accent(),
  logo: <img src={brands.manifold.logos.white} alt='Manifold' style={{ height: 32, margin: '0 1.25rem 0 0.5rem' }} />,
};

/**
 * Page frame for the Broad on Manifold pages. Terra's top bar, recolored with the Manifold logo and no title, keeps the main menu,
 * alerts and sign-in; Terra's footer stays because the site is still app.terra.bio. Shared components in the body
 * pick up the Manifold theme.
 */
export const BroadOnManifoldLayout = ({ children }: PropsWithChildren): ReactNode => (
  <FooterWrapper alwaysShow>
    <TopBar href={Nav.getLink('broad-on-manifold')} branding={manifoldTopBar}>
      <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <ThemeProvider theme={brands.manifold.theme}>
          <Link href={Nav.getLink('root')} style={{ color: 'white', textDecoration: 'underline', fontSize: 15 }}>
            Back to Terra
          </Link>
        </ThemeProvider>
      </div>
    </TopBar>
    <ThemeProvider theme={brands.manifold.theme}>
      <div
        role='main'
        style={{
          flexGrow: 1,
          padding: '2.5rem 5rem 4rem',
          color: manifoldColors.dark(),
          backgroundColor: manifoldColors.light(0.5),
        }}
      >
        {children}
      </div>
    </ThemeProvider>
  </FooterWrapper>
);
