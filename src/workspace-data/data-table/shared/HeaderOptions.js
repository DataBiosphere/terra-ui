import { PopupTrigger } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { Fragment, useRef } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { icon } from 'src/components/icons';
import { ConfirmedSearchInput } from 'src/components/input';
import { MenuButton } from 'src/components/MenuButton';
import { MenuDivider } from 'src/components/PopupTrigger';
import { Sortable } from 'src/components/table';

export const HeaderOptions = ({ sort, field, datatype, onSort, extraActions, renderSearch, searchByColumn, children }) => {
  const popup = useRef();
  const columnMenu = h(
    PopupTrigger,
    {
      ref: popup,
      closeOnClick: true,
      side: 'bottom',
      content: h(Fragment, [
        datatype &&
          h(Fragment, [
            h(MenuButton, { disabled: true }, [
              h(span, { style: { fontWeight: 'bold' } }, ['Column Type:']),
              h(span, { style: { marginLeft: '.25rem' } }, [datatype]),
            ]),
            h(MenuDivider),
          ]),
        h(MenuButton, { onClick: () => onSort({ field, direction: 'asc' }) }, ['Sort Ascending']),
        h(MenuButton, { onClick: () => onSort({ field, direction: 'desc' }) }, ['Sort Descending']),
        renderSearch &&
          h(div, { style: { width: '98%' } }, [
            h(ConfirmedSearchInput, {
              'aria-label': 'Exact match filter',
              placeholder: 'Exact match filter',
              style: { marginLeft: '0.25rem' },
              onChange: (e) => {
                if (e) {
                  searchByColumn(e);
                  popup.current.close();
                }
              },
              onClick: (e) => {
                e.stopPropagation();
              },
            }),
          ]),
        !_.isEmpty(extraActions) &&
          h(Fragment, [
            h(MenuDivider),
            _.map(({ label, disabled, tooltip, onClick }) => h(MenuButton, { key: label, disabled, tooltip, onClick }, [label]), extraActions),
          ]),
      ]),
    },
    [h(Link, { 'aria-label': 'Column menu' }, [icon('cardMenuIcon', { size: 16 })])]
  );

  return h(Fragment, [
    h(
      Sortable,
      {
        sort,
        field,
        onSort,
      },
      [children, div({ style: { marginRight: '0.5rem', marginLeft: 'auto' } })]
    ),
    columnMenu,
  ]);
};
