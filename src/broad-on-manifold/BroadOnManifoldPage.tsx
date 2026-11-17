import { ButtonOutline, ButtonPrimary, Link } from '@terra-ui-packages/components';
import React, { ReactNode } from 'react';
import {
  broadCostObjectRequestUrl,
  getBroadOnManifoldSignInUrl,
  useIsBroadOnManifoldUser,
} from 'src/broad-on-manifold/broad-on-manifold-utils';
import { BroadOnManifoldLayout } from 'src/broad-on-manifold/BroadOnManifoldLayout';
import broadLogo from 'src/images/library/datasets/broad_logo.png';
import { Metrics } from 'src/libs/ajax/Metrics';
import Events from 'src/libs/events';
import * as Nav from 'src/libs/nav';
import * as Utils from 'src/libs/utils';
import { NotFound } from 'src/pages/NotFound';

const buttonStyle = { height: '2.75rem', padding: '0 1.5rem', fontSize: 15, textTransform: 'none' } as const;

/** Hands Broad Institute members off from Terra to the Broad Institute's Manifold instance. */
const BroadOnManifoldPage = (): ReactNode => {
  const isBroadOnManifoldUser = useIsBroadOnManifoldUser();
  if (!isBroadOnManifoldUser) {
    return <NotFound />;
  }

  return (
    <BroadOnManifoldLayout>
      <div style={{ maxWidth: 640 }}>
        <img src={broadLogo} alt='Broad Institute' style={{ height: 56, display: 'block', marginBottom: '2rem' }} />
        <h1 style={{ fontSize: 32, margin: '0 0 1rem' }}>Broad on Manifold</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 0.75rem' }}>
          Manifold is an agent-first experience for exploring and analyzing biomedical data on AWS, and it&apos;s now
          available to the Broad Institute community.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.6, margin: '0 0 2rem' }}>
          Sign in with your Broad Institute email to open your projects or start a new one. You&apos;ll need a Broad
          cost object to cover project billing, so request one first if you don&apos;t have one.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <ButtonPrimary
            href={getBroadOnManifoldSignInUrl()}
            onClick={() => void Metrics().captureEvent(Events.broadOnManifoldSignIn, { source: 'handoffPage' })}
            style={buttonStyle}
          >
            Sign in to Broad on Manifold
          </ButtonPrimary>
          <ButtonOutline
            href={broadCostObjectRequestUrl}
            {...Utils.newTabLinkProps}
            onClick={() =>
              void Metrics().captureEvent(Events.broadOnManifoldRequestCostObject, { source: 'handoffPage' })
            }
            style={buttonStyle}
          >
            Request a cost object
          </ButtonOutline>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: '2rem' }}>
          Not sure whether to use Terra or Manifold?{' '}
          <Link
            href={Nav.getLink('broad-on-manifold-choosing-a-platform')}
            onClick={() => void Metrics().captureEvent(Events.broadOnManifoldHelpMeChoose, { source: 'handoffPage' })}
          >
            Compare them
          </Link>
          .
        </p>
      </div>
    </BroadOnManifoldLayout>
  );
};

export const navPaths = [
  {
    name: 'broad-on-manifold',
    path: '/broad-on-manifold',
    component: BroadOnManifoldPage,
    title: 'Broad on Manifold',
  },
];
