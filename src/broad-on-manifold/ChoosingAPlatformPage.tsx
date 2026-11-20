import { ButtonOutline, ButtonPrimary, Link } from '@terra-ui-packages/components';
import React, { CSSProperties, ReactNode } from 'react';
import { manifoldColors, useIsBroadOnManifoldUser } from 'src/broad-on-manifold/broad-on-manifold-utils';
import { BroadOnManifoldLayout } from 'src/broad-on-manifold/BroadOnManifoldLayout';
import terraColors from 'src/libs/colors';
import * as Nav from 'src/libs/nav';
import * as Style from 'src/libs/style';
import * as Utils from 'src/libs/utils';
import { NotFound } from 'src/pages/NotFound';

// Copy reviewed on CTM-762 (2026-11-16).
const features: { topic: string; terra: ReactNode; manifold: ReactNode }[] = [
  { topic: 'Cloud', terra: 'GCP', manifold: 'AWS' },
  { topic: 'Billing', terra: 'Requires a GCP billing account', manifold: 'Requires a Broad AWS cost object' },
  {
    topic: 'Data management',
    terra: 'Terra Data Repository and workspace data tables',
    manifold: 'Datasets and analysis worksheets that integrate with bioinformatics workflows',
  },
  { topic: 'Workflows', terra: 'WDL', manifold: 'WDL and Nextflow' },
  {
    topic: 'Governed in-platform agents',
    terra: 'Not available',
    manifold: 'Platform, analysis, and data ingest agents, plus build your own',
  },
  { topic: 'Local agent access via MCP', terra: 'Unofficial', manifold: 'Official MCP server' },
  {
    topic: 'Claude Code in a compute environment',
    terra: 'Not available',
    manifold: "Offered through AWS Bedrock, so your data stays within Broad's AWS environment",
  },
  { topic: 'Federal data research (NIST 800-53)', terra: 'Supported', manifold: 'Supported' },
  { topic: 'BCL data delivery', terra: 'Supported', manifold: 'Supported' },
  {
    topic: 'Security and compliance',
    terra: (
      <Link href='https://terra.bio/terra-security/' {...Utils.newTabLinkProps}>
        Terra security
      </Link>
    ),
    manifold: (
      <Link href='https://trust.manifold.ai/' {...Utils.newTabLinkProps}>
        Manifold Trust Center
      </Link>
    ),
  },
];

const manifoldSupportEmail = 'support@manifold.ai';

const cardStyle: CSSProperties = { ...Style.elements.card.container, padding: '1.5rem', gap: '0.75rem', flex: 1 };
const cellStyle: CSSProperties = {
  padding: '0.75rem 1rem',
  borderBottom: `1px solid ${manifoldColors.light(1.2)}`,
  textAlign: 'left',
  verticalAlign: 'top',
  lineHeight: 1.5,
};

/** Helps Broad Institute members decide between Terra workspaces and Broad on Manifold projects. */
const ChoosingAPlatformPage = (): ReactNode => {
  const isBroadOnManifoldUser = useIsBroadOnManifoldUser();
  if (!isBroadOnManifoldUser) {
    return <NotFound />;
  }

  return (
    <BroadOnManifoldLayout>
      <div style={{ maxWidth: 960 }}>
        <h1 style={{ fontSize: 32, margin: '0 0 1.5rem' }}>Choosing where to work</h1>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 20, margin: 0 }}>Starting a new project?</h2>
            <div style={{ lineHeight: 1.5, flexGrow: 1 }}>Start it on Broad on Manifold.</div>
            <div>
              <ButtonPrimary
                href={Nav.getLink('broad-on-manifold')}
                style={{ padding: '0 1.5rem', textTransform: 'none' }}
              >
                Get started with Manifold
              </ButtonPrimary>
            </div>
          </div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: 20, margin: 0 }}>Continuing an existing project?</h2>
            <div style={{ lineHeight: 1.5 }}>Keep working in your Terra workspaces.</div>
            <div>
              <ButtonOutline href={Nav.getLink('workspaces')} style={{ padding: '0 1.5rem', textTransform: 'none' }}>
                Go to Terra workspaces
              </ButtonOutline>
            </div>
            <div
              style={{
                lineHeight: 1.5,
                fontSize: 14,
                paddingTop: '0.75rem',
                borderTop: `1px solid ${manifoldColors.light(1.2)}`,
              }}
            >
              Want to move a project to Manifold? Early-bird data transfer credits are available. Reach out to{' '}
              <Link href={`mailto:${manifoldSupportEmail}`}>{manifoldSupportEmail}</Link>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: 20, margin: '0 0 0.75rem' }}>Available features</h2>
        <table
          style={{
            ...Style.elements.card.container,
            display: 'table',
            padding: 0,
            borderCollapse: 'collapse',
            width: '100%',
          }}
        >
          <thead>
            <tr>
              <th style={{ ...cellStyle, width: '28%' }}>Topic</th>
              <th style={{ ...cellStyle, backgroundColor: terraColors.primary(), color: 'white' }}>Terra workspaces</th>
              <th style={{ ...cellStyle, backgroundColor: manifoldColors.accent(), color: 'white' }}>
                Manifold projects
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map(({ topic, terra, manifold }) => (
              <tr key={topic}>
                <th scope='row' style={{ ...cellStyle, fontWeight: 600 }}>
                  {topic}
                </th>
                <td style={{ ...cellStyle, backgroundColor: terraColors.primary(0.08) }}>{terra}</td>
                <td style={{ ...cellStyle, backgroundColor: manifoldColors.light() }}>{manifold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BroadOnManifoldLayout>
  );
};

export const navPaths = [
  {
    name: 'broad-on-manifold-choosing-a-platform',
    path: '/broad-on-manifold/choosing-a-platform',
    component: ChoosingAPlatformPage,
    title: 'Choosing where to work',
  },
];
