import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, label, p, span } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, ButtonSecondary, IdContainer, Link, Select, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { NumberInput } from 'src/components/input'
import { withModalDrawer } from 'src/components/ModalDrawer'
import TitleBar from 'src/components/TitleBar'
import TooltipTrigger from 'src/components/TooltipTrigger'
import { machineTypes } from 'src/data/gce-machines'
import { Ajax } from 'src/libs/ajax'
import { pdTypes } from 'src/libs/ajax/leonardo/models/disk-models'
import colors from 'src/libs/colors'
import { withErrorReportingInModal } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { withDisplayName } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'
import { WarningTitle } from 'src/pages/workspaces/workspace/analysis/modals/WarningTitle'
import { GalaxyLaunchButton, GalaxyWarning, RadioBlock, SaveFilesHelpGalaxy } from 'src/pages/workspaces/workspace/analysis/runtime-common-components'
import { getCurrentApp } from 'src/pages/workspaces/workspace/analysis/utils/app-utils'
import { getGalaxyComputeCost, getGalaxyDiskCost } from 'src/pages/workspaces/workspace/analysis/utils/cost-utils'
import {
  getCurrentAppDataDisk,
  getCurrentAttachedDataDisk
} from 'src/pages/workspaces/workspace/analysis/utils/disk-utils'
import {
  findMachineType
} from 'src/pages/workspaces/workspace/analysis/utils/runtime-utils'
import { appTools } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'

import { computeStyles } from './modalStyles'


const defaultDataDisk = { size: 500, diskType: pdTypes.standard }
const defaultKubernetesRuntimeConfig = { machineType: 'n1-highmem-8', numNodes: 1, autoscalingEnabled: false }
const maxNodepoolSize = 1000 // per zone according to https://cloud.google.com/kubernetes-engine/quotas

// Removing low cpu/memory options based on the Galaxy team's suggestions
const validMachineTypes = _.filter(({ cpu, memory }) => cpu >= 4 && memory >= 52, machineTypes)
const titleId = 'galaxy-modal-title'

