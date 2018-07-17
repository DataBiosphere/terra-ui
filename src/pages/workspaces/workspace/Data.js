import clipboard from 'clipboard-polyfill'
import _ from 'lodash/fp'
import { createRef, Fragment } from 'react'
import { div, form, h, input } from 'react-hyperscript-helpers'
import { AutoSizer } from 'react-virtualized'
import * as breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary, link, spinnerOverlay } from 'src/components/common'
import { icon, spinner } from 'src/components/icons'
import { FlexTable, GridTable, HeaderCell, paginator } from 'src/components/table'
import { Rawls } from 'src/libs/ajax'
import * as auth from 'src/libs/auth'
import * as Config from 'src/libs/config'
import { ReferenceDataImporter, renderDataCell } from 'src/libs/data-utils'
import { reportError } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import * as StateHistory from 'src/libs/state-history'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { Component } from 'src/libs/wrapped-components'
import { wrapWorkspace } from 'src/pages/workspaces/workspace/WorkspaceContainer'


const filterState = _.pick(['pageNumber', 'itemsPerPage', 'selectedDataType', 'sort'])

const globalVariables = 'globalVariables'

const initialSort = { field: 'name', direction: 'asc' }

const styles = {
  tableContainer: {
    display: 'flex', margin: '1rem', backgroundColor: 'white', borderRadius: 5,
    boxShadow: Style.standardShadow
  },
  dataTypeSelectionPanel: { flexShrink: 0, borderRight: `1px solid ${Style.colors.disabled}` },
  tableViewPanel: hasSelection => ({
    position: 'relative',
    overflow: 'hidden',
    margin: '1rem', width: '100%',
    textAlign: hasSelection ? undefined : 'center'
  }),
  dataTypeHeading: {
    fontWeight: 500, padding: '0.5rem 1rem',
    borderBottom: `1px solid ${Style.colors.background}`
  },
  dataTypeOption: selected => ({
    cursor: 'pointer', padding: '0.75rem 1rem',
    backgroundColor: selected ? Style.colors.highlightFaded : null
  }),
  dataTypeIcon: { color: '#757575', marginRight: '0.5rem' }
}

const SortableHeaderCell = ({ sort, field, onSort, children }) => {
  return div({
    style: { flex: 1, display: 'flex', alignItems: 'center', cursor: 'pointer', height: '100%' },
    onClick: () => onSort(Utils.nextSort(sort, field))
  }, [
    div({
      style: {
        flex: 1,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        fontWeight: 500
      }
    }, [children]),
    sort.field === field && div({ style: { flex: 'none', color: Style.colors.secondary } }, [
      icon(sort.direction === 'asc' ? 'arrow down' : 'arrow')
    ])
  ])
}

