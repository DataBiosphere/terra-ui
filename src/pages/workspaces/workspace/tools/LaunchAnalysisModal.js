import _ from 'lodash/fp'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { buttonPrimary, link, search } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import Modal from 'src/components/Modal'
import TabBar from 'src/components/TabBar'
import { GridTable, TextCell } from 'src/components/table'
import { Rawls } from 'src/libs/ajax'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


export default class LaunchAnalysisModal extends Component {
  constructor(props) {
    super(props)

    this.state = { filterText: '', entityType: props.config.rootEntityType }
  }

  render() {
    const { onDismiss } = this.props
    const { entityType, entityMetadata, entities, attributeFailure, entityFailure, filterText, launching } = this.state
    const { attributeNames } = entityMetadata ? entityMetadata[entityType] : {}

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
            onChange: e => this.setState({ filterText: e.target.value })
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
        () => centeredSpinner()
      )
    ])
  }

  componentDidMount() {
    const { workspaceId: { namespace, name } } = this.props
    const { entityType } = this.state

    Rawls.workspace(namespace, name).entityMetadata().then(
      entityMetadata => this.setState({ entityMetadata }),
      attributeFailure => this.setState({ attributeFailure })
    )

    this.loadEntitiesOfType(entityType)
  }

  loadEntitiesOfType(type) {
    const { workspaceId: { namespace, name } } = this.props

    Rawls.workspace(namespace, name).entitiesOfType(type).then(
      entities => this.setState({ entities, loadingNew: false }),
      entityFailure => this.setState({ entityFailure })
    )
  }

  renderMain() {
    const { rootEntityType } = this.props.config
    const { entityType, loadingNew, entities, filterText, launchError, entityMetadata, selectedEntity } = this.state
    const { attributeNames, idName } = entityMetadata ? entityMetadata[entityType] : {}
    const filteredEntities = _.filter(_.conformsTo({ name: Utils.textMatch(filterText) }), entities)

    return h(Fragment, [
      !!entityMetadata[`${rootEntityType}_set`] && TabBar({
        tabs: [
          { title: _.capitalize(rootEntityType), key: rootEntityType },
          { title: _.capitalize(rootEntityType) + ' Set', key: `${rootEntityType}_set` }
        ],
        activeTab: entityType,
        onChangeTab: key => {
          this.setState({ entityType: key, loadingNew: true })
          this.loadEntitiesOfType(key)
        },
        style: { margin: '0 -1rem 1rem', padding: '0 1rem' }
      }),
      loadingNew ? centeredSpinner() : h(AutoSizer, { disableHeight: true }, [
        ({ width }) => {
          return h(GridTable, {
            width, height: 300,
            rowCount: filteredEntities.length,
            columns: [
              {
                width: 150,
                headerRenderer: () => h(TextCell, idName),
                cellRenderer: ({ rowIndex }) => {
                  const { name } = filteredEntities[rowIndex]
                  return h(TextCell, [
                    link({ onClick: () => this.setState({ selectedEntity: name }) }, [name])
                  ])
                }
              },
              ..._.map(name => ({
                width: 300,
                headerRenderer: () => h(TextCell, name),
                cellRenderer: ({ rowIndex }) => {
                  return h(TextCell, [
                    Utils.entityAttributeText(filteredEntities[rowIndex].attributes[name])
                  ])
                }
              }), attributeNames)
            ],
            cellStyle: ({ rowIndex }) => {
              return selectedEntity === filteredEntities[rowIndex].name ?
                { backgroundColor: Style.colors.highlightFaded } : {}
            }
          })
        }
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

  launch = () => {
    const {
      workspaceId: { namespace, name },
      config: { namespace: configNamespace, name: configName, rootEntityType },
      onSuccess
    } = this.props

    const { selectedEntity, entityType } = this.state

    this.setState({ launching: true })

    Rawls.workspace(namespace, name).methodConfig(configNamespace, configName).launch({
      entityType,
      expression: entityType !== rootEntityType ? `this.${rootEntityType}s` : '',
      entityName: selectedEntity,
      useCallCache: true
    }).then(
      submission => onSuccess(submission),
      error => this.setState({ launchError: JSON.parse(error).message, launching: false })
    )
  }
}
