import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h2, label } from 'react-hyperscript-helpers'
import { IdContainer, spinnerOverlay } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { icon } from 'src/components/icons'
import { ValidatedInput } from 'src/components/input'
import TopBar from 'src/components/TopBar'
import WDLViewer from 'src/components/WDLViewer'
import { WorkspaceImporter } from 'src/components/workspace-utils'
import importBackground from 'src/images/hex-import-background.svg'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { reportError, withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { workflowNameValidation } from 'src/libs/workflow-utils'
import validate from 'validate.js'


const styles = {
  container: {
    display: 'flex', alignItems: 'flex-start', flex: 'auto',
    backgroundImage: `url(${importBackground})`, backgroundRepeat: 'no-repeat',
    backgroundSize: '1825px', backgroundPosition: 'left 745px top -90px',
    position: 'relative', padding: '2rem'
  },
  title: {
    fontSize: 24, fontWeight: 600, color: colors.dark(), margin: '0 0 1rem 0'
  },
  card: {
    ...Style.elements.card.container, borderRadius: 8, padding: '2rem', flex: 1, minWidth: 0,
    boxShadow: '0 1px 5px 0 rgba(0,0,0,0.26), 0 2px 10px 0 rgba(0,0,0,0.16)'
  }
}

const DockstoreImporter = ({ path, version, source }) => {
  const [isBusy, setIsBusy] = useState(false)
  const [wdl, setWdl] = useState(undefined)
  const [workflowName, setWorkflowName] = useState('')

  const signal = useCancellation()

  const loadWdl = _.flow(
    withErrorReporting('Error loading WDL'),
    Utils.withBusyState(setIsBusy)
  )(async () => {
    const wdl = await Ajax(signal).Dockstore.getWdl({ path, version, isTool: source === 'dockstoretools' })
    setWdl(wdl)
    setWorkflowName(_.last(path.split('/')))
  })

  useOnMount(() => {
    loadWdl()
  })

  const doImport = Utils.withBusyState(setIsBusy, async workspace => {
    const { name, namespace } = workspace
    const eventData = { source, ...extractWorkspaceDetails(workspace) }

    try {
      const rawlsWorkspace = Ajax().Workspaces.workspace(namespace, name)
      const [entityMetadata, { outputs: workflowOutputs }] = await Promise.all([
        rawlsWorkspace.entityMetadata(),
        Ajax(signal).Methods.configInputsOutputs({
          methodRepoMethod: {
            methodPath: path,
            methodVersion: version,
            sourceRepo: source,
          }
        }),
      ])

      const defaultOutputConfiguration = _.flow(
        _.map(output => {
          const outputExpression = `this.${_.last(_.split('.', output.name))}`
          return [output.name, outputExpression]
        }),
        _.fromPairs
      )(workflowOutputs)

      await rawlsWorkspace.importMethodConfigFromDocker({
        namespace, name: workflowName, rootEntityType: _.head(_.keys(entityMetadata)),
        inputs: {}, outputs: defaultOutputConfiguration, prerequisites: {}, methodConfigVersion: 1, deleted: false,
        methodRepoMethod: {
          sourceRepo: source,
          methodPath: path,
          methodVersion: version
        }
      })
      Ajax().Metrics.captureEvent(Events.workflowImport, { ...eventData, success: true })
      Nav.goToPath('workflow', { namespace, name, workflowNamespace: namespace, workflowName })
    } catch (error) {
      reportError('Error importing workflow', error)
      Ajax().Metrics.captureEvent(Events.workflowImport, { ...eventData, success: false })
    }
  })

  const errors = (validate({ workflowName }, { workflowName: workflowNameValidation() }))

  return div({ style: styles.container }, [
    div({ style: { ...styles.card, maxWidth: 740 } }, [
      h2({ style: styles.title }, ['Importing from Dockstore']),
      div({ style: { fontSize: 18 } }, [path]),
      div({ style: { fontSize: 13, color: colors.dark() } }, [`V. ${version}`]),
      div({
        style: {
          display: 'flex', alignItems: 'center',
          margin: '1rem 0', color: colors.warning(2.35) // Just barely 4.5:1 contrast
        }
      }, [
        icon('warning-standard', { title: 'Warning', size: 32, style: { marginRight: '0.5rem', flex: 'none' } }),
        'Please note: Dockstore cannot guarantee that the WDL and Docker image referenced ',
        'by this Workflow will not change. We advise you to review the WDL before future runs.'
      ]),
      wdl && h(WDLViewer, { wdl, style: { height: 500 } })
    ]),
    div({ style: { ...styles.card, margin: '0 2.5rem', maxWidth: 430 } }, [
      h(IdContainer, [
        id => h(Fragment, [
          label({ htmlFor: id, style: { ...styles.title } }, 'Workflow Name'),
          h(ValidatedInput, {
            inputProps: {
              id,
              onChange: setWorkflowName,
              value: workflowName
            },
            error: Utils.summarizeErrors(errors)
          })
        ])
      ]),
      h(IdContainer, [
        id => h(Fragment, [
          label({ htmlFor: id, style: { ...styles.title, paddingTop: '2rem' } }, ['Destination Workspace']),
          h(WorkspaceImporter, { id, onImport: doImport, additionalErrors: errors })
        ])
      ]),
      isBusy && spinnerOverlay
    ])
  ])
}


const Importer = ({ source, item }) => {
  const [path, version] = item.split(':')

  return h(FooterWrapper, [
    h(TopBar, { title: 'Import Workflow' }),
    div({ role: 'main', style: { flexGrow: 1 } }, [
      Utils.cond(
        [source === 'dockstore' || source === 'dockstoretools', () => h(DockstoreImporter, { path, version, source })],
        () => `Unknown source '${source}'`
      )
    ])
  ])
}


export const navPaths = [
  {
    name: 'import-workflow',
    path: '/import-workflow/:source/:item(.*)',
    component: Importer,
    encode: _.identity,
    title: 'Import Workflow'
  }, {
    name: 'import-tool', // legacy
    path: '/import-tool/:source/:item(.*)',
    encode: _.identity,
    component: props => h(Nav.Redirector, { pathname: Nav.getPath('import-workflow', props) })
  }
]
