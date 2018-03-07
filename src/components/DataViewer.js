import update from 'immutability-helper'
import { default as RCTable } from 'rc-table'
import { Component, Fragment } from 'react'
import { button, div, h, input, option, select } from 'react-hyperscript-helpers'
import _ from 'underscore'

/*
* general props
* =============
* allowFilter:          true
* filterFunction:       required when filtering is allowed, takes record and filterString args
* allowPagination:      true
* allowItemsPerPage:    true
* defaultItemsPerPage:  25
* topBarItems:          null
* dataSource:           required
* defaultViewMode:      'list' // or 'card'
* allowViewToggle:      false
*
* list view
* =========
* tableProps:           required when list view is allowed, see {@link https://github.com/react-component/table}
*
* card view
* =========
* renderCard:           required when card view is allowed, takes record and cardsPerRow args
* defaultCardsPerRow:   5
* */
class DataViewer extends Component {
  constructor(props) {
    super(props)
    this.state = {
      pageIndex: 1,
      itemsPerPage: props.defaultItemsPerPage || 25,
      filter: '',
      listView: props.defaultViewMode ? props.defaultViewMode === 'list' : true,
      cardsPerRow: props.defaultCardsPerRow || 5
    }
  }

  render() {
    const {
      allowFilter = true, filterFunction,
      allowViewToggle = false, topBarItems = null,
      allowPagination = true, allowItemsPerPage = true,
      dataSource, tableProps, renderCard
    } = this.props

    const { pageIndex, itemsPerPage, filter, listView, cardsPerRow } = this.state

    const filteredData = allowFilter ?
      dataSource.filter(record => filterFunction(record, this.state.filter)) :
      dataSource
    const listPage = allowPagination ?
      filteredData.slice((this.state.pageIndex - 1) * this.state.itemsPerPage,
        this.state.pageIndex * this.state.itemsPerPage) :
      filteredData

    const renderCards = () => {
      return h(Fragment,
        [
          button(
            {
              onClick: () => this.setState(
                prev => (update(prev, { cardsPerRow: { $apply: n => _.max([n - 1, 1]) } })))
            },
            '+'),
          button(
            {
              onClick: () => this.setState(
                prev => (update(prev, { cardsPerRow: { $apply: n => n + 1 } })))
            },
            '-'),
          div({ style: { display: 'flex', flexWrap: 'wrap' } },
            _.map(listPage, (record) => renderCard(record, cardsPerRow))
          )
        ]
      )
    }

    return h(Fragment, [
      allowFilter ?
        input({
          placeholder: 'Filter',
          onChange: e => this.setState({ filter: e.target.value }),
          value: filter
        }) :
        null,
      allowViewToggle ?
        button({ onClick: () => this.setState(prev => (update(prev, { $toggle: ['listView'] }))) },
          'Toggle display mode') :
        null,
      topBarItems,
      listView ?
        h(RCTable, update(tableProps, { data: { $set: listPage } })) :
        renderCards(),
      allowPagination || allowItemsPerPage ?
        div({ style: { marginTop: 10 } }, [
          allowPagination ?
            h(Fragment, [
              'Page: ',
              select({
                  style: { marginRight: '1rem' },
                  onChange: e => this.setState({ pageIndex: e.target.value }),
                  value: pageIndex
                },
                _.map(_.range(1, filteredData.length / itemsPerPage + 1),
                  i => option({ value: i }, i)))
            ]) :
            null,
          allowItemsPerPage ?
            h(Fragment, [
              'Items per page: ',
              select({
                  onChange: e => this.setState({ itemsPerPage: e.target.value }),
                  value: itemsPerPage
                },
                _.map([10, 25, 50, 100],
                  i => option({ value: i }, i)))
            ]) :
            null
        ]) :
        null
    ])
  }

}

export default props => h(DataViewer, props)
