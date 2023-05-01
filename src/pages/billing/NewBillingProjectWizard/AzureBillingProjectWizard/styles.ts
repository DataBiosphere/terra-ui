import { CSSProperties } from 'react';

export const columnStyle: CSSProperties = { display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' };

export const rowStyle: CSSProperties = { display: 'flex', flexDirection: 'row', justifyContent: 'flex-start' };

export const columnEntryStyle = (includeRightSpacing: boolean): CSSProperties => {
  return { flex: '1 1 30%', marginLeft: 0, marginRight: includeRightSpacing ? '30px' : 0 };
};

// Attempt to match the styling of the error message so there is less shifting.
export const hintStyle = { marginTop: '.5rem', marginLeft: '1rem' };
