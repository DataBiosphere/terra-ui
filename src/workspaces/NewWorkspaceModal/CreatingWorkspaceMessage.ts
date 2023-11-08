import { ReactNode } from 'react';
import { div, h, p } from 'react-hyperscript-helpers';
import { TerraHexagonsAnimation } from 'src/branding/TerraHexagonsAnimation';

export const CreatingWorkspaceMessage = (): ReactNode => {
  return div(
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
    },
    [
      h(TerraHexagonsAnimation, { 'aria-hidden': true, size: 150, style: { margin: '2rem 0' } }, [
        div(
          {
            style: {
              color: '#225C00',
              fontWeight: 'bold',
            },
          },
          ['Loading...']
        ),
      ]),
      div({ role: 'alert', style: { marginBottom: '2rem', textAlign: 'center' } }, [
        p({ style: { fontWeight: 'bold' } }, ['Please stand by...']),
        p(["Creating and provisioning your workspace. Once it's ready, Terra will take you there."]),
        p(['This may take a few minutes.']),
      ]),
    ]
  );
};
