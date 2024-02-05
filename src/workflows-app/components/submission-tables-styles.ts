import { CSSProperties } from 'react';
import { tableHeight } from 'src/components/table';

export const tableContainerStyle: CSSProperties = {
  backgroundColor: 'rgb(235, 236, 238)',
  display: 'flex',
  flex: '1 1 auto',
  flexDirection: 'column',
  padding: '1rem 3rem',
};

export const tableStyle = (numRows: number): CSSProperties => {
  return {
    height: tableHeight({
      actualRows: numRows,
      maxRows: 12.5,
      heightPerRow: 50,
    }),
  };
};
