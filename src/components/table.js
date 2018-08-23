import _ from 'lodash/fp'
import { Fragment, createRef } from 'react'
import DraggableCore from 'react-draggable'
import { button, div, h, option, select } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import Pagination from 'react-paginating'
import { arrayMove, SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc'
import { AutoSizer, Grid as RVGrid, ScrollSync as RVScrollSync, List } from 'react-virtualized'
import { buttonPrimary, Checkbox, Clickable, linkButton } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


const paginatorButton = (props, label) => button(_.merge({
  style: {
    margin: '0 2px', padding: '0.25rem 0.5rem',
    border: '1px solid #ccc', borderRadius: 3,
    color: props.disabled ? colors.gray[2] : colors.blue[1], backgroundColor: 'white',
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
          div({ style: { display: 'inline-flex', padding: '0 1rem' } }, [

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
                  backgroundColor: currentPage === num ? colors.blue[1] : undefined,
                  color: currentPage === num ? 'white' : colors.blue[1],
                  border: currentPage === num ? colors.blue[1] : undefined
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

const cellStyles = {
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '1rem',
  paddingRight: '1rem'
}

const styles = {
  cell: (col, total) => ({
    ...cellStyles,
    borderBottom: `1px solid ${colors.gray[3]}`,
    borderLeft: col === 0 ? `1px solid ${colors.gray[3]}` : undefined,
    borderRight: col === total - 1 ? `1px solid ${colors.gray[3]}` : undefined
  }),
  header: (col, total) => ({
    ...cellStyles,
    backgroundColor: colors.blue[4],
    borderTop: `1px solid ${colors.blue[1]}`,
    borderBottom: `2px solid ${colors.blue[1]}`,
    borderLeft: col === 0 ? `1px solid ${colors.blue[1]}` : undefined,
    borderRight: col === total - 1 ? `1px solid ${colors.blue[1]}` : undefined,
    borderTopLeftRadius: col === 0 ? '5px' : undefined,
    borderTopRightRadius: col === total - 1 ? '5px' : undefined
  }),
  flexCell: ({ basis = 0, grow = 1, shrink = 1, min = 0, max } = {}) => ({
    flexGrow: grow,
    flexShrink: shrink,
    flexBasis: basis,
    minWidth: min,
    maxWidth: max
  }),
  columnSelector: {
    position: 'absolute', top: 0, right: 0, width: 48, height: 48,
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    color: colors.blue[0], backgroundColor: colors.blue[3],
    border: `1px solid ${colors.blue[1]}`,
    borderRadius: 5
  },
  columnName: {
    paddingLeft: '0.25rem',
    flex: 1, display: 'flex', alignItems: 'center',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
  },
  columnHandle: {
    paddingRight: '0.25rem', cursor: 'move',
    display: 'flex', alignItems: 'center'
  }
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
    this.body = createRef()
  }

  componentDidMount() {
    const { initialY: scrollTop = 0 } = this.props
    this.body.current.scrollToPosition({ scrollTop })
  }

  render() {
    const { width, height, rowCount, rowStyle, columns, hoverHighlight, onScroll = _.identity } = this.props
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
        ref: this.body,
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
            className: 'table-row',
            style: { ...data.style, backgroundColor: 'white', display: 'flex', ...(rowStyle ? rowStyle(data.rowIndex) : {}) },
            hover: hoverHighlight ? { backgroundColor: colors.blue[5] } : undefined
          }, [
            ..._.map(([i, { size, cellRenderer }]) => {
              return div({
                key: i,
                style: { ...styles.flexCell(size), ...styles.cell(i * 1, columns.length) }
              }, [cellRenderer(data)])
            }, _.toPairs(columns))
          ])
        },
        style: { outline: 'none' },
        onScroll: ({ scrollTop }) => onScroll(scrollTop)
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
    this.header = createRef()
    this.body = createRef()
  }

  componentDidMount() {
    this.body.current.measureAllCells()

    const { initialX: scrollLeft = 0, initialY: scrollTop = 0 } = this.props

    Utils.waitOneTick().then(() => this.body.current.scrollToPosition({ scrollLeft, scrollTop })) // waiting to let ScrollSync initialize
  }

  recomputeColumnSizes() {
    this.header.current.recomputeGridSize()
    this.body.current.recomputeGridSize()
    this.body.current.measureAllCells()
  }

  scrollToTop() {
    this.body.current.scrollToPosition({ scrollTop: 0, scrollLeft: 0 })
  }

  render() {
    const { width, height, rowCount, columns, cellStyle, onScroll: customOnScroll = _.identity } = this.props
    const { scrollbarSize } = this.state
    return h(RVScrollSync, [
      ({ onScroll, scrollLeft }) => {
        return div([
          h(RVGrid, {
            ref: this.header,
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
            ref: this.body,
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
                  backgroundColor: 'white',
                  ...(cellStyle ? cellStyle(data) : {})
                }
              }, [
                columns[data.columnIndex].cellRenderer(data)
              ])
            },
            style: { outline: 'none' },
            scrollLeft,
            onScroll: details => {
              onScroll(details)
              const { scrollLeft, scrollTop } = details
              customOnScroll(scrollLeft, scrollTop)
            }
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

export const HeaderCell = props => {
  return h(TextCell, _.merge({ style: { fontWeight: 500 } }, props))
}

export const Sortable = ({ sort, field, onSort, children }) => {
  return div({
    style: { flex: 1, display: 'flex', alignItems: 'center', cursor: 'pointer', width: '100%' },
    onClick: () => onSort(Utils.nextSort(sort, field))
  }, [
    children,
    sort.field === field && div({
      style: { color: colors.blue[0], marginLeft: 'auto' }
    }, [
      icon(sort.direction === 'asc' ? 'arrow down' : 'arrow')
    ])
  ])
}

export class Resizable extends Component {
  render() {
    const { onWidthChange, width, minWidth = 100, children } = this.props
    const { dragAmount, lastX } = this.state

    return div({
      style: { flex: 1, display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }
    }, [
      children,
      h(DraggableCore, {
        axis: 'x',
        onStart: e => this.setState({ dragAmount: 0, lastX: e.clientX }),
        onDrag: e => {
          const deltaX = e.clientX - lastX
          if (deltaX !== 0 && width + dragAmount + deltaX > minWidth) {
            this.setState({ dragAmount: dragAmount + deltaX, lastX: e.clientX })
          }
        },
        onStop: () => {
          this.setState({ dragAmount: undefined })
          onWidthChange(dragAmount)
        },
        position: { x: 0 }
      }, [
        icon('columnGrabber', {
          size: 24,
          style: { position: 'absolute', right: -20, cursor: 'ew-resize' }
        })
      ]),
      !!dragAmount && icon('columnGrabber', {
        size: 24,
        style: { position: 'absolute', right: -20 - dragAmount, zIndex: 1, opacity: '0.5', cursor: 'ew-resize' }
      })
    ])
  }
}

const SortableDiv = SortableElement(props => div(props))
const SortableList = SortableContainer(props => h(List, props))
const SortableHandleDiv = SortableHandle(props => div(props))

/**
 * @param {Object[]} columnSettings - current column list, in order
 * @param {string} columnSettings[].name
 * @param {bool} columnSettings[].visible
 * @param {function(Object[])} onSave - called with modified settings when user saves
 */
export class ColumnSelector extends Component {
  constructor(props) {
    super(props)
    this.state = { open: false, modifiedColumnSettings: undefined }
  }

  toggleVisibility(index) {
    this.setState(_.update(['modifiedColumnSettings', index, 'visible'], b => !b))
  }

  setAll(value) {
    this.setState(_.update(['modifiedColumnSettings'], _.map(_.set('visible', value))))
  }

  sort() {
    this.setState(_.update(['modifiedColumnSettings'], _.sortBy('name')))
  }

  reorder({ oldIndex, newIndex }) {
    const { modifiedColumnSettings } = this.state
    this.setState({ modifiedColumnSettings: arrayMove(modifiedColumnSettings, oldIndex, newIndex) })
  }

  render() {
    const { onSave, columnSettings } = this.props
    const { open, modifiedColumnSettings } = this.state
    return h(Fragment, [
      h(Clickable, {
        style: styles.columnSelector,
        onClick: () => this.setState({ open: true, modifiedColumnSettings: columnSettings })
      }, [icon('cog', { size: 20, className: 'is-solid' })]),
      open && h(Modal, {
        title: 'Select columns',
        onDismiss: () => this.setState({ open: false }),
        okButton: buttonPrimary({
          onClick: () => {
            onSave(modifiedColumnSettings)
            this.setState({ open: false })
          }
        }, ['Done'])
      }, [
        div({ style: { marginBottom: '1rem', display: 'flex' } }, [
          div({ style: { fontWeight: 500 } }, ['Show:']),
          linkButton({ style: { padding: '0 0.5rem' }, onClick: () => this.setAll(true) }, ['all']),
          '|',
          linkButton({ style: { padding: '0 0.5rem' }, onClick: () => this.setAll(false) }, ['none']),
          div({ style: { marginLeft: 'auto', fontWeight: 500 } }, ['Sort:']),
          linkButton({ style: { padding: '0 0.5rem' }, onClick: () => this.sort() }, ['reset'])
        ]),
        h(AutoSizer, { disableHeight: true }, [
          ({ width }) => {
            return h(SortableList, {
              style: { outline: 'none' },
              lockAxis: 'y',
              useDragHandle: true,
              width, height: 400,
              rowCount: modifiedColumnSettings.length,
              rowHeight: 30,
              rowRenderer: ({ index, style, key }) => {
                const { name, visible } = modifiedColumnSettings[index]
                return h(SortableDiv, { key, index, style: { ...style, display: 'flex' } }, [
                  h(SortableHandleDiv, { style: styles.columnHandle }, [
                    icon('bars')
                  ]),
                  div({ style: { display: 'flex', alignItems: 'center' } }, [
                    h(Checkbox, {
                      checked: visible,
                      onChange: () => this.toggleVisibility(index)
                    })
                  ]),
                  h(Clickable, {
                    style: styles.columnName,
                    onClick: () => this.toggleVisibility(index)
                  }, [name])
                ])
              },
              onSortEnd: v => this.reorder(v)
            })
          }
        ])
      ])
    ])
  }
}
