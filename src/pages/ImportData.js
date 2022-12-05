import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h2, img, li, p, span, strong, ul } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { backgroundLogo, ButtonPrimary, ButtonSecondary, Clickable, IdContainer, RadioButton, spinnerOverlay } from 'src/components/common'
import { notifyDataImportProgress } from 'src/components/data/data-utils'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon, wdlIcon } from 'src/components/icons'
import NewWorkspaceModal from 'src/components/NewWorkspaceModal'
import TopBar from 'src/components/TopBar'
import { useWorkspaces, WorkspaceSelector } from 'src/components/workspace-utils'
import jupyterLogo from 'src/images/jupyter-logo.svg'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { FormLabel } from 'src/libs/forms'
import * as Nav from 'src/libs/nav'
import { notify } from 'src/libs/notifications'
import { useOnMount } from 'src/libs/react-utils'
import { asyncImportJobStore } from 'src/libs/state'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { useDataCatalog } from 'src/pages/library/dataBrowser-utils'


const styles = {
  container: {
    display: 'flex', alignItems: 'flex-start', flex: 'auto',
    position: 'relative', padding: '2rem'
  },
  title: {
    fontSize: 24, fontWeight: 600, color: colors.dark(), margin: '0 0 1rem 0'
  },
  card: {
    borderRadius: 5, backgroundColor: 'white', padding: '2rem',
    flex: 1, minWidth: 0, boxShadow: Style.standardShadow
  }
}

const ChoiceButton = ({ iconName, title, detail, style, onClick, disabled, ...props }) => {
  const color = disabled ? colors.dark(0.25) : colors.accent(1)
  return h(Clickable, {
    style: {
      ...style,
      padding: '1rem', marginTop: '1rem',
      display: 'flex', alignItems: 'center',
      border: `1px solid ${color}`, borderRadius: 4,
      cursor: disabled ? 'not-allowed' : 'pointer'
    },
    hover: disabled ? undefined : { backgroundColor: colors.accent(0.1) },
    onClick: !disabled && onClick,
    ...props
  }, [
    icon(iconName, { size: 29, style: { flex: 'none', marginRight: '1rem', color } }),
    div({ style: { flex: 1 } }, [
      div({ style: { fontWeight: 'bold', color } }, [title]),
      div({ style: disabled ? { color: colors.dark(0.25) } : undefined }, [detail])
    ]),
    icon('angle-right', { size: 32, style: { flex: 'none', marginLeft: '1rem', color } })
  ])
}

const ResponseFragment = ({ title, snapshotResponses, responseIndex }) => {
  const { status, message } = snapshotResponses ? snapshotResponses[responseIndex] : {}
  const [color, iconKey, children] = Utils.switchCase(status,
    ['fulfilled', () => [colors.primary(), 'success-standard', h(Fragment, [strong(['Success: ']), 'Snapshot successfully imported'])]],
    ['rejected', () => [colors.danger(), 'warning-standard', h(Fragment, [strong(['Error: ']), message])]],
    [Utils.DEFAULT, () => [colors.primary(), 'success-standard']]
  )

  return h(Fragment, [
    icon(iconKey, { size: 18, style: { position: 'absolute', left: 0, color } }),
    title,
    children && div({ style: { color, fontWeight: 'normal', fontSize: '0.625rem', marginTop: 5, wordBreak: 'break-word' } }, [children])
  ])
}

