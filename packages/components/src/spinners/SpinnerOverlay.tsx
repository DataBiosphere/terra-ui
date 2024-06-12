import React, { CSSProperties, ReactNode } from 'react';

import { CenteredSpinner } from './CenteredSpinner';

interface BaseSpinnerProps {
  outerStyles?: CSSProperties;
  innerStyles?: CSSProperties;
}

const WrappedSpinner = (props: BaseSpinnerProps): ReactNode => {
  const { outerStyles = {}, innerStyles = {} } = props;
  return (
    <div
      data-testid='loading-spinner'
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        zIndex: 9999, // make sure it's on top of any third party components with z-indicies
        ...outerStyles,
      }}
    >
      <CenteredSpinner
        size={64}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          padding: '1rem',
          borderRadius: '0.5rem',
          ...innerStyles,
        }}
      />
    </div>
  );
};

export type SpinnerOverlayMode = 'Default' | 'Absolute' | 'Fixed' | 'Top' | 'Transparent' | 'FullScreen';

export interface SpinnerOverlayProps {
  mode?: SpinnerOverlayMode;
}

export const SpinnerOverlay = (props: SpinnerOverlayProps): ReactNode => {
  const { mode = 'Default' } = props;
  switch (mode) {
    case 'Absolute':
      return <WrappedSpinner innerStyles={{ position: 'absolute' }} />;
    case 'Fixed':
      return <WrappedSpinner innerStyles={{ position: 'fixed' }} />;
    case 'Transparent':
      return <WrappedSpinner innerStyles={{ backgroundColor: 'rgba(255, 255, 255, 0.0)' }} />;
    case 'Top':
      return <WrappedSpinner innerStyles={{ marginTop: 150 }} />;
    case 'FullScreen':
      return <WrappedSpinner outerStyles={{ height: '100vh', width: '100vw', position: 'fixed' }} />;
    case 'Default':
    default:
      return <WrappedSpinner />;
  }
};
