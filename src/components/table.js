import _ from 'lodash'
import RCTable from 'rc-table'
import { Fragment } from 'react'
import { button, div, h, option, select } from 'react-hyperscript-helpers'
import Pagination from 'react-paginating'
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
const paginator = function(props) {
  const {
    filteredDataLength, pageNumber, setPageNumber, setItemsPerPage,
    itemsPerPage, itemsPerPageOptions
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

            h(Fragment, _.map(pages, num => paginatorButton(
              _.merge({
                disabled: currentPage === num, style: {
                  width: '2rem',
                  backgroundColor: currentPage === num ? Style.colors.primary : undefined,
                  color: currentPage === num ? 'white' : Style.colors.primary,
                  border: currentPage === num ? Style.colors.primary : undefined
                }
              },
              getPageItemProps({ pageValue: num, onPageChange: setPageNumber })),
              num))),

            paginatorButton(
              _.merge({ disabled: !hasNextPage, style: { marginLeft: '1rem' } },
                getPageItemProps({ pageValue: nextPage, onPageChange: setPageNumber })),
              [icon('angle right', { size: 12 })]),

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
            _.map(itemsPerPageOptions,
              i => option({ value: i }, i)))
          ])
        ])
      ]
    )
  ])


  /*
   * return h(Fragment, [
   *   'Page: ',
   *   select({
   *     style: { marginRight: '1rem' },
   *     onChange: e => setPageNumber(e.target.value),
   *     value: pageNumber
   *   },
   *   _.map(_.range(1, filteredDataLength / itemsPerPage + 1),
   *     i => option({ value: i }, i))),
   *   setItemsPerPage ?
   *     h(Fragment, [
   *       'Items per page: ',
   *       select({
   *         onChange: e => setItemsPerPage(e.target.value),
   *         value: itemsPerPage
   *       },
   *       _.map(itemsPerPageOptions,
   *         i => option({ value: i }, i)))
   *     ]) :
   *     null
   * ])
   */
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
      onItemsPerPageChanged, onPageChanged, dataSource, tableProps
    } = this.props
    const { pageNumber, itemsPerPage } = this.state

    const listPage = dataSource.slice((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage)

    return h(Fragment, [
      h(RCTable, _.extend({ data: listPage }, tableProps)),
      allowPagination ?
        div({ style: { marginTop: 10 } }, [
          paginator({
            filteredDataLength: dataSource.length,
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
 * @param {number} [defaultItemsPerPage=12]
 * @param {number[]} [itemsPerPageOptions=[12, 24, 36, 48]]
 * @param {function(number)} [onItemsPerPageChanged]
 * @param {number} [initialPage=1]
 * @param {function(number)} [onPageChanged]
 * @param {object[]} dataSource
 * @param {function} renderCard - function(record, cardsPerRow) => renderable
 * @param {number} [cardsPerRow=3]
 */
export class DataGrid extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pageNumber: props.initialPage || 1,
      itemsPerPage: props.defaultItemsPerPage || 12
    }
  }

  render() {
    const {
      allowPagination = true, allowItemsPerPage = true, itemsPerPageOptions = [12, 24, 36, 48],
      onItemsPerPageChanged, onPageChanged, dataSource, renderCard, cardsPerRow = 3
    } = this.props
    const { pageNumber, itemsPerPage } = this.state

    const listPage = dataSource.slice((pageNumber - 1) * itemsPerPage, pageNumber * itemsPerPage)

    return h(Fragment, [
      div({ style: { display: 'flex', flexWrap: 'wrap' } },
        _.map(listPage, record => renderCard(record, cardsPerRow))),
      allowPagination ?
        div({ style: { marginTop: 10 } }, [
          paginator({
            filteredDataLength: dataSource.length,
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
