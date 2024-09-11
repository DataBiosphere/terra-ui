import React, { ReactNode } from 'react';
import { Sort } from 'src/components/group-common';
import { ariaSort, HeaderRenderer } from 'src/components/table';
import { columnWidths } from 'src/groups/GroupCard';

interface GroupCardHeadersProps {
  sort: Sort;
  onSort: React.Dispatch<React.SetStateAction<Sort>>;
}

export const GroupCardHeaders = (props: GroupCardHeadersProps): ReactNode => {
  const { sort, onSort } = props;
  return (
    <div
      role='row'
      style={{
        display: 'grid',
        gridTemplateColumns: columnWidths,
        justifyContent: 'space-between',
        marginTop: '1.5rem',
        padding: '0 1rem',
      }}
    >
      <div role='columnheader' aria-sort={ariaSort(sort, 'groupName')} style={{ marginRight: '1rem' }}>
        <HeaderRenderer sort={sort} onSort={onSort} name='groupName' />
      </div>
      <div role='columnheader' aria-sort={ariaSort(sort, 'groupEmail')}>
        <HeaderRenderer sort={sort} onSort={onSort} name='groupEmail' />
      </div>
      <div role='columnheader' aria-sort={ariaSort(sort, 'role')}>
        {/* This behaves strangely due to the fact that role is an array. If you have multiple roles it can do strange things. */}
        <HeaderRenderer sort={sort} onSort={onSort} name='role' />
      </div>
      <div role='columnheader'>
        <div className='sr-only'>Actions</div>
      </div>
    </div>
  );
};
