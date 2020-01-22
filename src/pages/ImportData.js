import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, img } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { backgroundLogo, ButtonPrimary, ButtonSecondary, Clickable, RadioButton, spinnerOverlay } from 'src/components/common'
import { icon, wdlIcon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import { notify } from 'src/components/Notifications'
import TopBar from 'src/components/TopBar'
import { useWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import { getAppName } from 'src/libs/logos'
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

const ChoiceButton = ({ onClick, iconName, title, detail }) => {
  return h(Clickable, {
    onClick,
    style: {
      padding: '1rem', marginTop: '1rem',
      display: 'flex', alignItems: 'center',
      border: `1px solid ${colors.accent()}`, borderRadius: 4
    },
    hover: { backgroundColor: colors.accent(0.1) }
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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCloneOpen, setIsCloneOpen] = useState(false)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(wid)
  const [selectedTemplateWorkspace, setSelectedTemplateWorkspace] = useState()
  const [selected, setSelected] = useState()
  const [templateWorkspaces, setTemplateWorkspaces] = useState()

  Utils.useOnMount(() => {
    const loadTemplateWorkspaces = async () => {
      try {
        const allTemplates = await fetch(`${getConfig().firecloudBucketRoot}/template-workspaces.json`).then(res => res.json())
        setTemplateWorkspaces(allTemplates[getAppName()] || null)
      } catch (e) {
        setTemplateWorkspaces(null)
      }
    }

    loadTemplateWorkspaces()
  })

  const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)

  const setSelectedTemp = ws => {
    setSelected(ws)
    setSelectedTemplateWorkspace(ws)
  }

  const setSelectedTempWorkSpaceWithDetails = async () => {
    try {
      const workspace = await Ajax().Workspaces.workspace(selectedTemplateWorkspace.namespace, selectedTemplateWorkspace.name).details([
        'workspace', 'workspace.attributes'
      ])
      setSelectedTemplateWorkspace(workspace)
      setIsCloneOpen(true)
    } catch {
      setIsCloneOpen(false)
    }
  }

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
        await Ajax().Workspaces.workspace(namespace, name).importJSON(url)
        notify('success', 'Data imported successfully.', { timeout: 3000 })
      }],
      [Utils.DEFAULT, async () => {
        await Ajax().Workspaces.workspace(namespace, name).importBagit(url)
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
              div({ style: { marginTop: '0.5rem' } },
                ['Note that the import process may take some time after you are redirected into your destination workspace.']),
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
          ['template', () => {
            return h(Fragment, [
              div({ style: styles.title }, ['Start with a template']),
              div({ style: { marginBottom: '1rem' } }, [
                'Note that the import process may take some time after you are redirected into your destination workspace.'
              ]),
              div({ style: { overflow: 'auto', height: '20rem' } }, [
                _.map(([i, ws]) => {
                  const { name, namespace, description, hasNotebooks, hasWorkflows } = ws
                  const isSelected = _.isEqual(ws, selected)

                  return div({
                    key: `${name}/${namespace}`,
                    style: {
                      display: 'flex', alignItems: 'baseline',
                      marginBottom: '1rem',
                      ...(i > 0 ? { borderTop: Style.standardLine, paddingTop: '1rem' } : {})
                    }
                  }, [
                    h(RadioButton, {
                      name: 'select-template',
                      checked: isSelected,
                      onChange: () => setSelectedTemp(ws),
                      text: h(Collapse, {
                        buttonStyle: { color: colors.dark(), fontWeight: 600 },
                        style: { fontSize: 16, marginLeft: '0.5rem' },
                        title: h(Fragment, [
                          name,
                          hasWorkflows && wdlIcon({ style: { height: 22, width: 22, marginLeft: '0.5rem' } }),
                          hasNotebooks && img({ src: jupyterLogo, style: { height: 22, width: 22, marginLeft: '0.5rem' } })
                        ])
                      }, [description])
                    })
                  ]
                  )
                }, Utils.toIndexPairs(templateWorkspaces))
              ]),
              div({ style: { margin: '0 -2rem', borderTop: `0.5px solid ${colors.dark(0.2)}` } }),
              div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
                h(ButtonSecondary, { style: { marginLeft: 'auto' }, onClick: () => setMode() }, ['Back']),
                h(ButtonPrimary, {
                  style: { marginLeft: '3rem' },
                  disabled: !selectedTemplateWorkspace,
                  onClick: () => setSelectedTempWorkSpaceWithDetails()
                }, ['Import'])
              ])
            ])
          }],
          [Utils.DEFAULT, () => {
            return h(Fragment, [
              div({ style: styles.title }, ['Destination Workspace']),
              div({ style: { marginTop: '0.5rem' } }, ['Choose the option below that best suits your needs.']),
              !!templateWorkspaces && h(ChoiceButton, {
                onClick: () => setMode('template'),
                iconName: 'copy',
                title: 'Start with a template',
                detail: 'Clone from one of our template workspaces that has analyses ready for use'
              }),
              h(ChoiceButton, {
                onClick: () => setMode('existing'),
                iconName: 'folder-open',
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
        isCloneOpen && h(NewWorkspaceModal, {
          cloneWorkspace: selectedTemplateWorkspace,
          onDismiss: () => setIsCloneOpen(false),
          onSuccess: w => {
            setMode('template')
            setIsCloneOpen(false)
            setSelectedWorkspaceId(w.workspaceId)
            refreshWorkspaces()
            onImport(w)
          }
        }),
        (isImporting || templateWorkspaces === undefined) && spinnerOverlay
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
