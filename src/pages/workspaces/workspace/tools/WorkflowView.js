import _ from 'lodash'
import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import * as Breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary } from 'src/components/common'
import { spinner } from 'src/components/icons'
import { DataTable, components } from 'src/components/table'
import { TopBar } from 'src/components/TopBar'
import WDLViewer from 'src/components/WDLViewer'
import { Agora, Dockstore, Rawls } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'
import { tabBar } from 'src/pages/workspaces/workspace/WorkspaceTabs'


const sideMargin = '3rem'

const tableColumns = [
  { label: 'Task name', width: 350 },
  { label: 'Variable', width: 360 },
  { label: 'Type', width: 160 },
  { label: 'Attribute' }
]

const tabs = ['Inputs', 'Outputs', 'WDL']


class WorkflowView extends Component {
  constructor(props) {
    super(props)

    this.state = { selectedTab: 'Inputs', loadedWdl: false }
  }

  componentDidUpdate() {
    const { selectedTab, loadedWdl } = this.state
    if (selectedTab === 'WDL' && !loadedWdl) {
      this.fetchWDL()
    }
  }

  render() {
    const { config } = this.state
    const { workspaceNamespace, workspaceName, workflowName } = this.props
    const workspaceId = { namespace: workspaceNamespace, name: workspaceName }

    return div({ style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [
      h(TopBar, { title: 'Projects' }, [
        div({ style: { display: 'flex', flexDirection: 'column', paddingLeft: '4rem' } },
          [
            div([
              Breadcrumbs.commonElements.workspaces(),
              Breadcrumbs.commonElements.workspace(workspaceId),
              Breadcrumbs.commonElements.workspace(workspaceId, 'tools')
            ]),
            div({ style: { fontSize: '1.25rem' } }, workflowName)
          ])
      ]),
      tabBar(_.merge(workspaceId, { activeTab: 'tools' })),
      config ?
        h(Fragment, [
          div({
            style: {
              backgroundColor: Style.colors.section, padding: `1.5rem ${sideMargin} 0`,
              borderBottom: `2px solid ${Style.colors.secondary}`
            }
          }, [
            this.renderSummary(),
            this.renderTabs()
          ]),
          this.renderDetail()
        ]) : [spinner({ style: { marginTop: '2rem' } })]
    ])
  }

  async componentDidMount() {
    const { workspaceNamespace, workspaceName, workflowNamespace, workflowName } = this.props

    const config = await Rawls.workspace(workspaceNamespace, workspaceName).methodConfigs.get(workflowNamespace, workflowName)
    this.setState({ config })

    const inputsOutputs = await Rawls.methodConfigInputsOutputs(config)
    this.setState({ inputsOutputs })
  }

  renderSummary = () => {
    const { name, methodConfigVersion, rootEntityType, methodRepoMethod: { methodPath } } = this.state.config

    return div({ style: { display: 'flex' } }, [
      div({ style: { flex: '1 1 auto', lineHeight: '1.5rem' } }, [
        div({ style: { color: Style.colors.title, fontSize: 24 } }, name),
        div(`V. ${methodConfigVersion}`),
        methodPath && div(`Path: ${methodPath}`),
        div({ style: { textTransform: 'capitalize' } }, `Data Type: ${rootEntityType}`)
      ]),
      div({ style: { flex: '0 0 auto' } }, [
        buttonPrimary({ disabled: true }, 'Launch analysis')
      ])
    ])
  }

  renderTabs = () => {
    const { selectedTab } = this.state

    return h(Fragment, [
      div(
        { style: { marginTop: '2rem' } },
        tabs.map(label => {
          const selected = label === selectedTab
          const border = `1px solid ${selected ? Style.colors.sectionBorder : Style.colors.section}`
          return h(Interactive, {
            as: 'div',
            style: {
              display: 'inline-block', position: 'relative', padding: '1rem 1.5rem',
              fontSize: 16, fontWeight: 500, color: Style.colors.secondary,
              backgroundColor: selected && Style.colors.sectionHighlight,
              borderTop: border, borderLeft: border, borderRight: border,
              borderRadius: '5px 5px 0 0'
            },
            onClick: () => this.setState({ selectedTab: label })
          }, [
            label,
            selected && div({
              style: {
                // Fractional L/R to make border corners line up when zooming in. Works for up to 175% in Chrome.
                position: 'absolute', left: 0.4, right: 0.1, bottom: -3, height: 5,
                backgroundColor: Style.colors.sectionHighlight
              }
            })
          ])
        })),
      div(
        {
          style: {
            display: 'flex', padding: '0.3rem',
            border: `1px solid ${Style.colors.sectionBorder}`,
            backgroundColor: Style.colors.sectionHighlight,
            borderBottom: 'unset',
            borderTopRightRadius: 5,
            borderTopLeftRadius: selectedTab !== 'Inputs' && 5
          }
        },
        selectedTab === 'WDL' ?
          // Placeholder to preserve spacing:
          [div({ style: { fontSize: 12, padding: '0.5rem 0', color: 'transparent', userSelect: 'none' } }, '.')] :
          tableColumns.map(({ label, width }, idx) => {
            return div({
              style: {
                flex: width ? `0 0 ${width}px` : '1 1 auto',
                fontWeight: 500, fontSize: 12, padding: '0.5rem 0.8rem',
                borderLeft: idx !== 0 && Style.standardLine
              }
            },
            label)
          })
      )
    ])
  }

  renderDetail = () => {
    const { selectedTab, wdl, inputsOutputs, config } = this.state

    if (selectedTab === 'WDL' && wdl) {
      return div({
        style: {
          flex: '1 1 auto', overflowY: 'auto', maxHeight: 500,
          margin: `0 ${sideMargin}`, padding: '0.5rem', backgroundColor: 'white',
          border: Style.standardLine, borderTop: 'unset'
        }
      }, [h(WDLViewer, { wdl, readOnly: true })])
    } else if (selectedTab !== 'WDL' && inputsOutputs) {
      const key = selectedTab.toLowerCase() // 'inputs' or 'outputs'

      return div({ style: { margin: `0 ${sideMargin}` } },
        [h(DataTable, {
          dataSource: inputsOutputs[key],
          customComponents: components.fullWidthTable,
          tableProps: {
            showHeader: false, scroll: { y: 400 },
            columns: [
              {
                key: 'task-name', width: 350,
                render: ({ name }) =>
                  div({
                    style: {
                      overflow: 'hidden', textOverflow: 'ellipsis'
                    }
                  }, name)
              },
              {
                key: 'variable', width: 360,
                render: ({ name }) => _.last(_.split(name, '.'))
              },
              {
                key: 'type', width: 160,
                dataIndex: `${key.slice(0, -1)}Type`
              },
              {
                key: 'attribute', width: '100%',
                render: ({ name }) => config[key][name]
              }
            ]
          }
        })])
    } else {
      return spinner({ style: { marginTop: '1rem' } })
    }
  }

  fetchWDL = async () => {
    const { methodRepoMethod: { sourceRepo, methodNamespace, methodName, methodVersion, methodPath } } = this.state.config

    this.setState({ loadedWdl: true })
    const wdl = await (() => {
      switch (sourceRepo) {
        case 'dockstore':
          return Dockstore.getWdl(methodPath, methodVersion).then(({ descriptor }) => descriptor)
        case 'agora':
          return Agora.method(methodNamespace, methodName, methodVersion).get().then(({ payload }) => payload)
        default:
          throw new Error('unknown sourceRepo')
      }
    })()
    this.setState({ wdl })
  }
}


export const addNavPaths = () => {
  Nav.defPath('workflow', {
    path: '/workspaces/:workspaceNamespace/:workspaceName/tools/:workflowNamespace/:workflowName',
    component: WorkflowView
  })
}