const WorkspaceData = wrapWorkspace({
  breadcrumbs: props => breadcrumbs.commonPaths.workspaceDashboard(props),
  title: 'Data', activeTab: 'data'
},
class WorkspaceDataContent extends Component {
  constructor(props) {
    super(props)

    this.state = {
      itemsPerPage: 25,
      pageNumber: 1,
      sort: initialSort,
      loading: false,
      workspaceAttributes: props.workspace.workspace.attributes,
      ...StateHistory.get()
    }
    this.downloadForm = createRef()
  }

  async loadMetadata() {
    const { namespace, name } = this.props
    try {
      const entityMetadata = await Rawls.workspace(namespace, name).entityMetadata()
      this.setState({ entityMetadata })
    } catch (error) {
      reportError('Error loading workspace entity data', error)
    }
  }

  async loadData() {
    const { namespace, name } = this.props
    const { itemsPerPage, pageNumber, sort, selectedDataType } = this.state

    const getWorkspaceAttributes = async () => (await Rawls.workspace(namespace, name).details()).workspace.attributes

    if (!selectedDataType) {
      this.setState({ workspaceAttributes: await getWorkspaceAttributes() })
    } else {
      try {
        this.setState({ loading: true, refreshRequested: false })

        const [workspaceAttributes, { results, resultMetadata: { unfilteredCount } }] = await Promise.all([
          getWorkspaceAttributes(),
          Rawls.workspace(namespace, name)
            .paginatedEntitiesOfType(selectedDataType, {
              page: pageNumber, pageSize: itemsPerPage, sortField: sort.field, sortDirection: sort.direction
            })
        ])

        this.setState({ entities: results, totalRowCount: unfilteredCount, workspaceAttributes })
      } catch (error) {
        reportError('Error loading workspace data', error)
      } finally {
        this.setState({ loading: false })
      }
    }
  }

  getReferenceData() {
    const { workspaceAttributes } = this.state

    return _.flow(
      _.toPairs,
      _.filter(([key]) => key.startsWith('referenceData-')),
      _.map(([k, value]) => {
        const [, datum, key] = /referenceData-([^-]+)-(.+)/.exec(k)
        return { datum, key, value }
      }),
      _.groupBy('datum')
    )(workspaceAttributes)
  }

  async componentDidMount() {
    this.loadMetadata()
    this.loadData()

    this.setState({ orchestrationRoot: await Config.getOrchestrationUrlRoot() })
  }

  refresh() {
    this.loadMetadata()
    this.setState({ refreshRequested: true })
  }

  render() {
    const { namespace, name } = this.props
    const { selectedDataType, entityMetadata, loading, importingReference } = this.state
    const referenceData = this.getReferenceData()

    return div({ style: styles.tableContainer }, [
      !entityMetadata ? spinnerOverlay : h(Fragment, [
        div({ style: styles.dataTypeSelectionPanel }, [
          div({ style: styles.dataTypeHeading }, 'Data Model'),
          !_.isEmpty(entityMetadata) && div({ style: { borderBottom: `1px solid ${Style.colors.disabled}` } },
            _.map(([type, typeDetails]) =>
              div({
                style: styles.dataTypeOption(selectedDataType === type),
                onClick: () => {
                  this.setState(selectedDataType === type ?
                    { refreshRequested: true } :
                    { selectedDataType: type, pageNumber: 1, sort: initialSort, entities: undefined }
                  )
                }
              }, [
                icon('table', { style: styles.dataTypeIcon }),
                `${type} (${typeDetails.count})`
              ]),
            _.toPairs(entityMetadata))),
          div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...styles.dataTypeHeading } }, [
            'Reference Data',
            link({ onClick: () => this.setState({ importingReference: true }) }, [icon('plus-circle')])
          ]),
          importingReference &&
            h(ReferenceDataImporter, {
              onDismiss: () => this.setState({ importingReference: false }),
              onSuccess: () => this.setState({ importingReference: false }, () => this.loadData()),
              namespace, name
            }),
          div({ style: { borderBottom: `1px solid ${Style.colors.disabled}` } },
            _.map(type => div({
              style: styles.dataTypeOption(selectedDataType === type),
              onClick: () => this.setState({ selectedDataType: type })
            }, [icon('table', { style: styles.dataTypeIcon }), type]),
            _.keys(referenceData))
          ),
          div({
            style: {
              marginBottom: '1rem', ...styles.dataTypeOption(selectedDataType === globalVariables)
            },
            onClick: () => {
              this.setState(selectedDataType === globalVariables ?
                { refreshRequested: true } :
                { selectedDataType: globalVariables }
              )
            }
          }, [
            icon('world', { style: styles.dataTypeIcon }),
            'Global Variables'
          ])
        ]),
        div({ style: styles.tableViewPanel(selectedDataType) }, [
          selectedDataType ? this.renderData() : 'Select a data type.',
          loading && spinnerOverlay
        ])
      ])
    ])
  }

  renderData() {
    const { selectedDataType } = this.state
    const referenceData = this.getReferenceData()

    if (selectedDataType === globalVariables) {
      return this.renderGlobalVariables()
    } else if (_.keys(referenceData).includes(selectedDataType)) {
      return this.renderReferenceData()
    } else {
      return this.renderEntityTable()
    }
  }

  renderEntityTable() {
    const { namespace } = this.props
    const { entities, selectedDataType, entityMetadata, totalRowCount, pageNumber, itemsPerPage, sort } = this.state

    return entities && h(Fragment, [
      div({ style: { marginBottom: '1rem' } }, [
        this.renderDownloadButton(),
        this.renderCopyButton()
      ]),
      h(AutoSizer, { disableHeight: true }, [
        ({ width }) => {
          return h(GridTable, {
            width, height: 500,
            rowCount: entities.length,
            columns: [
              {
                width: 150,
                headerRenderer: () => h(SortableHeaderCell, {
                  sort, field: 'name', onSort: v => this.setState({ sort: v })
                }, [`${selectedDataType}_id`]),
                cellRenderer: ({ rowIndex }) => renderDataCell(entities[rowIndex].name, namespace)
              },
              ..._.map(name => ({
                width: 300,
                headerRenderer: () => h(SortableHeaderCell, {
                  sort, field: name, onSort: v => this.setState({ sort: v })
                }, [name]),
                cellRenderer: ({ rowIndex }) => {
                  return renderDataCell(
                    Utils.entityAttributeText(entities[rowIndex].attributes[name]), namespace
                  )
                }
              }), entityMetadata[selectedDataType] ? entityMetadata[selectedDataType].attributeNames : [])
            ]
          })
        }
      ]),
      div({ style: { marginTop: '1rem' } }, [
        paginator({
          filteredDataLength: totalRowCount,
          pageNumber,
          setPageNumber: v => this.setState({ pageNumber: v }),
          itemsPerPage,
          setItemsPerPage: v => this.setState({ itemsPerPage: v, pageNumber: 1 })
        })
      ])
    ])
  }

  renderDownloadButton() {
    const { namespace, name } = this.props
    const { selectedDataType, orchestrationRoot } = this.state
    return h(Fragment, [
      form({
        ref: this.downloadForm,
        action: `${orchestrationRoot}/cookie-authed/workspaces/${namespace}/${name}/entities/${selectedDataType}/tsv`,
        method: 'POST'
      }, [
        input({ type: 'hidden', name: 'FCtoken', value: auth.getAuthToken() })
        /*
         * TODO: once column selection is implemented, add another hidden input with name: 'attributeNames' and
         * value: comma-separated list of attribute names to support downloading only the selected columns
         */
      ]),
      buttonPrimary({
        disabled: !orchestrationRoot,
        tooltip: 'Download all data as a file',
        onClick: () => this.downloadForm.current.submit()
      }, [
        icon('download', { style: { marginRight: '0.5rem' } }),
        'Download'
      ])
    ])
  }

  renderCopyButton() {
    const { entities, selectedDataType, entityMetadata, copying, copied } = this.state

    return h(Fragment, [
      buttonPrimary({
        style: { margin: '0 1rem' },
        tooltip: 'Copy only the current page to the clipboard',
        onClick: async () => {
          const attributeNames = entityMetadata[selectedDataType].attributeNames

          const entityToRow = entity =>
            _.join('\t', [
              entity.name, ..._.map(
                attribute => Utils.entityAttributeText(entity.attributes[attribute]),
                attributeNames)
            ])

          const header = _.join('\t', [`${selectedDataType}_id`, ...attributeNames])

          const str = _.join('\n', [header, ..._.map(entityToRow, entities)]) + '\n'

          try {
            this.setState({ copying: true })
            await clipboard.writeText(str)
            this.setState({ copying: false, copied: true })
          } catch (error) {
            reportError('Error copying to clipboard', error)
          }
        }
      }, [
        icon('copy-to-clipboard', { style: { marginRight: '0.5rem' } }),
        'Copy to Clipboard'
      ]),
      copying && spinner(),
      copied && 'Done!'
    ])
  }

  renderGlobalVariables() {
    const { namespace } = this.props
    const { workspaceAttributes } = this.state
    const filteredAttributes = _.flow(
      _.toPairs,
      _.remove(([key]) => key === 'description' || key.includes(':') || key.startsWith('referenceData-')),
      _.sortBy(_.first)
    )(workspaceAttributes)

    return Utils.cond(
      [!filteredAttributes, () => undefined],
      [_.isEmpty(filteredAttributes), () => 'No Global Variables defined'],
      () => h(AutoSizer, { disableHeight: true }, [
        ({ width }) => h(FlexTable, {
          width, height: 500, rowCount: filteredAttributes.length,
          columns: [
            {
              size: { basis: 400, grow: 0 },
              headerRenderer: () => h(HeaderCell, ['Name']),
              cellRenderer: ({ rowIndex }) => renderDataCell(filteredAttributes[rowIndex][0], namespace)
            },
            {
              size: { grow: 1 },
              headerRenderer: () => h(HeaderCell, ['Value']),
              cellRenderer: ({ rowIndex }) => renderDataCell(filteredAttributes[rowIndex][1], namespace)
            }
          ]
        })
      ])
    )
  }

  renderReferenceData() {
    const { namespace } = this.props
    const { selectedDataType } = this.state
    const selectedData = _.sortBy('key', this.getReferenceData()[selectedDataType])

    return h(AutoSizer, { disableHeight: true, key: selectedDataType }, [
      ({ width }) => h(FlexTable, {
        width, height: 500, rowCount: selectedData.length,
        columns: [
          {
            size: { basis: 400, grow: 0 },
            headerRenderer: () => h(HeaderCell, ['Name']),
            cellRenderer: ({ rowIndex }) => renderDataCell(selectedData[rowIndex].key, namespace)
          },
          {
            size: { grow: 1 },
            headerRenderer: () => h(HeaderCell, ['Value']),
            cellRenderer: ({ rowIndex }) => renderDataCell(selectedData[rowIndex].value, namespace)
          }
        ]
      })
    ])
  }

  componentDidUpdate(prevProps, prevState) {
    StateHistory.update(_.pick(
      ['entityMetadata', 'selectedDataType', 'entities', 'workspaceAttributes', 'totalRowCount', 'itemsPerPage', 'pageNumber', 'sort'],
      this.state)
    )

    if (this.state.selectedDataType !== prevState.selectedDataType) {
      this.setState({ copying: false, copied: false })
    }

    if (this.state.refreshRequested || !_.isEqual(filterState(prevState), filterState(this.state))) {
      this.loadData()
    }
  }
})

export const addNavPaths = () => {
  Nav.defPath('workspace-data', {
    path: '/workspaces/:namespace/:name/data',
    component: WorkspaceData,
    title: ({ name }) => `${name} - Data`
  })
}
