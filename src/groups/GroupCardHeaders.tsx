import { div, h } from 'react-hyperscript-helpers';
import { ariaSort, HeaderRenderer } from 'src/components/table';
import { columnWidths } from 'src/groups/List';
import { memoWithName } from 'src/libs/react-utils';

export const GroupCardHeaders = memoWithName('GroupCardHeaders', ({ sort, onSort }) => {
  return div(
    {
      role: 'row',
      style: {
        display: 'grid',
        gridTemplateColumns: columnWidths,
        justifyContent: 'space-between',
        marginTop: '1.5rem',
        padding: '0 1rem',
      },
    },
    [
      div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'groupName'), style: { marginRight: '1rem' } }, [
        h(HeaderRenderer, { sort, onSort, name: 'groupName' }),
      ]),
      div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'groupEmail') }, [
        h(HeaderRenderer, { sort, onSort, name: 'groupEmail' }),
      ]),
      div({ role: 'columnheader', 'aria-sort': ariaSort(sort, 'role') }, [
        // This behaves strangely due to the fact that role is an array. If you have multiple roles it can do strange things.
        h(HeaderRenderer, { sort, onSort, name: 'role' }),
      ]),
      div({ role: 'columnheader' }, [div({ className: 'sr-only' }, ['Actions'])]),
    ]
  );
});
