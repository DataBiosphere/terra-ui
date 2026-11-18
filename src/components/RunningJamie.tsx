import React, { ReactNode, useId } from 'react';

export interface RunningJamieProps {
  /** Height in px; Jamie is 4:3, so a third wider than tall. */
  size?: number;
}

const leg = (x: number, y: number, pair: 'front' | 'back') => (
  <line className={`running-jamie-legs-${pair}`} x1={x} y1={y} x2={x} y2={20.5} strokeWidth={2} />
);

/**
 * Jamie, Cromwell's pig, bounding along with a nacelle strapped on: an in-progress indicator for workflow operations.
 * Drawn in currentColor like other icons; the eye, nostrils, harness strap, and a gap around the nacelle are
 * cut out with a mask. Animations are defined in style.css (.running-jamie). Decorative; the surrounding control
 * should describe the busy state.
 */
export const RunningJamie = ({ size = 16 }: RunningJamieProps): ReactNode => {
  // Each instance needs its own mask id, since several rows can be downloading at once
  // (React's ids contain colons, which aren't safe in url(#...) references)
  const maskId = `running-jamie-cutouts-${useId().replace(/:/g, '')}`;

  return (
    <svg
      className='running-jamie'
      data-icon='running-jamie'
      aria-hidden
      viewBox='0 0 32 24'
      width={(size * 4) / 3}
      height={size}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <mask id={maskId} maskUnits='userSpaceOnUse' x={-2} y={-2} width={36} height={28}>
          <rect x={-2} y={-2} width={36} height={28} fill='white' />
          {/* Gap around the nacelle, the harness strap, the eye, and the snout's rim and nostrils */}
          <rect x={4} y={5} width={12.5} height={3} rx={1.5} fill='black' stroke='black' strokeWidth={2.2} />
          <circle cx={15.6} cy={6.5} r={1.5} fill='black' stroke='black' strokeWidth={2} />
          <path d='M12.5 9.6 15.2 13.6' stroke='black' strokeWidth={1} />
          <circle cx={24.2} cy={8.4} r={0.95} fill='black' />
          <ellipse cx={27.4} cy={10.5} rx={1.8} ry={1.7} fill='none' stroke='black' strokeWidth={0.7} />
          <circle cx={27} cy={10.5} r={0.4} fill='black' />
          <circle cx={27.9} cy={10.5} r={0.4} fill='black' />
        </mask>
      </defs>
      <g className='running-jamie-body' fill='currentColor' stroke='currentColor' strokeLinecap='round'>
        <g mask={`url(#${maskId})`}>
          {/* Far legs, behind the body */}
          {leg(11, 15, 'back')}
          {leg(19.5, 15, 'front')}
          <ellipse cx={15} cy={12.5} rx={7.8} ry={5.2} stroke='none' />
          <path d='M20.6 5.9 21.5 3.6 23.7 5.6z' strokeWidth={0.6} strokeLinejoin='round' />
          <circle cx={23} cy={9.6} r={4.5} stroke='none' />
          <ellipse cx={27.4} cy={10.5} rx={1.8} ry={1.7} stroke='none' />
        </g>
        <path d='M7.4 13c-2.3.3-3.3-1.8-1.9-2.6 1.2-.6 1.9 1 .7 1.6' fill='none' strokeWidth={1.2} />
        <rect x={4} y={5} width={12.5} height={3} rx={1.5} stroke='none' />
        <circle cx={15.6} cy={6.5} r={1.5} stroke='none' />
        {/* Near legs, in front of the body */}
        {leg(13, 15.5, 'back')}
        {leg(21.5, 15, 'front')}
      </g>
    </svg>
  );
};
