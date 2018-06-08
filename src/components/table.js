import _ from 'lodash/fp'
import RCTable from 'rc-table'
import { Fragment, createRef } from 'react'
import { button, div, h, option, select, table, td, th, tr } from 'react-hyperscript-helpers'
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

export const slice = (dataSource, { pageNumber, itemsPerPage }) => {
  return dataSource.slice((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage)
}

const defaultComponents = {
  header: {
    row: ({ children, ...props }) => tr(_.merge({
      style: {
        border: '1px solid #CCCCCC',
        backgroundColor: '#FAFAFA'
      }
    }, props), children),
    cell: ({ children, ...props }) => th({
      style: {
        padding: '14px 0',
        fontWeight: 500
      }
    }, [
      div(_.merge({
        style: {
          padding: '0 18px',
          marginRight: -1,
          borderRight: '1px solid #CCCCCC'
        }
      }, props), children)
    ])
  },
  body: {
    row: ({ children, ...props }) => h(Interactive, _.merge({
      as: 'tr',
      style: {
        backgroundColor: 'white',
        border: '1px solid #CCCCCC',
        cursor: null
      },
      hover: { backgroundColor: Style.colors.highlightFaded }
    }, props), children),
    cell: ({ children, ...props }) => td(_.merge({
      style: {
        padding: '16.25px 19px 12.75px',
        overflow: 'hidden'
      }
    }, props), children)
  }
}

export const components = {
  scrollWithHeaderTable: ({
    table: ({ children, ...props }) => table(_.merge({
      style: {
        tableLayout: 'fixed',
        width: '100%'
      }
    }, props), children),
    body: {
      cell: ({ children, ...props }) => td(_.merge({
        style: {
          padding: '16.25px 19px 12.75px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }
      }, props), children)
    }
  }),
  nonInteractiveRow: ({
    body: {
      row: ({ children, ...props }) => tr(_.merge({
        style: {
          backgroundColor: 'white',
          border: '1px solid #CCCCCC'
        }
      }, props), children)
    }
  })
}

/**
 * @param {bool} [allowPagination=true]
 * @param {bool} [allowItemsPerPage=true]
 * @param {number} [defaultItemsPerPage=25]
 * @param {number[]} [itemsPerPageOptions=[10, 25, 50, 100]]
 * @param {function(number)} [onItemsPerPageChanged]
 * @param {number} [initialPage=1]
 * @param {function(number)} [onPageChanged]
 * @param {object[]} dataSource
 * @param {object} tableProps - see {@link https://github.com/react-component/table}, don't provide data
 */
export class DataTable extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pageNumber: props.initialPage || 1,
      itemsPerPage: props.defaultItemsPerPage || 25
    }
  }

  render() {
    const {
      allowPagination = true, allowItemsPerPage = true, itemsPerPageOptions = [10, 25, 50, 100],
      onItemsPerPageChanged, onPageChanged, dataSource, tableProps, customComponents,
      totalRowCount
    } = this.props
    const { pageNumber, itemsPerPage } = this.state

    return h(Fragment, [
      h(RCTable, _.merge({
        data: allowPagination && !totalRowCount ? slice(dataSource, { pageNumber, itemsPerPage }) : dataSource,
        components: _.isArray(customComponents) ?
          _.mergeAll([defaultComponents, ...customComponents]) :
          _.merge(defaultComponents, customComponents)
      }, tableProps)),
      allowPagination ?
        div({ style: { marginTop: 10 } }, [
          paginator({
            filteredDataLength: totalRowCount || dataSource.length,
            setPageNumber: (n => {
              this.setState({ pageNumber: n })
              if (onPageChanged) onPageChanged(n)
            }),
            pageNumber,
            setItemsPerPage: allowItemsPerPage && (n => {
              this.setState({ itemsPerPage: n })
              if (onItemsPerPageChanged) onItemsPerPageChanged(n)
            }),
            itemsPerPage, itemsPerPageOptions
          })
        ]) :
        null
    ])
  }
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
