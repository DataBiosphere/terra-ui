import _ from 'lodash'
import RCTable from 'rc-table'
import { Component, Fragment } from 'react'
import { div, h, option, select } from 'react-hyperscript-helpers'


/**
 * @callback handleNew
 * @param newValue
 */

/**
 * @param {number} props.filteredDataLength
 * @param {number} props.pageNumber
 * @param {function} props.setPageNumber - function(newpageNumber)
 * @param {function} [props.setItemsPerPage] - hides selector if absent: function(newItemsPerPage)
 * @param {number} props.itemsPerPage
 * @param {number[]} props.itemsPerPageOptions
 */
const paginator = function(props) {
  const {
    filteredDataLength, pageNumber, setPageNumber, setItemsPerPage,
    itemsPerPage, itemsPerPageOptions
  } = props

  return h(Fragment, [
    'Page: ',
    select({
        style: { marginRight: '1rem' },
        onChange: e => setPageNumber(e.target.value),
        value: pageNumber
      },
      _.map(_.range(1, filteredDataLength / itemsPerPage + 1),
        i => option({ value: i }, i))),
    setItemsPerPage ?
      h(Fragment, [
        'Items per page: ',
        select({
            onChange: e => setItemsPerPage(e.target.value),
            value: itemsPerPage
          },
          _.map(itemsPerPageOptions,
            i => option({ value: i }, i)))
      ]) :
      null
  ])
}

/**
 * @param {bool} [props.allowPagination=true]
 * @param {bool} [props.allowItemsPerPage=true]
 * @param {number} [props.defaultItemsPerPage=25]
 * @param {number[]} [props.itemsPerPageOptions=[10, 25, 50, 100]]
 * @param {handleNew} [props.onItemsPerPageChanged]
 * @param {number} [props.initialPage=1]
 * @param {handleNew} [props.onPageChanged] - function(newPageNumber)
 * @param {object[]} props.dataSource
 * @param {object} props.tableProps - see {@link https://github.com/react-component/table}, don't provide data
 */
const DataTable = (props) => h(DataTableConstructor, props)

class DataTableConstructor extends Component {
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
              _.attempt(onPageChanged, n)
            }),
            pageNumber,
            setItemsPerPage: allowItemsPerPage ? (n => {
              this.setState({ itemsPerPage: n })
              _.attempt(onItemsPerPageChanged, n)
            }) : null,
            itemsPerPage, itemsPerPageOptions
          })
        ]) :
        null
    ])

  }
}

/**
 * @param {bool} [props.allowPagination=true]
 * @param {bool} [props.allowItemsPerPage=true]
 * @param {number} [props.defaultItemsPerPage=25]
 * @param {number[]} [props.itemsPerPageOptions=[10, 25, 50, 100]]
 * @param {handleNew} [props.onItemsPerPageChanged]
 * @param {number} [props.initialPage=1]
 * @param {handleNew} [props.onPageChanged] - function(newPageNumber)
 * @param {object[]} props.dataSource
 * @param {function} props.renderCard - function(record, cardsPerRow) => renderable
 * @param {number} [props.cardsPerRow=3}
 */
const DataGrid = (props) => h(DataGridConstructor, props)

class DataGridConstructor extends Component {
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
        _.map(listPage, (record) => renderCard(record, cardsPerRow))),
      allowPagination ?
        div({ style: { marginTop: 10 } }, [
          paginator({
            filteredDataLength: dataSource.length,
            setPageNumber: (n => {
              this.setState({ pageNumber: n })
              _.attempt(onPageChanged, n)
            }),
            pageNumber,
            setItemsPerPage: allowItemsPerPage ? (n => {
              this.setState({ itemsPerPage: n })
              _.attempt(onItemsPerPageChanged, n)
            }) : null,
            itemsPerPage, itemsPerPageOptions
          })
        ]) :
        null
    ])

  }
}

export { DataTable, DataGrid }
