import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { buttonPrimary, link, search } from 'src/components/common'
import { spinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { ScrollWithHeader } from 'src/components/ScrollWithHeader'
import { components, DataTable, paginator, slice } from 'src/components/table'
import { Rawls } from 'src/libs/ajax'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


export default class LaunchAnalysisModal extends Component {
  constructor(props) {
    super(props)

    this.state = { filterText: '', pageNumber: 1, itemsPerPage: 25 }
  }

  render() {
    const { onDismiss } = this.props
    const { attributeNames, entities, attributeFailure, entityFailure, filterText, launching } = this.state

    return h(Modal, {
      onDismiss,
      title: 'Launch Analysis',
      titleExtras: [
        search({
          wrapperProps: {
            style: {
              display: 'inline-flex',
              width: 500,
              marginLeft: '4rem'
            }
          },
          inputProps: {
            placeholder: 'FILTER',
            value: filterText,
            onChange: e => this.setState({ filterText: e.target.value, pageNumber: 1 })
          }
        })
      ],
      showX: true,
      width: 'calc(100% - 2rem)',
      okButton: buttonPrimary({
        onClick: () => this.launch(),
        disabled: launching
      }, [launching ? 'Launching...' : 'Launch'])
    }, [
      Utils.cond(
        [attributeNames && entities, () => this.renderMain()],
        [attributeFailure || entityFailure, () => this.renderError()],
        () => spinner()
      )
    ])
  }

  componentDidMount() {
    const { workspaceId: { namespace, name }, config: { rootEntityType } } = this.props

    Rawls.workspace(namespace, name).entities().then(
      entities => {
        const { attributeNames, idName } = entities[rootEntityType]
        this.setState({ attributeNames, idName })
      },
      attributeFailure => this.setState({ attributeFailure })
    )

    Rawls.workspace(namespace, name).entity(rootEntityType).then(
      entities => this.setState({ entities }),
      entityFailure => this.setState({ entityFailure })
    )
  }

  renderMain = () => {
    const { itemsPerPage, pageNumber, entities, filterText, launchError } = this.state
    const filteredEntities = _.filter(entity => entity.name.includes(filterText), entities)

    return h(Fragment, [
      div({ style: { overflowX: 'auto', margin: '0 -1.25rem', padding: '0 1.25rem' } }, [
        div({ style: { display: 'table', marginBottom: '0.5rem' } }, [
          h(ScrollWithHeader, {
            header: this.renderTableHeader(),
            negativeMargin: '1.25rem',
            children: [this.renderTableBody(filteredEntities)]
          })
        ])
      ]),
      div({ style: { marginTop: 10 } }, [
        paginator({
          filteredDataLength: filteredEntities.length,
          setPageNumber: pageNumber => this.setState({ pageNumber }),
          pageNumber,
          setItemsPerPage: itemsPerPage => this.setState({ itemsPerPage }),
          itemsPerPage
        })
      ]),
      div({ style: { marginTop: 10, textAlign: 'right', color: Style.colors.error } }, [launchError])
    ])
  }

  renderError = () => {
    const { attributeFailure, entityFailure } = this.state

    return div({}, [
      div({}, 'Unable to load data entities'),
      attributeFailure && div({}, attributeFailure),
      entityFailure && div({}, entityFailure)
    ])
  }

  renderTableHeader = () => {
    const { attributeNames, idName } = this.state

    const cellStyle = {
      overflow: 'hidden', textOverflow: 'ellipsis',
      fontWeight: 500, fontSize: 12, padding: '0.5rem 19px'
    }

    /*
     * FIXME: width: 0 solves an issue where this header sometimes takes more room than
     * it needs and messes up the layout of the entire table. Related to the display: table
     * that's used to make style apply beyond the viewport of a scrolling component
     */
    return div({ style: { display: 'flex', width: 0 } }, [
      div({
        style: {
          ...cellStyle,
          flex: '0 0 150px'
        }
      }, idName),
      attributeNames.map(name => {
        return div({
          key: name,
          title: name,
          style: {
            ...cellStyle,
            flex: '0 0 100px',
            borderLeft: Style.standardLine
          }
        },
        name)
      })
    ])
  }

  renderTableBody = filteredEntities => {
    const { attributeNames, pageNumber, itemsPerPage, selectedEntity } = this.state

    return h(DataTable, {
      dataSource: slice(filteredEntities, { pageNumber, itemsPerPage }),
      customComponents: [components.scrollWithHeaderTable, components.nonInteractiveRow],
      allowPagination: false,
      tableProps: {
        showHeader: false,
        scroll: { y: 500 },
        rowKey: 'name',
        onRow: entity => ({ style: { backgroundColor: selectedEntity === entity.name && Style.colors.highlightFaded } }),
        columns: [
          {
            key: 'id', width: 150,
            render: entity => link({ onClick: () => this.setState({ selectedEntity: entity.name }) }, [entity.name])
          },
          ...attributeNames.map(attributeName => ({
            title: attributeName,
            key: attributeName,
            width: 100,
            render: entity => entity.attributes[attributeName]
          }))
        ]
      }
    })
  }

  launch = () => {
    const {
      workspaceId: { namespace, name },
      config: { namespace: configNamespace, name: configName, rootEntityType },
      onSuccess
    } = this.props

    const { selectedEntity } = this.state

    this.setState({ launching: true })

    Rawls.workspace(namespace, name).methodConfig(configNamespace, configName).launch({
      entityType: selectedEntity && rootEntityType,
      entityName: selectedEntity,
      useCallCache: true
    }).then(
      submission => onSuccess(submission),
      error => this.setState({ launchError: JSON.parse(error).message, launching: false })
    )
  }
}
