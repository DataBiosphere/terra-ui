import _ from 'lodash'
import RCTable from 'rc-table'
import { Fragment } from 'react'
import { div, h, option, select } from 'react-hyperscript-helpers'
import { Component } from 'src/libs/wrapped-components'


/**
 * @callback handleNewVal
 * @param newValue
 */

/**
 * @param {number} props.filteredDataLength
 * @param {number} props.pageNumber
 * @param {handleNewVal} props.setPageNumber
 * @param {handleNewVal} [props.setItemsPerPage]
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
      onChange: (e) => setPageNumber(e.target.value),
      value: pageNumber
    },
    _.map(_.range(1, filteredDataLength / itemsPerPage + 1),
      (i) => option({ value: i }, i))),
    setItemsPerPage ?
      h(Fragment, [
        'Items per page: ',
        select({
          onChange: (e) => setItemsPerPage(e.target.value),
          value: itemsPerPage
        },
        _.map(itemsPerPageOptions,
          (i) => option({ value: i }, i)))
      ]) :
      null
  ])
}

/**
 * @param {bool} [allowPagination=true]
 * @param {bool} [allowItemsPerPage=true]
 * @param {number} [defaultItemsPerPage=25]
 * @param {number[]} [itemsPerPageOptions=[10, 25, 50, 100]]
 * @param {handleNewVal} [onItemsPerPageChanged]
 * @param {number} [initialPage=1]
 * @param {handleNewVal} [onPageChanged]
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
            setPageNumber: ((n) => {
              this.setState({ pageNumber: n })
              if (onPageChanged) onPageChanged(n)
            }),
            pageNumber,
            setItemsPerPage: allowItemsPerPage ? ((n) => {
              this.setState({ itemsPerPage: n })
              if (onItemsPerPageChanged) onItemsPerPageChanged(n)
            }) : null,
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
 * @param {handleNewVal} [onItemsPerPageChanged]
 * @param {number} [initialPage=1]
 * @param {handleNewVal} [onPageChanged]
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
        _.map(listPage, (record) => renderCard(record, cardsPerRow))),
      allowPagination ?
        div({ style: { marginTop: 10 } }, [
          paginator({
            filteredDataLength: dataSource.length,
            setPageNumber: ((n) => {
              this.setState({ pageNumber: n })
              if (onPageChanged) onPageChanged(n)
            }),
            pageNumber,
            setItemsPerPage: allowItemsPerPage ? ((n) => {
              this.setState({ itemsPerPage: n })
              if (onItemsPerPageChanged) onItemsPerPageChanged(n)
            }) : null,
            itemsPerPage, itemsPerPageOptions
          })
        ]) :
        null
    ])
  }
}
