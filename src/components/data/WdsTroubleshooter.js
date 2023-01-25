import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, table, td, tr } from 'react-hyperscript-helpers'
import { ClipboardButton } from 'src/components/ClipboardButton'
import { ButtonPrimary } from 'src/components/common'
import { icon } from 'src/components/icons'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { resolveWdsApp } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider'
import colors from 'src/libs/colors'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'
import * as Utils from 'src/libs/utils'


export const WdsTroubleshooter = ({ onDismiss, workspaceId, mrgId }) => {
  const [leoOk, setLeoOk] = useState(null)
  const [wdsResponsive, setWdsResponsive] = useState(null)
  const [version, setVersion] = useState(null)
  const [wdsStatus, setWdsStatus] = useState(null)
  const [wdsDbStatus, setWdsDbStatus] = useState(null)
  const [wdsPingStatus, setWdsPingStatus] = useState(null)
  const [appFound, setAppFound] = useState(null)
  const [appRunning, setAppRunning] = useState(null)
  const [proxyUrl, setProxyUrl] = useState(null)

  const signal = useCancellation()

  useOnMount(() => {
    Ajax(signal).Apps.getV2AppInfo(workspaceId).then(res => {
      setLeoOk(res)
      const foundApp = resolveWdsApp(res)
      setAppFound(foundApp.appName)
      setAppRunning(foundApp.status)
      setProxyUrl(foundApp.proxyUrls?.wds)
      Ajax(signal).WorkspaceData.getVersion(foundApp.proxyUrls?.wds).then(res => {
        setWdsResponsive(true)
        setVersion(res.git?.commit?.id)
      }).catch(_ => {
        setWdsResponsive(false)
        setVersion('unknown')
      })
      Ajax(signal).WorkspaceData.getStatus(foundApp.proxyUrls?.wds).then(res => {
        setWdsStatus(res.status)
        setWdsDbStatus(res.components?.db?.status)
        setWdsPingStatus(res.components?.ping?.status)
      }).catch(_ => {
        setWdsStatus('unresponsive')
        setWdsDbStatus('unknown')
        setWdsPingStatus('unknown')
      })
    }).catch(_ => {
      setLeoOk([])
      setAppFound('unknown')
      setAppRunning('unknown')
      setProxyUrl('unknown')
      setWdsResponsive('unknown')
      setVersion('unknown')
      setWdsStatus('unresponsive')
      setWdsDbStatus('unknown')
      setWdsPingStatus('unknown')
    })
  })

  const checkIcon = (status, size = 24) => Utils.switchCase(status,
    ['success', () => icon('success-standard', { size, style: { color: colors.success() }, 'aria-label': 'Validation Success' })],
    ['failure', () => icon('error-standard', { size, style: { color: colors.danger(0.85) }, 'aria-label': 'Validation Failure' })],
    ['running', () => icon('loadingSpinner', { size, style: { color: colors.primary() }, 'aria-label': 'Validation Running' })]
  )

  const clippy = (label, value) => !!value && h(Fragment, [value, h(ClipboardButton, {
    'aria-label': `Copy ${label} to clipboard`,
    style: { marginLeft: '1rem' },
    text: value
  })])


  return h(Modal, {
    showCancel: false,
    onDismiss,
    title: 'WDS Troubleshooter',
    width: '55rem',
    okButton: h(ButtonPrimary, {
      tooltip: 'Done',
      onClick: onDismiss
    }, ['Done'])
  }, [div({ style: { padding: '1rem 0.5rem', lineHeight: '1.4rem' } }, [

    table({ style: { borderSpacing: '1rem 0', borderCollapse: 'separate' } }, [
      tr([
        td({ style: { fontWeight: 'bold' } }, [
          !!workspaceId ? checkIcon('success') : checkIcon('failure')
        ]),
        td({ style: { fontWeight: 'bold' } }, ['Workspace Id']),
        td([clippy('Workspace Id', workspaceId)])
      ]),
      tr([
        td({ style: { fontWeight: 'bold' } }, [
          !!mrgId ? checkIcon('success') : checkIcon('failure')
        ]),
        td({ style: { fontWeight: 'bold' } }, ['Resource Group Id']),
        td([clippy('resource group id', mrgId)])
      ]),
      tr([
        td({ style: { fontWeight: 'bold' } }, [leoOk == null ? checkIcon('running') :
          (!!leoOk?.length ? checkIcon('success') : checkIcon('failure'))]),
        td({ style: { fontWeight: 'bold' } }, ['Leo app listing']),
        td([h(Fragment, [leoOk?.length, ' app(s) total'])])
      ]),
      tr([
        td({ style: { fontWeight: 'bold' } }, [leoOk == null ? checkIcon('running') :
          (!!appFound && appFound !== 'unknown' ? checkIcon('success') : checkIcon('failure'))]),
        td({ style: { fontWeight: 'bold' } }, ['WDS app found']),
        td([clippy('found app name', appFound)])
      ]),
      tr([
        td({ style: { fontWeight: 'bold' } }, [appRunning == null ? checkIcon('running') :
          (!!appRunning && appRunning !== 'unknown' ? checkIcon('success') : checkIcon('failure'))]),
        td({ style: { fontWeight: 'bold' } }, ['WDS app status']),
        td([h(Fragment, [appRunning])])
      ]),
      tr([
        td({ style: { fontWeight: 'bold' } }, [proxyUrl == null ? checkIcon('running') :
          (!!proxyUrl && proxyUrl !== 'unknown' ? checkIcon('success') : checkIcon('failure'))]),
        td({ style: { fontWeight: 'bold' } }, ['App proxy url']),
        // don't use the clippy() helper here so we can truncate the proxyUrl
        td([
          h(Fragment, [h(div, { style: _.merge({ width: '400px', float: 'left' }, Style.noWrapEllipsis) }, [proxyUrl]),
            h(ClipboardButton, {
              'aria-label': 'Copy proxy url to clipboard',
              style: { marginLeft: '1rem' },
              text: proxyUrl
            })])
        ])
      ]),
      tr([
        td({ style: { fontWeight: 'bold' } }, [wdsResponsive == null ? checkIcon('running') :
          (!!wdsResponsive && wdsResponsive !== 'unknown' ? checkIcon('success') : checkIcon('failure'))]),
        td({ style: { fontWeight: 'bold' } }, ['WDS responding']),
        td([h(Fragment, [wdsResponsive != null ? JSON.stringify(wdsResponsive) : ''])])
      ]),
      tr([
        td({ style: { fontWeight: 'bold' } }, [version == null ? checkIcon('running') :
          (!!version && version !== 'unknown' ? checkIcon('success') : checkIcon('failure'))]),
        td({ style: { fontWeight: 'bold' } }, ['WDS version']),
        td([clippy('WDS version', version)])
      ]),
      tr([
        td({ style: { fontWeight: 'bold' } }, [wdsStatus == null ? checkIcon('running') :
          (!!wdsStatus && wdsStatus !== 'unresponsive' && wdsStatus !== 'DOWN' ? checkIcon('success') : checkIcon('failure'))]),
        td({ style: { fontWeight: 'bold' } }, ['WDS status']),
        td([h(Fragment, [wdsStatus])])
      ]),
      tr([
        td({ style: { fontWeight: 'bold' } }, [wdsDbStatus == null ? checkIcon('running') :
          (!!wdsDbStatus && wdsDbStatus !== 'unknown' && wdsDbStatus !== 'DOWN' ? checkIcon('success') : checkIcon('failure'))]),
        td({ style: { fontWeight: 'bold' } }, ['WDS DB status']),
        td([h(Fragment, [wdsDbStatus])])
      ]),
      tr([
        td({ style: { fontWeight: 'bold' } }, [wdsPingStatus == null ? checkIcon('running') :
          (!!wdsPingStatus && wdsPingStatus !== 'unknown' && wdsPingStatus !== 'DOWN' ? checkIcon('success') : checkIcon('failure'))]),
        td({ style: { fontWeight: 'bold' } }, ['WDS ping status']),
        td([h(Fragment, [wdsPingStatus])])
      ]),
    ])

  ]
  )])
}
//TODO: Implement doesSchemaExist API in WDS, then call it
// h(div, {}, ['WDS default instance exists: ', h(Fragment, ['tbd - need API support'])]),
