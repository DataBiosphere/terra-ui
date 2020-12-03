import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { backgroundLogo, ButtonPrimary, ButtonSecondary, Clickable, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import TopBar from 'src/components/TopBar'
import { useWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  container: {
    display: 'flex', alignItems: 'flex-start', flex: 'auto',
    position: 'relative', padding: '2rem'
  },
  title: {
    fontSize: 24, fontWeight: 600, color: colors.dark(), marginBottom: '1rem'
  },
  card: {
    borderRadius: 5, backgroundColor: 'white', padding: '2rem',
    flex: 1, minWidth: 0, boxShadow: Style.standardShadow
  }
}

const ChoiceButton = ({ iconName, title, detail, style, ...props }) => {
  return h(Clickable, {
    style: {
      ...style,
      padding: '1rem', marginTop: '1rem',
      display: 'flex', alignItems: 'center',
      border: `1px solid ${colors.accent(1)}`, borderRadius: 4
    },
    hover: { backgroundColor: colors.accent(0.1) },
    ...props
  }, [
    icon(iconName, { size: 29, style: { flex: 'none', marginRight: '1rem', color: colors.accent(1) } }),
    div({ style: { flex: 1 } }, [
      div({ style: { fontWeight: 'bold', color: colors.accent(1) } }, [title]),
      div([detail])
    ]),
    icon('angle-right', { size: 32, style: { flex: 'none', marginLeft: '1rem', color: colors.accent(1) } })
  ])
}

const ImportSnapshot = () => {
  const { workspaces, refresh: refreshWorkspaces, loading: loadingWorkspaces } = useWorkspaces()
  const [isImporting, setIsImporting] = useState(false)
  const { query: { url, ad, wid, snapshotId, snapshotName } } = Nav.useRoute()
  const [mode, setMode] = useState(wid ? 'existing' : undefined)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(wid)

  const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)

  const onImport = _.flow(
    Utils.withBusyState(setIsImporting),
    withErrorReporting('Import Error')
  )(async workspace => {
    const namespace = workspace.namespace
    const name = workspace.name
    await Ajax().Workspaces.workspace(namespace, name).importSnapshot(snapshotId, snapshotName)
    notify('success', 'Snapshot imported successfully.', { timeout: 3000 })
    Nav.goToPath('workspace-data', { namespace, name })
  })

  return h(FooterWrapper, [
    backgroundLogo,
    h(TopBar, { title: 'Import Snapshot' }),
    div({ role: 'main', style: styles.container }, [
      div({ style: styles.card }, [
        div({ style: styles.title }, ['Importing Snapshot']),
        div({ style: { fontSize: 16 } }, ['From: ', new URL(url).hostname]),
        div({ style: { marginTop: '1rem' } }, [
          'The snapshot you just chose to import to Terra will be made available to you within a workspace of your choice where you can then perform analysis.'
        ])
      ]),
      div({ style: { ...styles.card, marginLeft: '2rem' } }, [
        Utils.switchCase(mode,
          ['existing', () => {
            return h(Fragment, [
              div({ style: styles.title }, ['Start with an existing workspace']),
              div({ style: { fontWeight: 600, marginBottom: '0.25rem' } }, ['Select one of your workspaces']),
              h(WorkspaceSelector, {
                workspaces: _.filter(ws => {
                  return Utils.canWrite(ws.accessLevel) &&
                    (!ad || _.some({ membersGroupName: ad }, ws.workspace.authorizationDomain))
                }, workspaces),
                value: selectedWorkspaceId,
                onChange: setSelectedWorkspaceId
              }),
              div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
                h(ButtonSecondary, { onClick: () => setMode(), style: { marginLeft: 'auto' } }, ['Back']),
                h(ButtonPrimary, {
                  style: { marginLeft: '2rem' },
                  disabled: !selectedWorkspace,
                  onClick: () => onImport(selectedWorkspace.workspace)
                }, ['Import'])
              ])
            ])
          }],
          [Utils.DEFAULT, () => {
            return h(Fragment, [
              div({ style: styles.title }, ['Destination Workspace']),
              div({ style: { marginTop: '0.5rem' } }, ['Choose the option below that best suits your needs.']),
              h(ChoiceButton, {
                onClick: () => setMode('existing'),
                iconName: 'fileSearchSolid',
                title: 'Start with an existing workspace',
                detail: 'Select one of your workspaces'
              }),
              h(ChoiceButton, {
                onClick: () => setIsCreateOpen(true),
                iconName: 'plus-circle',
                title: 'Start with a new workspace',
                detail: 'Set up an empty workspace that you will configure for analysis'
              }),
              isCreateOpen && h(NewWorkspaceModal, {
                requiredAuthDomain: ad,
                onDismiss: () => setIsCreateOpen(false),
                onSuccess: w => {
                  setMode('existing')
                  setIsCreateOpen(false)
                  setSelectedWorkspaceId(w.workspaceId)
                  refreshWorkspaces()
                  onImport(w)
                }
              })
            ])
          }]
        ),
        (isImporting || loadingWorkspaces) && spinnerOverlay
      ])
    ])
  ])
}

export const navPaths = [
  {
    name: 'import-snapshot',
    path: '/import-snapshot',
    component: ImportSnapshot,
    title: 'Import Snapshot'
  }
]
