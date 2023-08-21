import { div } from 'react-hyperscript-helpers';
import { centeredSpinner } from 'src/components/icons';

const makeBaseSpinner = ({ outerStyles = {}, innerStyles = {} }) =>
  div(
    {
      'data-testid': 'loading-spinner',
      style: {
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
      },
    },
    [
      centeredSpinner({
        size: 64,
        style: { backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '1rem', borderRadius: '0.5rem', ...innerStyles },
      }),
    ]
  );

const makeInlineSpinner = ({ outerStyles = {}, innerStyles = {} }) =>
  div(
    {
      'data-testid': 'inline-spinner',
      style: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        ...outerStyles,
      },
    },
    [
      centeredSpinner({
        size: 64,
        style: { backgroundColor: 'rgba(255, 255, 255, 0.85)', padding: '1rem', borderRadius: '0.5rem', ...innerStyles },
      }),
    ]
  );

export const spinnerOverlay = makeBaseSpinner({});

export const absoluteSpinnerOverlay = makeBaseSpinner({ innerStyles: { position: 'absolute' } });

export const fixedSpinnerOverlay = makeBaseSpinner({ innerStyles: { position: 'fixed' } });

export const transparentSpinnerOverlay = makeBaseSpinner({ innerStyles: { backgroundColor: 'rgba(255, 255, 255, 0.0)' } });

export const topSpinnerOverlay = makeBaseSpinner({ innerStyles: { marginTop: 150 } });

export const customSpinnerOverlay = (outerStyles = {}, innerStyles = {}) => makeBaseSpinner({ outerStyles, innerStyles });

export const inlineSpinnerWithInnerStyles = (innerStyles) => makeInlineSpinner({ innerStyles });
