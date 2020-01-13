import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { backgroundLogo, ButtonPrimary, ButtonSecondary, Clickable, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { notify } from 'src/components/Notifications'
import TopBar from 'src/components/TopBar'
import { useWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import * as Nav from 'src/libs/nav'
import { pfbImportJobStore } from 'src/libs/state'
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
      padding: '1rem',
      display: 'flex', alignItems: 'center',
      border: `1px solid ${colors.accent()}`, borderRadius: 4
    },
    hover: { backgroundColor: colors.accent(0.1) },
    ...props
  }, [
    icon(iconName, { size: 24, style: { flex: 'none', marginRight: '1rem' } }),
    div({ style: { flex: 1 } }, [
      div({ style: { fontWeight: 'bold' } }, [title]),
      div([detail])
    ]),
    icon('angle-right', { size: 32, style: { flex: 'none', marginLeft: '1rem' } })
  ])
}

const ImportData = () => {
  const { workspaces, refresh: refreshWorkspaces } = useWorkspaces()
  const [isImporting, setIsImporting] = useState(false)
  const { query: { url, format, ad, wid } } = Nav.useRoute()
  const [mode, setMode] = useState(wid ? 'existing' : undefined)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(wid)

  const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)

  const onImport = _.flow(
    Utils.withBusyState(setIsImporting),
    withErrorReporting('Import Error')
  )(async ({ namespace, name }) => {
    await Utils.switchCase(format,
      ['PFB', async () => {
        const { jobId } = await Ajax().Workspaces.workspace(namespace, name).importPFB(url)
        pfbImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }))
        notify('info', 'Data import in progress.', {
          id: jobId,
          message: 'Data will show up incrementally as the job progresses.'
        })
      }],
      ['entitiesJson', async () => {
        await await Ajax().Workspaces.workspace(namespace, name).importJSON(url)
        notify('success', 'Data imported successfully.', { timeout: 3000 })
      }],
      [Utils.DEFAULT, async () => {
        await await Ajax().Workspaces.workspace(namespace, name).importBagit(url)
        notify('success', 'Data imported successfully.', { timeout: 3000 })
      }]
    )
    Nav.goToPath('workspace-data', { namespace, name })
  })

  return h(Fragment, [
    backgroundLogo,
    h(TopBar, { title: 'Import Data' }),
    div({ role: 'main', style: styles.container }, [
      div({ style: styles.card }, [
        div({ style: styles.title }, ['Importing Data']),
        div({ style: { fontSize: 16 } }, ['From: ', new URL(url).hostname]),
        div({ style: { marginTop: '1rem' } }, [
          'The dataset(s) you just chose to import to Terra will be made available to you within a workspace of your choice where you can then perform analysis.'
        ]),
        div({ style: { marginTop: '0.5rem' } }, [
          'You can import into a new blank workspace or an existing workspace you have already been working on.'
        ])
      ]),
      div({ style: { ...styles.card, marginLeft: '2rem' } }, [
        Utils.switchCase(mode,
          ['existing', () => {
            return h(Fragment, [
              div({ style: styles.title }, ['Start with an existing workspace']),
              h(WorkspaceSelector, {
                workspaces: _.filter(ws => {
                  return Utils.canWrite(ws.accessLevel) &&
                    (!ad || _.some({ membersGroupName: ad }, ws.workspace.authorizationDomain))
                }, workspaces),
                value: selectedWorkspaceId,
                onChange: setSelectedWorkspaceId
              }),
              div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
                h(ButtonPrimary, {
                  disabled: !selectedWorkspace,
                  onClick: () => onImport(selectedWorkspace.workspace)
                }, ['Import']),
                h(ButtonSecondary, { style: { marginLeft: '1rem' }, onClick: () => setMode() }, ['Back'])
              ])
            ])
          }],
          ['new', () => {
            return h(Fragment, [
              div({ style: styles.title }, ['Start with a new workspace']),
              h(NewWorkspaceModal, {
                requiredAuthDomain: ad,
                onDismiss: () => setMode(),
                onSuccess: w => {
                  setMode('existing')
                  setSelectedWorkspaceId(w.workspaceId)
                  refreshWorkspaces()
                  onImport(w)
                }
              })
            ])
          }],
          [Utils.DEFAULT, () => {
            return h(Fragment, [
              div({ style: styles.title }, ['Destination Workspace']),
              div({ style: { marginTop: '0.5rem' } }, ['Choose the option below that best suits your needs.']),
              div({ style: { marginTop: '0.5rem' } }, ['Note that the import process may take some time after you are redirected into your destination workspace.']),
              h(ChoiceButton, {
                style: { marginTop: '1rem' },
                onClick: () => setMode('existing'),
                iconName: 'folder-open',
                title: 'Start with an existing workspace',
                detail: 'Select one of your workspaces'
              }),
              h(ChoiceButton, {
                style: { marginTop: '1rem' },
                onClick: () => setMode('new'),
                iconName: 'plus',
                title: 'Start with a new workspace',
                detail: 'Set up an empty workspace that you will configure for analysis'
              })
            ])
          }]
        ),
        isImporting && spinnerOverlay
      ])
    ])
  ])
}

export const navPaths = [
  {
    name: 'import-data',
    path: '/import-data',
    component: ImportData,
    title: 'Import Data'
  }
]
