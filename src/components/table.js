import RCTable from 'rc-table'
import { Component, Fragment } from 'react'
import { div, h, option, select } from 'react-hyperscript-helpers'
import _ from 'underscore'

/*
* props
* =====
* filteredDataLength:       required
* pageNumber:               required
* setPageNumber:            required - function(newpageNumber)
* setItemsPerPage:          hides selector if absent - function(newItemsPerPage)
* itemsPerPage:             required
* itemsPerPageOptions:      required
*/
const paginator = function({
                             filteredDataLength, pageNumber, setPageNumber, setItemsPerPage,
                             itemsPerPage, itemsPerPageOptions
                           }) {
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

/*
* props
* =====
* allowPagination:        true
* allowItemsPerPage:      true
* defaultItemsPerPage:    25
* itemsPerPageOptions:    [10, 25, 50, 100]
* onItemsPerPageChanged:  function(newItemsPerPage)
* initialPage:            1
* onPageChanged:          function(newPageNumber)
* dataSource:             required
* tableProps:             required, see {@link https://github.com/react-component/table}
* */
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
      onItemsPerPageChanged = () => {}, onPageChanged = () => {}, dataSource, tableProps
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
              onPageChanged(n)
            }),
            pageNumber,
            setItemsPerPage: allowItemsPerPage ? (n => {
              this.setState({ itemsPerPage: n })
              onItemsPerPageChanged(n)
            }) : null,
            itemsPerPage, itemsPerPageOptions
          })
        ]) :
        null
    ])

  }
}

/*
* props
* =====
* allowPagination:        true
* allowItemsPerPage:      true
* defaultItemsPerPage:    12
* itemsPerPageOptions:    [12, 24, 36, 48]
* onItemsPerPageChanged:  function(newItemsPerPage)
* initialPage:            1
* onPageChanged:          function(newPageNumber)
* dataSource:             required
* renderCard:             required - function(record, cardsPerRow) => renderable
* cardsPerRow:            3
* */
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
      onItemsPerPageChanged = () => {}, onPageChanged = () => {}, dataSource, renderCard, cardsPerRow = 3
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
              onPageChanged(n)
            }),
            pageNumber,
            setItemsPerPage: allowItemsPerPage ? (n => {
              this.setState({ itemsPerPage: n })
              onItemsPerPageChanged(n)
            }) : null,
            itemsPerPage, itemsPerPageOptions
          })
        ]) :
        null
    ])

  }
}

export { DataTable, DataGrid }
