import { Fragment } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import Interactive from 'react-interactive'
import * as Breadcrumbs from 'src/components/breadcrumbs'
import { buttonPrimary } from 'src/components/common'
import { spinner } from 'src/components/icons'
import { TopBar } from 'src/components/TopBar'
import { Rawls } from 'src/libs/ajax'
import * as Nav from 'src/libs/nav'
import * as Style from 'src/libs/style'
import { Component } from 'src/libs/wrapped-components'


const tableColumns = [
  { label: 'Task name', width: 350 },
  { label: 'Variable', width: 360 },
  { label: 'Type', width: 160 },
  { label: 'Attribute' }
]

const tabs = ['Inputs', 'Outputs', 'WDL']


class WorkflowView extends Component {
  render() {
    const { config } = this.state
    const { workspaceNamespace, workspaceName, workflowName } = this.props
    const workspaceId = { namespace: workspaceNamespace, name: workspaceName }

    return h(Fragment, [
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
      config ? [
        div({ style: { backgroundColor: Style.colors.section, padding: '1.5rem 3rem 0' } }, [
          this.renderSummary(),
          this.renderTabs()
        ])
      ] : [spinner({ style: { marginTop: '2rem' } })]
    ])
  }

  async componentDidMount() {
    const { workspaceNamespace, workspaceName, workflowName } = this.props

    const config = await Rawls.workspace(workspaceNamespace, workspaceName).methodConfigs.get(workflowName)
    this.setState({ config })
  }

  renderSummary = () => {
    const { name, methodConfigVersion, rootEntityType, methodRepoMethod: { methodPath } } = this.state.config

    return div({ style: { display: 'flex' } }, [
      div({ style: { flex: '1 1 auto', lineHeight: '1.5rem' } }, [
        div({ style: { color: Style.colors.title, fontSize: 24 } }, name),
        div(`V. ${methodConfigVersion}`),
        div(`Path: ${methodPath}`),
        div({ style: { textTransform: 'capitalize' } }, `Data Type: ${rootEntityType}`)
      ]),
      div({ style: { flex: '0 0 auto' } }, [
        buttonPrimary({ disabled: true }, 'Launch analysis')
      ])
    ])
  }

  renderTabs = () => {
    const { selectedTab = 'Inputs' } = this.state

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
                position: 'absolute', left: 0, right: 0, bottom: -1, height: 1,
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
            borderTopRightRadius: 5,
            borderTopLeftRadius: selectedTab !== 'Inputs' && 5
          }
        },
        tableColumns.map(({ label, width }, idx) => {
          return div({
            style: {
              flexGrow: 0, flexShrink: 0, flexBasis: width || 'auto',
              fontWeight: 500, fontSize: 12, padding: '0.5rem 0.8rem',
              borderLeft: idx !== 0 && Style.standardLine
            }
          },
          label)
        })
      )
    ])
  }
}


export const addNavPaths = () => {
  Nav.defPath('workflow', {
    path: '/workspaces/:workspaceNamespace/:workspaceName/tools/:workflowName',
    component: WorkflowView
  })
}
