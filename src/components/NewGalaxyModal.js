import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, label, span } from 'react-hyperscript-helpers'
import { ButtonPrimary, ButtonSecondary, IdContainer, Link, Select, spinnerOverlay, WarningTitle } from 'src/components/common'
import { icon } from 'src/components/icons'
import { NumberInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import { GalaxyLaunchButton, GalaxyWarning } from 'src/components/runtime-common'
import TitleBar from 'src/components/TitleBar'
import { machineTypes } from 'src/data/machines'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { withErrorReporting } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { currentApp, currentDataDisk, findMachineType, getGalaxyComputeCost, getGalaxyDiskCost } from 'src/libs/runtime-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'

// TODO Factor out common pieces with NewRuntimeModal.styles into runtime-utils
const styles = {
  label: { fontWeight: 600, whiteSpace: 'pre' },
  whiteBoxContainer: { padding: '1rem', borderRadius: 3, backgroundColor: 'white' },
  drawerContent: { display: 'flex', flexDirection: 'column', flex: 1, padding: '1.5rem' },
  headerText: { fontSize: 16, fontWeight: 600 }
}

const defaultDataDiskSize = 500 // GB
const defaultKubernetesRuntimeConfig = { machineType: 'n1-highmem-8', numNodes: 1, autoscalingEnabled: false }
const maxNodepoolSize = 1000 // per zone according to https://cloud.google.com/kubernetes-engine/quotas

// Removing low cpu/memory options based on the Galaxy team's suggestions
const validMachineTypes = _.filter(({ cpu, memory }) => cpu >= 4 && memory >= 52, machineTypes)

export const NewGalaxyModal = _.flow(
  Utils.withDisplayName('NewGalaxyModal'),
  withModalDrawer({ width: 675 })
)(({ onDismiss, onSuccess, apps, galaxyDataDisks, workspace, workspace: { workspace: { namespace, bucketName, name: workspaceName } } }) => {
  // Assumption: If there is an app defined, there must be a data disk corresponding to it.
  const app = currentApp(apps)
  const dataDisk = currentDataDisk(app, galaxyDataDisks)

  const [dataDiskSize, setDataDiskSize] = useState(dataDisk?.size || defaultDataDiskSize)
  const [kubernetesRuntimeConfig, setKubernetesRuntimeConfig] = useState(app?.kubernetesRuntimeConfig || defaultKubernetesRuntimeConfig)
  const [viewMode, setViewMode] = useState(undefined)
  const [loading, setLoading] = useState(false)

  const createGalaxy = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error creating app')
  )(async () => {
    await Ajax().Apps.app(namespace, Utils.generateKubernetesClusterName()).create({
      kubernetesRuntimeConfig, diskName: Utils.generatePersistentDiskName(), diskSize: dataDiskSize, appType: 'GALAXY', namespace, bucketName, workspaceName
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
    withErrorReporting('Error stopping galaxy instance')
  )(async () => {
    await Ajax().Apps.app(app.googleProject, app.appName).pause()
    Ajax().Metrics.captureEvent(Events.applicationPause, { app: 'Galaxy', ...extractWorkspaceDetails(workspace) })
    return onSuccess()
  })

  const resumeGalaxy = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReporting('Error starting galaxy instance')
  )(async () => {
    await Ajax().Apps.app(app.googleProject, app.appName).resume()
    Ajax().Metrics.captureEvent(Events.applicationResume, { app: 'Galaxy', ...extractWorkspaceDetails(workspace) })
    return onSuccess()
  })

  const renderActionButton = () => {
    const deleteButton = h(ButtonSecondary, { disabled: false, style: { marginRight: 'auto' }, onClick: () => setViewMode('deleteWarn') }, ['Delete'])
    const pauseButton = h(ButtonSecondary, { disabled: false, style: { marginRight: '1rem' }, onClick: () => { pauseGalaxy() } }, ['Pause'])
    const resumeButton = h(ButtonSecondary, { disabled: false, style: { marginRight: '1rem' }, onClick: resumeGalaxy }, ['Resume'])

    return Utils.switchCase(viewMode,
      ['deleteWarn', () => {
        return h(ButtonPrimary, { onClick: deleteGalaxy }, ['Delete'])
      }],
      ['createWarn', () => {
        return h(ButtonPrimary, { onClick: createGalaxy }, ['Create'])
      }],
      ['launchWarn', () => {
        return h(GalaxyLaunchButton, { app, onClick: onDismiss })
      }],
      ['paused', () => {
        return h(Fragment, [
          deleteButton,
          resumeButton
        ])
      }],
      [Utils.DEFAULT, () => !app ?
        h(ButtonPrimary, { disabled: false, onClick: () => setViewMode('createWarn') }, ['Next']) :
        Utils.switchCase(app.status,
          ['RUNNING', () => h(Fragment, [
            deleteButton,
            pauseButton,
            h(ButtonPrimary, { disabled: false, onClick: () => setViewMode('launchWarn') }, ['Launch Galaxy'])
          ])],
          ['STOPPED', () => h(Fragment, [
            h(ButtonSecondary, { disabled: true, style: { marginRight: 'auto' }, tooltip: 'Cloud Compute must be resumed first.', onClick: () => setViewMode('deleteWarn') }, ['Delete']),
            resumeButton
          ])],
          ['ERROR', () => deleteButton],
          [Utils.DEFAULT, () => {
            return h(Fragment, { tooltip: 'Cloud Compute must be resumed first.' }, [
              h(ButtonSecondary, { disabled: true, style: { marginRight: 'auto' }, tooltip: 'Cloud Compute must be running.', onClick: () => setViewMode('deleteWarn') }, ['Delete']),
              h(ButtonSecondary, { disabled: true, style: { marginRight: '1rem' }, tooltip: 'Cloud Compute must be running.', onClick: () => { pauseGalaxy() } }, ['Pause'])
            ])
          }]
        )]
    )
  }

  const renderMessaging = () => {
    return Utils.switchCase(viewMode,
      ['createWarn', renderCreateWarning],
      ['deleteWarn', renderDeleteWarning],
      ['launchWarn', renderLaunchWarning],
      [Utils.DEFAULT, renderDefaultCase]
    )
  }

  const renderCreateWarning = () => {
    return h(Fragment, [
      h(TitleBar, {
        title: 'Cloud Environment',
        style: { marginBottom: '0.5rem' },
        onDismiss,
        onPrevious: !!viewMode ? () => setViewMode(undefined) : undefined
      }),
      div({ style: { marginBottom: '1rem' } }, ['Cloud environments consist of application configuration, cloud compute and persistent disk(s).']),
      div({ style: { ...styles.whiteBoxContainer, backgroundColor: colors.accent(0.1), boxShadow: Style.standardShadow } }, [
        div({ style: { flex: '1', lineHeight: '1.5rem', minWidth: 0, display: 'flex' } }, [
          span({ style: { marginRight: '0.5rem', marginTop: '0.5rem' } }, [icon('clockSolid', { size: 25, color: colors.accent() })]),
          div([
            div({ style: { ...styles.headerText, marginTop: '0.5rem' } }, ['Set up duration']),
            div({ style: { lineHeight: 1.5 } }, [
              div(['Creating a cloud environment for Galaxy takes ', span({ style: { fontWeight: 600 } }, ['8-10 minutes.'])]),
              div(['You can navigate away, and we will notify you when it\'s ready. '])
            ])
          ])
        ]),
        div({ style: { flex: '1', lineHeight: '1.5rem', minWidth: 0, display: 'flex' } }, [
          span({ style: { marginRight: '0.5rem', marginTop: '0.5rem' } }, [icon('money-check-alt', { size: 25, color: colors.accent() })]),
          div([
            div({ style: { ...styles.headerText, marginTop: '0.5rem' } }, ['Continuation cost']),
            div({ style: { lineHeight: 1.5 } }, [
              div(['Please delete the cloud environment when finished; it will']),
              div(['continue to ', span({ style: { fontWeight: 600 } }, ['incur charges ']), 'if it keeps running.'])
            ])
          ])
        ]),
        div({ style: { flex: '1', lineHeight: '1.5rem', minWidth: 0, display: 'flex' } }, [
          span({ style: { marginRight: '0.5rem', marginTop: '0.5rem' } }, [icon('pause', { size: 25, color: colors.accent() })]),
          div([
            div({ style: { ...styles.headerText, marginTop: '0.5rem' } }, ['Pause and auto-pause']),
            div({ style: { lineHeight: 1.5 } }, [
              div(['You can pause  during the compute, but it will auto-pause when']),
              div(['the instance is idle more than 1 hour if the analysis is done.'])
            ])
          ])
        ]),
        div({ style: { flex: '1', lineHeight: '1.5rem', minWidth: 0, display: 'flex' } }, [
          span({ style: { marginRight: '0.5rem', marginTop: '0.5rem' } }, [icon('cog', { size: 25, color: colors.accent() })]),
          div([
            div({ style: { ...styles.headerText, marginTop: '0.5rem' } }, ['Environment updates']),
            div({ style: { lineHeight: 1.5 } }, [
              div(['If you would like to update your compute or disk configuration']),
              div(['after an app is created, please delete the app and create a new']),
              div(['app with the desired configuration.'])
            ])
          ])
        ])
      ])
    ])
  }

  const renderDeleteWarning = () => {
    return h(Fragment, [
      h(TitleBar, {
        title: 'Delete Cloud Environment for Galaxy',
        style: { marginBottom: '0.5rem' },
        onDismiss,
        onPrevious: !!viewMode ? () => setViewMode(undefined) : undefined
      }),
      div({ style: { lineHeight: '22px' } }, [
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
    ])
  }

  const renderLaunchWarning = () => {
    return h(Fragment, [
      h(TitleBar, {
        title: h(WarningTitle, ['Launch Galaxy']),
        style: { marginBottom: '0.5rem' },
        onDismiss,
        onPrevious: !!viewMode ? () => setViewMode(undefined) : undefined
      }),
      div({ style: { lineHeight: '22px' } }, [
        h(GalaxyWarning)
      ])
    ])
  }

  const getEnvMessageBasedOnStatus = app => {
    const waitMessage = 'This process will take up to a few minutes.'
    const nonStatusSpecificMessage = 'A cloud environment consists of application configuration, cloud compute and persistent disk(s).'

    return !app ?
      nonStatusSpecificMessage :
      Utils.switchCase(app.status,
        ['STOPPED', () => `The cloud compute is paused.`],
        ['PRESTOPPING', () => 'The cloud compute is preparing to pause.'],
        ['STOPPING', () => `The cloud compute is pausing. ${waitMessage}`],
        ['PRESTARTING', () => 'The cloud compute is preparing to resume.'],
        ['STARTING', () => `The cloud compute is resuming. ${waitMessage}`],
        ['RUNNING', () => nonStatusSpecificMessage],
        ['ERROR', () => `An error has occurred on your cloud environment.`]
      )
  }

  // TODO Refactor this and the duplicate in NewRuntimeModal.js
  const renderGalaxyCostBreakdown = (kubernetesRuntimeConfig, dataDiskSize) => {
    const runningComputeCost = getGalaxyComputeCost({ status: 'RUNNING', kubernetesRuntimeConfig })
    const pausedComputeCost = getGalaxyComputeCost({ status: 'STOPPED', kubernetesRuntimeConfig })

    return div({
      style: {
        backgroundColor: colors.accent(0.2),
        display: 'flex',
        borderRadius: 5,
        padding: '0.5rem 1rem',
        marginTop: '1rem'
      }
    }, [
      _.map(({ cost, label, unitLabel }) => {
        return div({ key: label, style: { flex: 1, ...styles.label } }, [
          div({ style: { fontSize: 10 } }, [label]),
          div({ style: { color: colors.accent(), marginTop: '0.25rem' } }, [
            span({ style: { fontSize: 20 } }, [cost]),
            span([' ', unitLabel])
          ])
        ])
      }, [
        { label: 'Running cloud compute cost', cost: Utils.formatUSD(runningComputeCost), unitLabel: 'per hr' },
        { label: 'Paused cloud compute cost', cost: Utils.formatUSD(pausedComputeCost), unitLabel: 'per hr' },
        { label: 'Persistent disk cost', cost: Utils.formatUSD(getGalaxyDiskCost(dataDiskSize)), unitLabel: 'per hr' }
      ])
    ])
  }

  const renderCloudComputeProfileSection = () => {
    const gridStyle = { display: 'grid', gridTemplateColumns: '0.75fr 4.5rem 1fr 5.5rem 1fr 5.5rem', gridGap: '2rem', alignItems: 'center' }
    return div({ style: { ...styles.whiteBoxContainer, marginTop: '1rem' } }, [
      div({ style: styles.headerText }, ['Cloud compute profile']),
      div({ style: { ...gridStyle, marginTop: '0.75rem' } }, [
        h(MachineSelector, { value: kubernetesRuntimeConfig, onChange: v => setKubernetesRuntimeConfig(v) })
      ])
    ])
  }

  const renderPersistentDiskSection = () => {
    const gridStyle = { display: 'grid', gridTemplateColumns: '0.75fr 4.5rem 1fr 5.5rem 1fr 5.5rem', gridGap: '1rem', alignItems: 'center' }
    return div({ style: { ...styles.whiteBoxContainer, marginTop: '1rem' } }, [
      div({ style: styles.headerText }, ['Persistent disk']),
      div({ style: { marginTop: '0.5rem' } }, [
        'Persistent disks store analysis data.'
        // TODO Add info on PDs for Galaxy (similarly to in NewRuntimeModal.js)
      ]),
      div({ style: { ...gridStyle, marginTop: '0.75rem' } }, [
        h(IdContainer, [
          id => h(Fragment, [
            label({ htmlFor: id, style: styles.label }, ['Size (GB)']),
            div([
              h(NumberInput, {
                id,
                min: 250, // Galaxy doesn't come up with a smaller data disk
                max: 64000,
                isClearable: false,
                onlyInteger: true,
                value: dataDiskSize,
                style: { marginTop: '0.5rem', width: '5rem' },
                onChange: v => setDataDiskSize(v)
              })
            ])
          ])
        ])
      ])
    ])
  }

  const renderDefaultCase = () => {
    return h(Fragment, [
      h(TitleBar, {
        title: 'Cloud Environment',
        style: { marginBottom: '0.5rem' },
        onDismiss,
        onPrevious: !!viewMode ? () => setViewMode(undefined) : undefined
      }),
      div([
        getEnvMessageBasedOnStatus(app)
      ]),
      div({ style: { paddingBottom: '1.5rem', borderBottom: `1px solid ${colors.dark(0.4)}` } }, [
        renderGalaxyCostBreakdown(kubernetesRuntimeConfig, dataDiskSize)
      ]),
      div({ style: { ...styles.whiteBoxContainer, marginTop: '1rem' } }, [
        div([
          div({ style: styles.headerText }, ['Application configuration']),
          div({ style: { marginTop: '0.5rem' } }, ['Galaxy version 21.01']),
          h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360050566271', ...Utils.newTabLinkProps }, [
            'Learn more about Galaxy interactive environments',
            icon('pop-out', { size: 12, style: { marginTop: '1rem', marginLeft: '0.25rem' } })
          ])
        ])
      ]),
      renderCloudComputeProfileSection(),
      renderPersistentDiskSection()
    ])
  }

  return div({ style: styles.drawerContent }, [
    renderMessaging(),
    div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' } }, [
      renderActionButton()
    ]),
    loading && spinnerOverlay
  ])
})

