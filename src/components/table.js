import _ from 'lodash/fp'
import { Fragment, createRef } from 'react'
import { button, div, h, option, select } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import Pagination from 'react-paginating'
import { Grid as RVGrid, ScrollSync as RVScrollSync } from 'react-virtualized'
import { icon } from 'src/components/icons'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


const paginatorButton = (props, label) => button(_.merge({
  style: {
    margin: '0 2px', padding: '0.25rem 0.5rem',
    border: '1px solid #ccc', borderRadius: 3,
    color: props.disabled ? Style.colors.disabled : Style.colors.primary,
    cursor: props.disabled ? 'not-allowed' : 'pointer'
  }
}, props), label)

/**
 * @param {number} props.filteredDataLength
 * @param {number} props.pageNumber
 * @param {function(number)} props.setPageNumber
 * @param {function(number)} [props.setItemsPerPage]
 * @param {number} props.itemsPerPage
 * @param {number[]} props.itemsPerPageOptions
 */
export const paginator = function(props) {
  const {
    filteredDataLength, pageNumber, setPageNumber, setItemsPerPage,
    itemsPerPage, itemsPerPageOptions = [10, 25, 50, 100]
  } = props

  return h(Pagination, {
    total: filteredDataLength,
    limit: itemsPerPage,
    pageCount: 5,
    currentPage: pageNumber
  }, [
    ({ pages, currentPage, hasNextPage, hasPreviousPage, previousPage, nextPage, totalPages, getPageItemProps }) => h(Fragment,
      [
        div({ style: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '1rem' } }, [
          `${(pageNumber - 1) * itemsPerPage + 1} - ${_.min([filteredDataLength, pageNumber * itemsPerPage])} of ${filteredDataLength}`,
          div({ style: { display: 'inline-flex', padding: '0.25rem 1rem' } }, [

            paginatorButton(
              _.merge({ disabled: currentPage === 1, style: { marginRight: '0.5rem' } },
                getPageItemProps({ pageValue: 1, onPageChange: setPageNumber })),
              [icon('angle-double left', { size: 12 })]
            ),

            paginatorButton(
              _.merge({ disabled: !hasPreviousPage, style: { marginRight: '1rem' } },
                getPageItemProps({ pageValue: previousPage, onPageChange: setPageNumber })),
              [icon('angle left', { size: 12 })]
            ),

            _.map(num => paginatorButton(
              _.merge({
                key: num,
                style: {
                  minWidth: '2rem',
                  backgroundColor: currentPage === num ? Style.colors.primary : undefined,
                  color: currentPage === num ? 'white' : Style.colors.primary,
                  border: currentPage === num ? Style.colors.primary : undefined
                }
              },
              getPageItemProps({ pageValue: num, onPageChange: setPageNumber })),
              num), pages
            ),

            paginatorButton(
              _.merge({ disabled: !hasNextPage, style: { marginLeft: '1rem' } },
                getPageItemProps({ pageValue: nextPage, onPageChange: setPageNumber })),
              [icon('angle right', { size: 12 })]
            ),

            paginatorButton(
              _.merge({ disabled: currentPage === totalPages, style: { marginLeft: '0.5rem' } },
                getPageItemProps({ pageValue: totalPages, onPageChange: setPageNumber })),
              [icon('angle-double right', { size: 12 })]
            )
          ]),

          setItemsPerPage && h(Fragment, [
            'Items per page:',
            select({
              style: { marginLeft: '0.5rem' },
              onChange: e => setItemsPerPage(parseInt(e.target.value, 10)),
              value: itemsPerPage
            },
            _.map(i => option({ value: i }, i),
              itemsPerPageOptions))
          ])
        ])
      ]
    )
  ])
}

/**
 * @param {bool} [allowPagination=true]
 * @param {bool} [allowItemsPerPage=true]
 * @param {number[]} [itemsPerPageOptions=[12, 24, 36, 48]]
 * @param {function(number)} [onItemsPerPageChanged]
 * @param {function(number)} [onPageChanged]
 * @param {object[]} dataSource
 * @param {function} renderCard - function(record, cardsPerRow) => renderable
 * @param {number} [cardsPerRow=3]
 * @param {number} pageNumber
 * @param {number} itemsPerPage
 */