export const ImportData = () => {
  const { workspaces, refresh: refreshWorkspaces, loading: loadingWorkspaces } = useWorkspaces()
  const [isImporting, setIsImporting] = useState(false)
  const { query: { url, format, ad, wid, template, snapshotId, snapshotName, snapshotIds, referrer, tdrmanifest, catalogDatasetId, tdrSyncPermissions } } = Nav.useRoute()
  const [mode, setMode] = useState(wid ? 'existing' : undefined)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCloneOpen, setIsCloneOpen] = useState(false)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(wid)
  const [selectedTemplateWorkspaceKey, setSelectedTemplateWorkspaceKey] = useState()
  const [allTemplates, setAllTemplates] = useState()
  const [userHasBillingProjects, setUserHasBillingProjects] = useState(true)

  const { dataCatalog } = useDataCatalog()
  const snapshots = _.flow(
    _.filter(snapshot => _.includes(snapshot['dct:identifier'], snapshotIds)),
    _.map(snapshot => ({ id: snapshot['dct:identifier'], title: snapshot['dct:title'], description: snapshot['dct:description'] }))
  )(dataCatalog)
  const [snapshotResponses, setSnapshotResponses] = useState()

  const isDataset = !_.includes(format, ['snapshot', 'tdrexport'])
  const noteMessage = 'Note that the import process may take some time after you are redirected into your destination workspace.'
  const [title, header] = Utils.cond(
    [referrer === 'data-catalog', () => ['Catalog', 'Linking data to a workspace']],
    [isDataset, () => ['Import Data', `Dataset ${snapshotName}`]],
    [Utils.DEFAULT, () => ['Import Snapshot', `Snapshot ${snapshotName}`]]
  )

  const selectedWorkspace = _.find({ workspace: { workspaceId: selectedWorkspaceId } }, workspaces)

  const filteredTemplates =
    _.flow(
      _.flatMap(id => (allTemplates && allTemplates[id]) || []),
      _.filter(({ name, namespace }) => _.some({ workspace: { namespace, name } }, workspaces))
    )(_.castArray(template))

  // Normalize the snapshot name:
  // Importing snapshot will throw an "enum" error if the name has any spaces or special characters
  // Replace all whitespace characters with _
  // Then replace all non alphanumeric characters with nothing
  const normalizeSnapshotName = input => _.flow(
    _.replace(/\s/g, '_'),
    _.replace(/[^A-Za-z0-9-_]/g, '')
  )(input)

  useOnMount(() => {
    const loadTemplateWorkspaces = _.flow(
      Utils.withBusyState(setIsImporting),
      withErrorReporting('Error loading initial data')
    )(async () => {
      const templates = await Ajax().FirecloudBucket.getTemplateWorkspaces()
      setAllTemplates(templates)
      const numProjects = await Ajax().Billing.listProjects().length
      setUserHasBillingProjects(numProjects > 0)
    })
    loadTemplateWorkspaces()
  })

  const onImport = _.flow(
    Utils.withBusyState(setIsImporting),
    withErrorReporting('Import Error')
  )(async workspace => {
    const { namespace, name } = workspace

    await Utils.switchCase(format,
      ['PFB', async () => {
        const { jobId } = await Ajax().Workspaces.workspace(namespace, name).importJob(url, 'pfb', null)
        asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }))
        notifyDataImportProgress(jobId)
      }],
      ['entitiesJson', async () => {
        await Ajax().Workspaces.workspace(namespace, name).importJSON(url)
        notify('success', 'Data imported successfully.', { timeout: 3000 })
      }],
      ['tdrexport', async () => {
        const { jobId } = await Ajax().Workspaces.workspace(namespace, name).importJob(tdrmanifest, 'tdrexport', { tdrSyncPermissions: tdrSyncPermissions === 'true' })
        asyncImportJobStore.update(Utils.append({ targetWorkspace: { namespace, name }, jobId }))
        notifyDataImportProgress(jobId)
      }],
      ['snapshot', async () => {
        if (!_.isEmpty(snapshots)) {
          const responses = await Promise.allSettled(
            _.map(({ title, id, description }) => {
              return Ajax().Workspaces.workspace(namespace, name).importSnapshot(id, normalizeSnapshotName(title), description)
            }, snapshots)
          )

          if (_.some({ status: 'rejected' }, responses)) {
            const normalizedResponses = await Promise.all(_.map(async ({ status, reason }) => {
              const reasonJson = await reason?.json()
              const { message } = JSON.parse(reasonJson?.message || '{}')
              return { status, message }
            }, responses))
            setSnapshotResponses(normalizedResponses)

            // Consolidate the multiple errors into a single error message
            const numFailures = _.flow(
              _.filter({ status: 'rejected' }),
              _.size
            )(normalizedResponses)
            throw new Error(`${numFailures} snapshot${numFailures > 1 ? 's' : ''} failed to import. See details in the "Linking to Workspace" section`)
          }
        } else {
          await Ajax().Workspaces.workspace(namespace, name).importSnapshot(snapshotId, normalizeSnapshotName(snapshotName))
          notify('success', 'Snapshot imported successfully.', { timeout: 3000 })
        }
      }],
      ['catalog', async () => {
        await Ajax().Catalog.exportDataset({ id: catalogDatasetId, workspaceId: workspace.workspaceId })
        notify('success', 'Catalog dataset imported successfully.', { timeout: 3000 })
      }],
      [Utils.DEFAULT, async () => {
        await Ajax().Workspaces.workspace(namespace, name).importBagit(url)
        notify('success', 'Data imported successfully.', { timeout: 3000 })
      }]
    )
    Ajax().Metrics.captureEvent(Events.workspaceDataImport, { format, ...extractWorkspaceDetails(workspace) })
    Nav.goToPath('workspace-data', { namespace, name })
  })

  const linkAccountPrompt = () => {
    return div({}, [
      div({ style: { marginTop: '1.5rem' } }, ['But first, to use Terra, you need to link Terra to a cloud account for compute and storage costs']),
      h(ButtonPrimary, { style: { marginTop: '.5rem', padding: '.75rem 3.5rem' }, href: '/billing' }, 'Get Started')
    ])
  }

  return h(FooterWrapper, [
    h(TopBar, { title }),
    div({ role: 'main', style: styles.container }, [
      backgroundLogo,
      div({ style: styles.card }, [
        h2({ style: styles.title }, [header]),
        !_.isEmpty(snapshots) ?
          div({ style: { marginTop: 20, marginBottom: 60 } }, [
            'Dataset(s):',
            ul({ style: { listStyle: 'none', position: 'relative', marginLeft: 0, paddingLeft: '2rem' } }, [
              _.flow(
                Utils.toIndexPairs,
                _.map(([mapindex, { title, id }]) => li({
                  key: `snapshot_${id}`,
                  style: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginTop: 20,
                    paddingTop: mapindex ? 20 : 0,
                    borderTop: `${mapindex ? 1 : 0}px solid #AAA`
                  }
                }, [
                  h(ResponseFragment, { snapshotResponses, responseIndex: mapindex, title })
                ])))(snapshots)
            ])
          ]) :
          url && div({ style: { fontSize: 16 } }, ['From: ', new URL(url).hostname]),
        div({ style: { marginTop: '1rem' } }, [
          `The ${isDataset ? 'dataset' : 'snapshot'}(s) you just chose to import to Terra will be made available to you `,
          'within a workspace of your choice where you can then perform analysis.'
        ])
      ]),
      div({ style: { ...styles.card, marginLeft: '2rem' } }, [
        Utils.switchCase(mode,
          ['existing', () => {
            return h(Fragment, [
              h2({ style: styles.title }, ['Start with an existing workspace']),
              h(IdContainer, [id => h(Fragment, [
                h(FormLabel, { htmlFor: id, style: { marginBottom: '0.25rem' } }, ['Select one of your workspaces']),
                h(WorkspaceSelector, {
                  id,
                  workspaces: _.filter(ws => {
                    return Utils.canWrite(ws.accessLevel) &&
                      (!ad || _.some({ membersGroupName: ad }, ws.workspace.authorizationDomain))
                  }, workspaces),
                  value: selectedWorkspaceId,
                  onChange: setSelectedWorkspaceId
                })
              ])]),
              isDataset && div({ style: { marginTop: '0.5rem', lineHeight: '1.5' } }, [noteMessage]),
              div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
                h(ButtonSecondary, { onClick: setMode, style: { marginLeft: 'auto' } }, ['Back']),
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
              h2({ style: styles.title }, ['Start with a template']),
              isDataset && div({ style: { marginBottom: '1rem', lineHeight: '1.5' } }, [noteMessage]),
              div({
                role: 'radiogroup',
                'aria-label': 'choose a template',
                style: { overflow: 'auto', maxHeight: '25rem' }
              }, [
                _.map(([i, ws]) => {
                  const { name, namespace, description, hasNotebooks, hasWorkflows } = ws
                  const isSelected = _.isEqual({ name, namespace }, selectedTemplateWorkspaceKey)

                  return div({
                    key: `${name}/${namespace}`,
                    style: {
                      display: 'flex', alignItems: 'baseline',
                      marginBottom: '1rem', paddingLeft: '0.25rem',
                      ...(i > 0 ? { borderTop: Style.standardLine, paddingTop: '1rem' } : {})
                    }
                  }, [
                    h(RadioButton, {
                      name: 'select-template',
                      checked: isSelected,
                      onChange: () => setSelectedTemplateWorkspaceKey({ namespace, name }),
                      text: h(Collapse, {
                        style: { fontSize: 14, marginLeft: '0.5rem' },
                        title: span({ style: { display: 'flex', alignItems: 'center' } }, [
                          span({ style: { fontWeight: 600 } }, [name]),
                          hasNotebooks && img({ src: jupyterLogo, style: { height: 23, width: 23, marginLeft: '0.5rem' } }),
                          hasWorkflows &&
                            wdlIcon({ style: { height: 23, width: 23, marginLeft: '0.5rem', borderRadius: 3, padding: '8px 4px 7px 4px' } })
                        ])
                      }, [p({ style: { fontSize: 14, lineHeight: '1.5', marginRight: '1rem' } }, [description])])
                    })
                  ]
                  )
                }, Utils.toIndexPairs(filteredTemplates))
              ]),
              div({ style: { display: 'flex', alignItems: 'center', marginTop: '1rem' } }, [
                h(ButtonSecondary, { style: { marginLeft: 'auto' }, onClick: setMode }, ['Back']),
                h(ButtonPrimary, {
                  style: { marginLeft: '2rem' },
                  disabled: !selectedTemplateWorkspaceKey,
                  onClick: () => setIsCloneOpen(true)
                }, ['Import'])
              ])
            ])
          }],
          [Utils.DEFAULT, () => {
            return h(Fragment, [
              h2({ style: styles.title }, ['Destination of the prepared data']),
              div({ style: { marginTop: '0.5rem' } }, ['Choose the option below that best suits your needs.']),
              div({ style: { fontWeight: '600', marginTop: '1.5rem', fontSize: '1rem', lineHeight: '1.5' } }, ['Stay in Terra and combine it with other data you have and use Terra tools for analyses']),
              !userHasBillingProjects && h(linkAccountPrompt),
              !!filteredTemplates.length && h(ChoiceButton, {
                onClick: () => setMode('template'),
                iconName: 'copySolid',
                title: 'Start with a template',
                detail: 'Clone from one of our template workspaces that has analyses ready for use'
              }),
              h(ChoiceButton, {
                onClick: () => setMode('existing'),
                iconName: 'fileSearchSolid',
                title: 'Start with an existing workspace',
                detail: 'Select one of your workspaces',
                disabled: !userHasBillingProjects
              }),
              h(ChoiceButton, {
                onClick: () => setIsCreateOpen(true),
                iconName: 'plus-circle',
                title: 'Start with a new workspace',
                detail: 'Set up an empty workspace that you will configure for analysis',
                'aria-haspopup': 'dialog',
                disabled: !userHasBillingProjects
              }),
              isCreateOpen && h(NewWorkspaceModal, {
                requiredAuthDomain: ad,
                customMessage: isDataset && noteMessage,
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
          cloneWorkspace: _.find({ workspace: selectedTemplateWorkspaceKey }, workspaces),
          title: `Clone ${selectedTemplateWorkspaceKey.name} and Import Data`,
          buttonText: 'Clone and Import',
          customMessage: isDataset && noteMessage,
          onDismiss: () => setIsCloneOpen(false),
          onSuccess: w => {
            setMode('existing')
            setIsCloneOpen(false)
            setSelectedWorkspaceId(w.workspaceId)
            refreshWorkspaces()
            onImport(w)
          }
        }),
        (isImporting || loadingWorkspaces) && spinnerOverlay
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
