import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, Link, spinnerOverlay } from 'src/components/common'
import { icon } from 'src/components/icons'
import { withModalDrawer } from 'src/components/ModalDrawer'
import TitleBar from 'src/components/TitleBar'
import { Ajax } from 'src/libs/ajax'
import { withErrorReportingInModal } from 'src/libs/error'
import Events, { extractWorkspaceDetails } from 'src/libs/events'
import { useStore, withDisplayName } from 'src/libs/react-utils'
import { azureCookieReadyStore, cookieReadyStore } from 'src/libs/state'
import * as Utils from 'src/libs/utils'
import { cloudProviderTypes, getCloudProviderFromWorkspace } from 'src/libs/workspace-utils'
import { WarningTitle } from 'src/pages/workspaces/workspace/analysis/modals/WarningTitle'
import { getCurrentApp, getEnvMessageBasedOnStatus } from 'src/pages/workspaces/workspace/analysis/utils/app-utils'
import { appToolLabels, appTools } from 'src/pages/workspaces/workspace/analysis/utils/tool-utils'

import { SaveFilesHelpAzure } from '../runtime-common-components'
import { computeStyles } from './modalStyles'


const titleId = 'hail-batch-modal-title'

export const HailBatchModalBase = withDisplayName('HailBatchModal')(({ onDismiss, onError, onSuccess, apps, workspace, workspace: { workspace: { workspaceId } } }) => {
  const app = getCurrentApp(appTools.HAIL_BATCH.label, apps)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState(undefined)
  const leoCookieReady = useStore(cookieReadyStore)
  const azureCookieReady = useStore(azureCookieReadyStore)
  const cloudProvider = getCloudProviderFromWorkspace(workspace)

  // Creates hail batch app in Leo
  const createHailBatch = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReportingInModal('Error creating Hail Batch', onError)
  )(async () => {
    await Ajax().Apps.createAppV2(Utils.generateAppName(), workspaceId, appToolLabels.HAIL_BATCH)
    Ajax().Metrics.captureEvent(Events.applicationCreate, { app: appTools.CROMWELL.label, ...extractWorkspaceDetails(workspace) })
    return onSuccess()
  })

  // Deletes hail batch app in Leo
  const deleteHailBatch = _.flow(
    Utils.withBusyState(setLoading),
    withErrorReportingInModal('Error deleting Hail Batch', onError)
  )(async () => {
    await Ajax().Apps.deleteAppV2(app.appName, workspaceId)
    Ajax().Metrics.captureEvent(Events.applicationDelete, { app: appTools.HAIL_BATCH.label, ...extractWorkspaceDetails(workspace) })
    return onSuccess()
  })


  const renderActionButton = () => {
    return !app ?
      h(ButtonPrimary, { onClick: createHailBatch }, ['Create']) :
      Utils.switchCase(viewMode,
        ['deleteWarn', () => {
          return h(ButtonPrimary, { onClick: deleteHailBatch }, ['Delete'])
        }],
        [Utils.DEFAULT, () => {
          const cookieReady = Utils.cond(
            [cloudProvider === cloudProviderTypes.AZURE, () => azureCookieReady.readyForCromwellApp],
            [Utils.DEFAULT, () => leoCookieReady])
          return h(Fragment, [
            h(ButtonOutline, { disabled: false, style: { marginRight: 'auto' }, onClick: () => setViewMode('deleteWarn') },
              ['Delete Environment']),
            h(ButtonPrimary, {
              href: app?.proxyUrls['batch'],
              disabled: !cookieReady,
              tooltip: Utils.cond(
                [cookieReady, () => 'Open'],
                [Utils.DEFAULT, () => 'Please wait until Hail Batch is running']),
              onClick: () => {
                Ajax().Metrics.captureEvent(Events.applicationLaunch, { app: appTools.HAIL_BATCH.label })
              },
              ...Utils.newTabLinkPropsWithReferrer,
            }, ['Open Hail Batch'])
          ])
        }])
  }

  const renderDeleteWarn = () => {
    return div({ style: { ...computeStyles.drawerContent, ...computeStyles.warningView } }, [
      h(TitleBar, {
        id: titleId,
        style: computeStyles.titleBar,
        title: h(WarningTitle, ['Delete environment']),
        onDismiss,
        onPrevious: () => {
          setViewMode(undefined)
        }
      }),
      div({ style: { lineHeight: '1.5rem' } }, [
        h(SaveFilesHelpAzure)
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
        title: 'Hail Batch Cloud Environment',
        style: { marginBottom: '0.5rem' },
        onDismiss,
        onPrevious: !!viewMode ? () => setViewMode(undefined) : undefined
      }),
      div([
        getEnvMessageBasedOnStatus(app)
      ]),
      div({ style: { ...computeStyles.whiteBoxContainer, marginTop: '1rem' } }, [
        div([
          div({ style: computeStyles.headerText }, ['Application configuration']),
          div({ style: { marginTop: '0.5rem' } }, ['Hail Batch version x.y.z']),
          h(Link, { href: 'https://hail.is/docs/batch/index.html', ...Utils.newTabLinkProps }, [
            'Learn more about Hail Batch',
            icon('pop-out', { size: 12, style: { marginTop: '1rem', marginLeft: '0.25rem' } })
          ])
        ])
      ]),
      div({ style: { display: 'flex', marginTop: '2rem', justifyContent: 'flex-end' } }, [
        renderActionButton()
      ])
    ])
  }

  const renderMessaging = () => {
    return Utils.switchCase(viewMode,
      ['deleteWarn', renderDeleteWarn],
      [Utils.DEFAULT, renderDefaultCase]
    )
  }

  return h(Fragment, [renderMessaging(), loading && spinnerOverlay])
})

export const HailBatchModal = withModalDrawer({ width: 675, 'aria-labelledby': titleId })(HailBatchModalBase)
