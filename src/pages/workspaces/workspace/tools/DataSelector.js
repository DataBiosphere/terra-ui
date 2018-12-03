import _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import { link, search } from 'src/components/common'
import { centeredSpinner } from 'src/components/icons'
import { GridTable, HeaderCell, TextCell } from 'src/components/table'
import { ajaxCaller } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { renderDataCell } from 'src/libs/data-utils'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'


export default ajaxCaller(class DataSelector extends Component {
  constructor(props) {
    super(props)

    this.state = { filterText: '' }
  }

  render() {
    const { entityType, entityMetadata, style } = this.props
    const { entities, attributeFailure, entityFailure } = this.state
    const { attributeNames } = (entityType && entityMetadata) ? entityMetadata[entityType] : {}

    return div({ style }, [
      Utils.cond(
        [!entityType, () => div(['Nothing!'])],
        [attributeNames && entities, () => this.renderMain()],
        [attributeFailure || entityFailure, () => this.renderError()],
        () => centeredSpinner()
      )
    ])
  }

  renderMain() {
    const { entityType, entityMetadata, selectedEntity, onEntitySelected, workspaceId: { namespace } } = this.props
    const { loadingNew, entities, filterText } = this.state
    const { attributeNames, idName } = (entityType && entityMetadata) ? entityMetadata[entityType] : {}
    const filteredEntities = _.filter(_.conformsTo({ name: Utils.textMatch(filterText) }), entities)

    return loadingNew ? centeredSpinner() : div([
      search({
        wrapperProps: {
          style: {
            width: 500,
            margin: '0 0 0.5rem 1rem'
          }
        },
        inputProps: {
          placeholder: 'FILTER',
          value: filterText,
          onChange: e => this.setState({ filterText: e.target.value })
        }
      }),
      h(AutoSizer, { disableHeight: true }, [
        ({ width }) => {
          return h(GridTable, {
            width, height: 300,
            rowCount: filteredEntities.length,
            columns: [
              {
                width: 150,
                headerRenderer: () => h(HeaderCell, [idName]),
                cellRenderer: ({ rowIndex }) => {
                  const { name } = filteredEntities[rowIndex]
                  return h(TextCell, [
                    link({ onClick: () => onEntitySelected(name), title: name }, [name])
                  ])
                }
              },
              ..._.map(name => ({
                width: 300,
                headerRenderer: () => h(HeaderCell, [name]),
                cellRenderer: ({ rowIndex }) => {
                  return renderDataCell(
                    Utils.entityAttributeText(filteredEntities[rowIndex].attributes[name]), namespace
                  )
                }
              }), attributeNames)
            ],
            styleCell: ({ rowIndex }) => {
              return selectedEntity === filteredEntities[rowIndex].name ?
                { backgroundColor: colors.blue[5] } : {}
            }
          })
        }
      ])
    ])
  }

  renderError() {
    const { attributeFailure, entityFailure } = this.state

    return div({}, [
      div({}, 'Unable to load data entities'),
      attributeFailure && div({}, attributeFailure),
      entityFailure && div({}, entityFailure)
    ])
  }

  componentDidMount() {
    const { entityType } = this.props

    if (entityType) {
      this.loadData()
    }
  }

  componentDidUpdate(prevProps) {
    const { entityType } = this.props

    if (entityType && prevProps.entityType !== entityType) {
      this.loadData()
    }
  }

  loadData() {
    const { entityType, workspaceId: { namespace, name }, ajax: { Workspaces } } = this.props

    this.setState({ loadingNew: true })

    Workspaces.workspace(namespace, name).entitiesOfType(entityType).then(
      entities => this.setState({ entities, loadingNew: false }),
      entityFailure => this.setState({ entityFailure })
    )
  }
})