const MachineSelector = ({ value, onChange }) => {
  const { cpu: currentCpu, memory: currentMemory } = findMachineType(value.machineType)
  return h(Fragment, [
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: styles.label }, ['Nodes']),
        div([
          h(NumberInput, {
            id,
            min: 1,
            max: maxNodepoolSize,
            isClearable: false,
            onlyInteger: true,
            value: value.numNodes,
            onChange: n => onChange(prevState => { return { ...prevState, numNodes: n } })
          })
        ])
      ])
    ]),
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: styles.label }, ['CPUs']),
        div([
          h(Select, {
            id,
            isSearchable: false,
            value: currentCpu,
            onChange: option => {
              const validMachineType = _.find({ cpu: option.value }, validMachineTypes)?.name || value.machineType
              onChange(prevState => { return { ...prevState, machineType: validMachineType } })
            },
            options: _.flow(_.map('cpu'), _.union([currentCpu]), _.sortBy(_.identity))(validMachineTypes)
          })
        ])
      ])
    ]),
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: styles.label }, ['Memory (GB)']),
        div([
          h(Select, {
            id,
            isSearchable: false,
            value: currentMemory,
            onChange: option => {
              const validMachineType = _.find({ cpu: currentCpu, memory: option.value }, validMachineTypes)?.name || value.machineType
              onChange(prevState => { return { ...prevState, machineType: validMachineType } })
            },
            options: _.flow(_.filter({ cpu: currentCpu }), _.map('memory'), _.union([currentMemory]), _.sortBy(_.identity))(validMachineTypes)
          })
        ])
      ])
    ])
  ])
}
