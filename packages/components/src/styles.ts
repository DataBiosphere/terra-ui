import { CSSProperties } from 'react';

export const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  padding: 0,
  border: '0',
  margin: '-1px',
  clip: 'rect(0, 0, 0, 0)',
};