export const GalaxyModalBase = withDisplayName('GalaxyModal')(
  ({
    onDismiss, onError, onSuccess, apps, appDataDisks, workspace, workspace: { workspace: { namespace, bucketName, name: workspaceName, googleProject } }, shouldHideCloseButton = true
  }) => {
    // Assumption: If there is an app defined, there must be a data disk corresponding to it.
    const app = getCurrentApp(appTools.GALAXY.label, apps)
    const attachedDataDisk = getCurrentAttachedDataDisk(app, appDataDisks)

    const [dataDisk, setDataDisk] = useState(attachedDataDisk || defaultDataDisk)
    const [kubernetesRuntimeConfig, setKubernetesRuntimeConfig] = useState(app?.kubernetesRuntimeConfig || defaultKubernetesRuntimeConfig)
    const [viewMode, setViewMode] = useState(undefined)
    const [loading, setLoading] = useState(false)
    const [shouldDeleteDisk, setShouldDeleteDisk] = useState(false)

    const currentDataDisk = getCurrentAppDataDisk(appTools.GALAXY.label, apps, appDataDisks, workspaceName)
    const updateDataDisk = _.curry((key, value) => setDataDisk(_.set(key, value)))

    const createGalaxy = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReportingInModal('Error creating app', onError)
    )(async () => {
      await Ajax().Apps.app(googleProject, Utils.generateAppName()).create({
        kubernetesRuntimeConfig, diskName: !!currentDataDisk ? currentDataDisk.name : Utils.generatePersistentDiskName(), diskSize: dataDisk.size,
        diskType: dataDisk.diskType.label, appType: appTools.GALAXY.label, namespace, bucketName, workspaceName
      })
      Ajax().Metrics.captureEvent(Events.applicationCreate, { app: 'Galaxy', ...extractWorkspaceDetails(workspace) })
      return onSuccess()
    })

    const deleteGalaxy = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReportingInModal('Error deleting galaxy instance', onError)
    )(async () => {
      await Ajax().Apps.app(app.cloudContext.cloudResource, app.appName).delete(attachedDataDisk ? shouldDeleteDisk : false)
      Ajax().Metrics.captureEvent(Events.applicationDelete, { app: 'Galaxy', ...extractWorkspaceDetails(workspace) })
      return onSuccess()
    })

    const pauseGalaxy = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReportingInModal('Error stopping galaxy instance', onError)
    )(async () => {
      await Ajax().Apps.app(app.cloudContext.cloudResource, app.appName).pause()
      Ajax().Metrics.captureEvent(Events.applicationPause, { app: 'Galaxy', ...extractWorkspaceDetails(workspace) })
      return onSuccess()
    })

    const resumeGalaxy = _.flow(
      Utils.withBusyState(setLoading),
      withErrorReportingInModal('Error starting galaxy instance', onError)
    )(async () => {
      await Ajax().Apps.app(app.cloudContext.cloudResource, app.appName).resume()
      Ajax().Metrics.captureEvent(Events.applicationResume, { app: 'Galaxy', ...extractWorkspaceDetails(workspace) })
      return onSuccess()
    })

    const renderActionButton = () => {
      const deleteButton = h(ButtonOutline, { disabled: false, style: { marginRight: 'auto' }, onClick: () => setViewMode('deleteWarn') },
        ['Delete Environment'])
      const pauseButton = h(ButtonSecondary, { disabled: false, style: { marginRight: '1rem' }, onClick: pauseGalaxy }, ['Pause'])
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
              h(ButtonPrimary, { disabled: false, onClick: () => setViewMode('launchWarn') }, ['Open Galaxy'])
            ])],
            ['STOPPED', () => h(Fragment, [
              h(ButtonOutline, {
                disabled: true, style: { marginRight: 'auto' }, tooltip: 'Cloud Compute must be resumed first.',
                onClick: () => setViewMode('deleteWarn')
              }, ['Delete Environment']),
              resumeButton
            ])],
            ['ERROR', () => deleteButton],
            [Utils.DEFAULT, () => {
              return h(Fragment, [
                h(ButtonOutline, {
                  disabled: true, style: { marginRight: 'auto' }, tooltip: 'Cloud Compute must be running.', onClick: () => setViewMode('deleteWarn')
                }, ['Delete Environment']),
                h(ButtonSecondary,
                  { disabled: true, style: { marginRight: '1rem' }, tooltip: 'Cloud Compute must be running.', onClick: pauseGalaxy },
                  ['Pause'])
              ])
            }]
          )]
      )
    }

    const renderMessaging = () => {
      return Utils.switchCase(viewMode,
        ['createWarn', renderCreateWarning],
        ['deleteWarn', renderDeleteDiskChoices],
        ['launchWarn', renderLaunchWarning],
        [Utils.DEFAULT, renderDefaultCase]
      )
    }

    const renderCreateWarning = () => {
      return div({ style: computeStyles.drawerContent }, [
        h(TitleBar, {
          id: titleId,
          title: 'Galaxy Cloud Environment',
          style: { marginBottom: '0.5rem' },
          hideCloseButton: shouldHideCloseButton,
          onDismiss,
          onPrevious: !!viewMode ? () => setViewMode(undefined) : undefined
        }),
        div({ style: { marginBottom: '1rem' } }, ['Cloud environments consist of application configuration, cloud compute and persistent disk(s).']),
        div({ style: { ...computeStyles.whiteBoxContainer, backgroundColor: colors.accent(0.1), boxShadow: Style.standardShadow } }, [
          div({ style: { flex: '1', lineHeight: '1.5rem', minWidth: 0, display: 'flex' } }, [
            span({ style: { marginRight: '0.5rem', marginTop: '0.5rem' } }, [icon('clockSolid', { size: 25, color: colors.accent() })]),
            div([
              div({ style: { ...computeStyles.headerText, marginTop: '0.5rem' } }, ['Setup duration']),
              div({ style: { lineHeight: 1.5 } }, [
                div(['Creating a cloud environment for Galaxy takes ', span({ style: { fontWeight: 600 } }, ['8-10 minutes.'])]),
                div(['You can navigate away, and we will notify you when it\'s ready. '])
              ])
            ])
          ]),
          div({ style: { flex: '1', lineHeight: '1.5rem', minWidth: 0, display: 'flex' } }, [
            span({ style: { marginRight: '0.5rem', marginTop: '0.5rem' } }, [icon('money-check-alt', { size: 25, color: colors.accent() })]),
            div([
              div({ style: { ...computeStyles.headerText, marginTop: '0.5rem' } }, ['Continuation cost']),
              div({ style: { lineHeight: 1.5 } }, [
                div(['Please pause or delete the cloud environment when finished; it will']),
                div(['continue to ', span({ style: { fontWeight: 600 } }, ['incur charges ']), 'if it keeps running. Please see the subsection']),
                h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360050566271', ...Utils.newTabLinkProps }, [
                  'Pausing/Resuming a Galaxy instance.',
                  icon('pop-out', { size: 12, style: { marginTop: '0.5rem', marginLeft: '0.25rem' } })
                ])
              ])
            ])
          ]),
          div({ style: { flex: '1', lineHeight: '1.5rem', minWidth: 0, display: 'flex' } }, [
            span({ style: { marginRight: '0.5rem', marginTop: '0.5rem' } }, [icon('cog', { size: 25, color: colors.accent() })]),
            div([
              div({ style: { ...computeStyles.headerText, marginTop: '0.5rem' } }, ['Environment updates']),
              div({ style: { lineHeight: 1.5 } }, [
                div(['If you would like to update your compute or disk configuration']),
                div(['after an environment is created, please delete the environment and']),
                div(['create a new environment with the desired configuration.'])
              ])
            ])
          ])
        ]),
        div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' } }, [
          renderActionButton()
        ])
      ])
    }

    const renderLaunchWarning = () => {
      return div({ style: computeStyles.drawerContent }, [
        h(TitleBar, {
          id: titleId,
          title: h(WarningTitle, ['Open Galaxy']),
          hideCloseButton: shouldHideCloseButton,
          style: { marginBottom: '0.5rem' },
          onDismiss,
          onPrevious: !!viewMode ? () => setViewMode(undefined) : undefined
        }),
        div({ style: { lineHeight: '22px' } }, [
          h(GalaxyWarning)
        ]),
        div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' } }, [
          renderActionButton()
        ])
      ])
    }

    const getEnvMessageBasedOnStatus = app => {
      const waitMessage = 'This process will take up to a few minutes.'
      const nonStatusSpecificMessage = 'A cloud environment consists of application configuration, cloud compute and persistent disk(s).'

      return !app ?
        nonStatusSpecificMessage :
        Utils.switchCase(app.status,
          ['STOPPED', () => 'The cloud compute is paused.'],
          ['PRESTOPPING', () => 'The cloud compute is preparing to pause.'],
          ['STOPPING', () => `The cloud compute is pausing. ${waitMessage}`],
          ['PRESTARTING', () => 'The cloud compute is preparing to resume.'],
          ['STARTING', () => `The cloud compute is resuming. ${waitMessage}`],
          ['RUNNING', () => nonStatusSpecificMessage],
          ['ERROR', () => 'An error has occurred on your cloud environment.']
        )
    }

    // TODO Refactor this and the duplicate in ComputeModal.js
    const renderGalaxyCostBreakdown = (kubernetesRuntimeConfig, dataDisk) => {
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
          return div({ key: label, style: { flex: 1, ...computeStyles.label } }, [
            div({ style: { fontSize: 10 } }, [label]),
            div({ style: { color: colors.accent(), marginTop: '0.25rem' } }, [
              span({ style: { fontSize: 20 } }, [cost]),
              span([' ', unitLabel])
            ])
          ])
        }, [
          { label: 'Running cloud compute cost', cost: Utils.formatUSD(runningComputeCost), unitLabel: 'per hr' },
          { label: 'Paused cloud compute cost', cost: Utils.formatUSD(pausedComputeCost), unitLabel: 'per hr' },
          { label: 'Persistent disk cost', cost: Utils.formatUSD(getGalaxyDiskCost(dataDisk)), unitLabel: 'per hr' }
        ])
      ])
    }

    const renderComputeProfileSection = () => {
      const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(6, auto)', gridGap: '0.75rem', alignItems: 'center', justifyContent: 'flex-start' }
      return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
        div({ style: computeStyles.headerText }, ['Cloud compute profile']),
        div({ style: { ...gridStyle, marginTop: '0.75rem' } }, [
          h(MachineSelector, { value: kubernetesRuntimeConfig, onChange: v => setKubernetesRuntimeConfig(v) })
        ])
      ])
    }

    const renderPersistentDiskSection = () => {
      return div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
        div({ style: computeStyles.headerText }, ['Persistent disk']),
        div({ style: { marginTop: '0.5rem' } }, [
          'Persistent disks store analysis data. ',
          h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360050566271', ...Utils.newTabLinkProps }, [
            'Learn more about persistent disks',
            icon('pop-out', { size: 12, style: { marginLeft: '0.25rem' } })
          ])
        ]),
        renderPersistentDiskConfigSection()
      ])
    }

    const renderPersistentDiskConfigSection = () => {
      const gridStyle = { display: 'grid', gridTemplateColumns: '0.75fr 4.5rem 1fr 5.5rem 1fr 5.5rem', gridGap: '0.75rem', alignItems: 'center' }
      return Utils.cond(
        [currentDataDisk, () => {
          return div({ style: { ...gridStyle, gridGap: '1rem', gridTemplateColumns: '15rem 4.5rem', marginTop: '0.75rem' } }, [
            h(TooltipTrigger, { content: ['Disk type can only be selected at creation time.'], side: 'bottom' }, [
              renderPersistentDiskType(true)
            ]),
            h(TooltipTrigger, { content: ['Disk size can only be selected at creation time.'], side: 'bottom' }, [
              renderPersistentDiskSize(true)
            ])
          ])
        }],
        () => {
          return div({ style: { ...gridStyle, gridGap: '1rem', gridTemplateColumns: '15rem 4.5rem', marginTop: '0.75rem' } }, [
            h(Fragment, [
              renderPersistentDiskType(false),
              renderPersistentDiskSize(false)
            ])

          ])
        })
    }

    const renderPersistentDiskType = disabled => h(div, [
      h(IdContainer, [
        id => h(Fragment, [
          label({ htmlFor: id, style: computeStyles.label }, ['Disk Type']),
          div({ style: { marginTop: '0.5rem' } }, [
            h(Select, {
              id,
              value: disabled ? currentDataDisk.diskType : dataDisk.diskType,
              isDisabled: disabled,
              onChange: ({ value }) => updateDataDisk('diskType', value),
              menuPlacement: 'auto',
              options: [
                { label: pdTypes.standard.displayName, value: pdTypes.standard },
                { label: pdTypes.balanced.displayName, value: pdTypes.balanced },
                { label: pdTypes.ssd.displayName, value: pdTypes.ssd }
              ]
            })
          ])
        ])
      ])
    ])

    const renderPersistentDiskSize = disabled => div([
      h(IdContainer, [
        id => h(Fragment, [
          label({ htmlFor: id, style: computeStyles.label }, ['Size (GB)']),
          h(NumberInput, {
            id,
            min: 250, // Galaxy doesn't come up with a smaller data disk
            max: 64000,
            isClearable: false,
            disabled,
            onlyInteger: true,
            style: { marginTop: '0.5rem' },
            value: disabled ? currentDataDisk.size : dataDisk.size,
            onChange: updateDataDisk('size')
          })
        ])
      ])
    ])

    const renderDeleteDiskChoices = () => {
      return div({ style: { ...computeStyles.drawerContent, ...computeStyles.warningView } }, [
        h(TitleBar, {
          id: titleId,
          style: computeStyles.titleBar,
          hideCloseButton: shouldHideCloseButton,
          title: h(WarningTitle, ['Delete environment']),
          onDismiss,
          onPrevious: () => {
            setViewMode(undefined)
            setShouldDeleteDisk(false)
          }
        }),
        div({ style: { lineHeight: '1.5rem' } }, [
          h(Fragment, [
            h(RadioBlock, {
              name: 'keep-persistent-disk',
              labelText: 'Keep persistent disk, delete application configuration and compute profile',
              checked: !shouldDeleteDisk,
              onChange: () => setShouldDeleteDisk(false),
              style: { marginTop: '1rem' }
            }, [
              p([
                'Deletes your application configuration and cloud compute profile, but detaches your persistent disk and saves it for later. ',
                'The disk will be automatically reattached the next time you create a Galaxy application.'
              ]),
              p({ style: { marginBottom: 0 } }, [
                'You will continue to incur persistent disk cost at ',
                span({ style: { fontWeight: 600 } }, [Utils.formatUSD(getGalaxyDiskCost(dataDisk)), ' per hour.'])
              ])
            ]),
            h(RadioBlock, {
              name: 'delete-persistent-disk',
              labelText: 'Delete everything, including persistent disk',
              checked: shouldDeleteDisk,
              onChange: () => setShouldDeleteDisk(true),
              style: { marginTop: '1rem' }
            }, [
              p([
                'Deletes your persistent disk, which will also ', span({ style: { fontWeight: 600 } }, ['delete all files on the disk.'])
              ]),
              p({ style: { marginBottom: 0 } }, [
                'Also deletes your application configuration and cloud compute profile.'
              ])
            ]),
            h(SaveFilesHelpGalaxy)
          ])
        ]),
        div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' } }, [
          renderActionButton()
        ])
      ])
    }

    const renderDefaultCase = () => {
      return div({ style: computeStyles.drawerContent }, [
        h(TitleBar, {
          id: titleId,
          title: 'Galaxy Cloud Environment',
          hideCloseButton: shouldHideCloseButton,
          style: { marginBottom: '0.5rem' },
          onDismiss,
          onPrevious: !!viewMode ? () => setViewMode(undefined) : undefined
        }),
        div([
          getEnvMessageBasedOnStatus(app)
        ]),
        div({ style: { paddingBottom: '1.5rem', borderBottom: `1px solid ${colors.dark(0.4)}` } }, [
          renderGalaxyCostBreakdown(kubernetesRuntimeConfig, dataDisk)
        ]),
        div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
          div([
            div({ style: computeStyles.headerText }, ['Application configuration']),
            div({ style: { marginTop: '0.5rem' } }, ['Galaxy version 21.09']),
            h(Link, { href: 'https://support.terra.bio/hc/en-us/articles/360050566271', ...Utils.newTabLinkProps }, [
              'Learn more about Galaxy interactive environments',
              icon('pop-out', { size: 12, style: { marginTop: '1rem', marginLeft: '0.25rem' } })
            ])
          ])
        ]),
        renderComputeProfileSection(),
        renderPersistentDiskSection(),
        div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' } }, [
          renderActionButton()
        ])
      ])
    }

    return h(Fragment, [
      renderMessaging(),
      loading && spinnerOverlay
    ])
  }
)

const MachineSelector = ({ value, onChange }) => {
  const { cpu: currentCpu, memory: currentMemory } = findMachineType(value.machineType)

  const gridItemInputStyle = { minWidth: '6rem' }

  return h(Fragment, [
    h(IdContainer, [
      id => h(Fragment, [
        label({ htmlFor: id, style: computeStyles.label }, ['Nodes']),
        div({ style: gridItemInputStyle }, [
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
        label({ htmlFor: id, style: computeStyles.label }, ['CPUs']),
        div({ style: gridItemInputStyle }, [
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
        label({ htmlFor: id, style: computeStyles.label }, ['Memory (GB)']),
        div({ style: gridItemInputStyle }, [
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

export const GalaxyModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(GalaxyModalBase)
