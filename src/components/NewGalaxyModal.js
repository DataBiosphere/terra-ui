import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, li, span, ul } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, Link, spinnerOverlay, WarningTitle } from 'src/components/common'
import { icon } from 'src/components/icons'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { GalaxyLaunchButton, GalaxyWarning } from 'src/components/runtime-common'
import TitleBar from 'src/components/TitleBar'
import { machineTypes } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { currentApp, getGalaxyCost } from 'src/libs/runtime-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


const styles = {
  whiteBoxContainer: { padding: '1rem', borderRadius: 3, backgroundColor: 'white' },
  drawerContent: { display: 'flex', flexDirection: 'column', flex: 'none', padding: '1.5rem' },
  headerText: { fontSize: 16, fontWeight: 600 }
}

export const NewGalaxyModal = _.flow(
  Utils.withDisplayName('NewGalaxyModal'),
  withModalDrawer({ width: 675 })
)(({ onDismiss, onSuccess, apps, workspace, workspace: { workspace: { namespace, bucketName, name: workspaceName } } }) => {
  const [viewMode, setViewMode] = useState(undefined)
  const [loading, setLoading] = useState(false)

  const app = currentApp(apps)
  const createGalaxy = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error creating app')
  )(async () => {
    await Ajax().Apps.app(namespace, Utils.generateKubernetesClusterName()).create({
      diskName: Utils.generatePersistentDiskName(), appType: 'GALAXY', namespace, bucketName, workspaceName
    })
    Ajax().Metrics.captureEvent(Events.applicationCreate, { app: 'Galaxy', ...extractWorkspaceDetails(workspace) })
    return onSuccess()
  })

  const deleteGalaxy = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error deleting galaxy instance')
  )(async () => {
    await Ajax().Apps.app(app.googleProject, app.appName).delete()
    Ajax().Metrics.captureEvent(Events.applicationDelete, { app: 'Galaxy', ...extractWorkspaceDetails(workspace) })
    return onSuccess()
  })

  const pauseGalaxy = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error deleting galaxy instance')
  )(async () => {
    Ajax().Metrics.captureEvent(Events.applicationPause, { app: 'Galaxy', ...extractWorkspaceDetails(workspace) })
    return onSuccess()
  })

  const renderActionButton = () => {
    return Utils.switchCase(viewMode,
      ['deleteWarn', () => {
        return h(ButtonPrimary, { onClick: () => deleteGalaxy() }, ['Delete'])
      }],
      ['createWarn', () => {
        return h(ButtonPrimary, { onClick: () => createGalaxy() }, ['Create'])
      }],
      ['launchWarn', () => {
        return h(GalaxyLaunchButton, { app, onClick: onDismiss })
      }],
      ['paused', () => {
        return h(Fragment, [
                           h(ButtonPrimary, { style: { marginRight: 'auto' }, onClick: () => setViewMode('deleteWarn') }, ['Delete']),
                           h(ButtonSecondary, { style: { marginRight: '1rem' }}, ['Resume'])
                         ])
      }],
      [Utils.DEFAULT, () => {
        return !!app ?
          h(Fragment, [
            h(ButtonSecondary, { style: { marginRight: 'auto' }, onClick: () => setViewMode('deleteWarn') }, ['Delete']),
            h(ButtonSecondary, { style: { marginRight: '1rem' }, onClick: () => setViewMode('paused')}, ['Pause']),
            h(ButtonPrimary, { onClick: () => setViewMode('launchWarn') }, ['Launch Galaxy'])
          ]) :
          h(ButtonPrimary, { onClick: () => setViewMode('createWarn') }, ['Next'])
      }]
    )
  }

  const renderCreateWarning = () => {
    return h(Fragment, [
      div({ style: { marginBottom: '1rem' } }, ['Environment will consist of an application and cloud compute.']),
      div({ style: { ...styles.whiteBoxContainer, backgroundColor: colors.accent(0.1), boxShadow: Style.standardShadow } }, [
        div({ style: { flex: '1', lineHeight: '1.5rem', minWidth: 0, display: 'flex' } }, [
          span({ style: { marginRight: '0.5rem', marginTop: '0.5rem' } }, [icon('info-circle', { size: 25, color: colors.accent() })]),
          div([
            span({ style: styles.headerText }, ['Set up duration']),
            div({ style: { lineHeight: 1.5 } }, [
              div(['Creating a cloud environment for Galaxy takes ', span({ style: { fontWeight: 600 } }, ['8-10 minutes.'])]),
              div(['You can navigate away, and we will notify you when it\'s ready. '])
            ]),
            div({ style: { ...styles.headerText, marginTop: '0.5rem' } }, ['Continuation cost']),
            div({ style: { lineHeight: 1.5 } }, [
              div(['Please delete the cloud environment when finished; it will']),
              div(['continue to ', span({ style: { fontWeight: 600 } }, ['incur charges ']), 'if it keeps running.'])
            ]),
            div({ style: { ...styles.headerText, marginTop: '0.5rem' } }, ['Pause and auto-pause']),
            div({ style: { lineHeight: 1.5 } }, [
              div(['You can pause anything during the compute, but it will auto-paused when']),
              div(['the instance is idled more than 1 hour if the analysis is done.'])
            ])
          ])
        ])
      ])
    ])
  }

  const renderDeleteWarning = () => {
    return div({ style: { lineHeight: '22px' } }, [
      div({ style: { marginTop: '0.5rem' } }, [
        'Deleting your Cloud Environment will also ',
        span({ style: { fontWeight: 600 } }, ['delete any files on the associated hard disk']),
        ' (e.g. results files). Double check that your workflow results were written to ',
        'the data tab in the workspace before clicking “Delete”'
      ]),
      div({ style: { marginTop: '1rem' } }, [
        'Deleting your Cloud Environment will stop your ',
        'running Galaxy application and your application costs. You can create a new Cloud Environment ',
        'for Galaxy later, which will take 8-10 minutes.'
      ])
    ])
  }



  const renderLaunchWarning = () => {
    return div({ style: { lineHeight: '22px' } }, [
      h(GalaxyWarning)
    ])
  }

  const renderPaused = () => {
    const { cpu, memory } = _.find({ name: 'n1-standard-8' }, machineTypes)
    const cost = getGalaxyCost(app || { kubernetesRuntimeConfig: { machineType: 'n1-standard-8', numNodes: 2 } })
    return h(Fragment, [
          div([`Cloud environment is now paused...`]),
          div({ style: { ...styles.whiteBoxContainer, marginTop: '1rem' } }, [
            div([
              div({ style: styles.headerText }, ['Environment Settings']),
              ul({ style: { paddingLeft: '1rem', lineHeight: 1.5 } }, [
                li({ style: { marginTop: '1rem' } }, [
                  'Galaxy version 20.09'
                ]),
                li({ style: { marginTop: '1rem' } }, [
                  'Cloud Compute size of ',
                  // Temporarily hard-coded disk size, once it can be customized this should be revisited
                  span({ style: { fontWeight: 600 } }, [`${cpu} CPUS, ${memory} GB of memory, 250 GB disk space`])
                ]),
                li({ style: { marginTop: '1rem' } }, [
                  'Estimated cost of cloud compute: ',
                  span({ style: { fontWeight: 600 } }, [Utils.formatUSD(cost), ' per hr'])
                ])
              ]),
              h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360050566271', ...Utils.newTabLinkProps }, [
                'Learn more about Galaxy interactive environments',
                icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
              ])
            ])
          ])
        ])
  }

  const renderDefaultCase = () => {
    const { cpu, memory } = _.find({ name: 'n1-standard-8' }, machineTypes)
    const cost = getGalaxyCost(app || { kubernetesRuntimeConfig: { machineType: 'n1-standard-8', numNodes: 2 } })
    return h(Fragment, [
      div([`Environment ${app ? 'consists' : 'will consist'} of an application and cloud compute.`]),
      div({ style: { ...styles.whiteBoxContainer, marginTop: '1rem' } }, [
        div([
          div({ style: styles.headerText }, ['Environment Settings']),
          ul({ style: { paddingLeft: '1rem', lineHeight: 1.5 } }, [
            li({ style: { marginTop: '1rem' } }, [
              'Galaxy version 20.09'
            ]),
            li({ style: { marginTop: '1rem' } }, [
              'Cloud Compute size of ',
              // Temporarily hard-coded disk size, once it can be customized this should be revisited
              span({ style: { fontWeight: 600 } }, [`${cpu} CPUS, ${memory} GB of memory, 250 GB disk space`])
            ]),
            li({ style: { marginTop: '1rem' } }, [
              'Estimated cost of cloud compute: ',
              span({ style: { fontWeight: 600 } }, [Utils.formatUSD(cost), ' per hr'])
            ])
          ]),
          h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360050566271', ...Utils.newTabLinkProps }, [
            'Learn more about Galaxy interactive environments',
            icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
          ])
        ])
      ])
    ])
  }

  return div({ style: styles.drawerContent }, [
    h(TitleBar, {
      title: Utils.switchCase(viewMode,
        ['launchWarn', () => h(WarningTitle, ['Launch Galaxy'])],
        ['deleteWarn', () => 'Delete Cloud Environment for Galaxy'],
        ['paused', () => 'Cloud environment is now pausing'],
        [Utils.DEFAULT, () => 'Cloud environment']
      ),
      style: { marginBottom: '0.5rem' },
      onDismiss,
      onPrevious: !!viewMode ? () => setViewMode(undefined) : undefined
    }),
    Utils.switchCase(viewMode,
      ['createWarn', renderCreateWarning],
      ['deleteWarn', renderDeleteWarning],
      ['launchWarn', renderLaunchWarning],
      ['paused', renderPaused],
      [Utils.DEFAULT, renderDefaultCase]
    ),
    div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' } }, [
      renderActionButton()
    ]),
    loading && spinnerOverlay
  ])
})