export class DataGrid extends Component {
  render() {
    const {
      allowPagination = true, allowItemsPerPage = true, itemsPerPageOptions = [12, 24, 36, 48],
      onItemsPerPageChanged, onPageChanged, dataSource, renderCard, cardsPerRow = 3,
      pageNumber, itemsPerPage
    } = this.props

    const listPage = dataSource.slice((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage)

    return h(Fragment, [
      div({ style: { display: 'flex', flexWrap: 'wrap' } },
        _.map(record => renderCard(record, cardsPerRow), listPage)),
      allowPagination ?
        div({ style: { marginTop: 10 } }, [
          paginator({
            filteredDataLength: dataSource.length,
            setPageNumber: onPageChanged,
            pageNumber,
            setItemsPerPage: allowItemsPerPage && onItemsPerPageChanged,
            itemsPerPage, itemsPerPageOptions
          })
        ]) :
        null
    ])
  }
}

const cellStyles = {
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '1rem',
  paddingRight: '1rem'
}

const styles = {
  cell: (col, total) => ({
    ...cellStyles,
    borderBottom: `1px solid ${Style.colors.border}`,
    borderLeft: col === 0 ? `1px solid ${Style.colors.border}` : undefined,
    borderRight: col === total - 1 ? `1px solid ${Style.colors.border}` : undefined
  }),
  header: (col, total) => ({
    ...cellStyles,
    backgroundColor: Style.colors.sectionHighlight,
    borderTop: `1px solid ${Style.colors.sectionBorder}`,
    borderBottom: `2px solid ${Style.colors.sectionBorder}`,
    borderLeft: col === 0 ? `1px solid ${Style.colors.sectionBorder}` : undefined,
    borderRight: col === total - 1 ? `1px solid ${Style.colors.sectionBorder}` : undefined,
    borderTopLeftRadius: col === 0 ? '5px' : undefined,
    borderTopRightRadius: col === total - 1 ? '5px' : undefined
  }),
  flexCell: ({ basis = 0, grow = 1, shrink = 1, min = 0, max } = {}) => ({
    flexGrow: grow,
    flexShrink: shrink,
    flexBasis: basis,
    minWidth: min,
    maxWidth: max
  })
}

/**
 * A virtual table with a fixed header and flexible column widths. Intended to take up the full
 * available container width, without horizontal scrolling.
 * @param {Object[]} columns
 * @param {Object} [columns[].size]
 * @param {number} [columns[].size.basis=0] - flex-basis in pixels
 * @param {number} [columns[].size.grow=1] - flex-grow
 * @param {number} [columns[].size.shrink=1] - flex-shrink
 * @param {number} [columns[].size.min=0] - min-width in pixels
 * @param {number} [columns[].size.max] - max-width in pixels
 * @param {function()} columns[].headerRenderer
 * @param {function(Object)} columns[].cellRenderer
 */
export class FlexTable extends Component {
  constructor(props) {
    super(props)
    this.state = { scrollbarSize: 0 }
  }

  render() {
    const { width, height, rowCount, columns, hoverHighlight } = this.props
    const { scrollbarSize } = this.state
    return div([
      div({
        style: {
          width: width - scrollbarSize,
          height: 48,
          display: 'flex'
        }
      }, [
        ..._.map(([i, { size, headerRenderer }]) => {
          return div({
            key: i,
            style: { ...styles.flexCell(size), ...styles.header(i * 1, columns.length) }
          }, [headerRenderer()])
        }, _.toPairs(columns))
      ]),
      h(RVGrid, {
        width,
        height: height - 48,
        columnWidth: width - scrollbarSize,
        rowHeight: 48,
        rowCount,
        columnCount: 1,
        onScrollbarPresenceChange: ({ vertical, size }) => {
          this.setState({ scrollbarSize: vertical ? size : 0 })
        },
        cellRenderer: data => {
          return h(Interactive, {
            key: data.key,
            as: 'div',
            style: { ...data.style, backgroundColor: '#ffffff', display: 'flex' },
            hover: hoverHighlight ? { backgroundColor: Style.colors.highlightFaded } : undefined
          }, [
            ..._.map(([i, { size, cellRenderer }]) => {
              return div({
                key: i,
                style: { ...styles.flexCell(size), ...styles.cell(i * 1, columns.length) }
              }, [cellRenderer(data)])
            }, _.toPairs(columns))
          ])
        },
        style: { outline: 'none' }
      })
    ])
  }
}

/**
 * A virtual table with a fixed header and explicit column widths. Intended for displaying large
 * datasets which may require horizontal scrolling.
 * @param {Object[]} columns
 * @param {number} columns[].width - width in pixels
 * @param {function(Object)} columns[].headerRenderer
 * @param {function(Object)} columns[].cellRenderer
 */
export class GridTable extends Component {
  constructor(props) {
    super(props)
    this.state = { scrollbarSize: 0 }
    this.grid = createRef()
  }

  componentDidMount() {
    this.grid.current.measureAllCells()
  }

  render() {
    const { width, height, rowCount, columns, cellStyle } = this.props
    const { scrollbarSize } = this.state
    return h(RVScrollSync, [
      ({ onScroll, scrollLeft }) => {
        return div([
          h(RVGrid, {
            width: width - scrollbarSize,
            height: 48,
            columnWidth: ({ index }) => columns[index].width,
            rowHeight: 48,
            rowCount: 1,
            columnCount: columns.length,
            cellRenderer: data => {
              return div({
                key: data.key,
                style: { ...data.style, ...styles.header(data.columnIndex, columns.length) }
              }, [
                columns[data.columnIndex].headerRenderer(data)
              ])
            },
            style: { outline: 'none', overflowX: 'hidden', overflowY: 'hidden' },
            scrollLeft,
            onScroll
          }),
          h(RVGrid, {
            ref: this.grid,
            width,
            height: height - 48,
            columnWidth: ({ index }) => columns[index].width,
            rowHeight: 48,
            rowCount,
            columnCount: columns.length,
            onScrollbarPresenceChange: ({ vertical, size }) => {
              this.setState({ scrollbarSize: vertical ? size : 0 })
            },
            cellRenderer: data => {
              return div({
                key: data.key,
                style: {
                  ...data.style,
                  ...styles.cell(data.columnIndex, columns.length),
                  backgroundColor: '#ffffff',
                  ...(cellStyle ? cellStyle(data) : {})
                }
              }, [
                columns[data.columnIndex].cellRenderer(data)
              ])
            },
            style: { outline: 'none' },
            scrollLeft,
            onScroll
          })
        ])
      }
    ])
  }
}

export const TextCell = props => {
  return div(_.merge({
    style: { overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }
  }, props))
}
