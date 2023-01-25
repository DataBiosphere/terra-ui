import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h } from 'react-hyperscript-helpers'
import { ClipboardButton } from 'src/components/ClipboardButton'
import { ButtonPrimary } from 'src/components/common'
import Modal from 'src/components/Modal'
import { Ajax } from 'src/libs/ajax'
import { resolveWdsApp } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider'
import { useCancellation, useOnMount } from 'src/libs/react-utils'
import * as Style from 'src/libs/style'


export const WdsTroubleshooter = ({ onDismiss, workspaceId, mrgId }) => {
  const [leoOk, setLeoOk] = useState([])
  const [wdsResponsive, setWdsResponsive] = useState(false)
  const [version, setVersion] = useState({})
  const [wdsStatus, setWdsStatus] = useState({})
  const [wdsDbStatus, setWdsDbStatus] = useState({})
  const [wdsPingStatus, setWdsPingStatus] = useState({})
  const [appFound, setAppFound] = useState('')
  const [appRunning, setAppRunning] = useState('')
  const [proxyUrl, setProxyUrl] = useState('')

  const signal = useCancellation()

  useOnMount(() => {
    setLeoOk('checking...')
    Ajax(signal).Apps.getV2AppInfo(workspaceId).then(res => {
      setLeoOk(res)
      const foundApp = resolveWdsApp(res)
      setAppFound(foundApp.appName)
      setAppRunning(foundApp.status)
      setProxyUrl(foundApp.proxyUrls?.wds)
      Ajax(signal).WorkspaceData.getVersion(foundApp.proxyUrls?.wds).then(res => {
        setWdsResponsive(true)
        setVersion(res.git?.commit?.id)
      })
      Ajax(signal).WorkspaceData.getStatus(foundApp.proxyUrls?.wds).then(res => {
        setWdsStatus(res.status)
        setWdsDbStatus(res.components?.db?.status)
        setWdsPingStatus(res.components?.ping?.status)
      })
    })
  })

  return h(Modal, {
    showCancel: false,
    onDismiss,
    title: 'WDS Troubleshooter',
    width: '35rem',
    okButton: h(ButtonPrimary, {
      tooltip: 'Done',
      onClick: onDismiss
    }, ['Done'])
  }, [div({ style: { padding: '1rem 0.5rem', lineHeight: '1.4rem' } },
    [h(div, {}, ['Leo app listing: ', h(Fragment, [leoOk.length, ' app(s) total'])]),
      h(div, {}, ['Workspace Id: ', h(Fragment, [workspaceId, h(ClipboardButton, {
        'aria-label': 'Copy workspaceId to clipboard',
        style: { marginLeft: '1rem' },
        text: workspaceId
      })])]),
      h(div, {}, ['Resource Group Id: ', h(Fragment, [mrgId, h(ClipboardButton, {
        'aria-label': 'Copy resource group id to clipboard',
        style: { marginLeft: '1rem' },
        text: mrgId
      })])]),
      h(div, {}, ['WDS app found: ', h(Fragment, [appFound, h(ClipboardButton, {
        'aria-label': 'Copy found app name to clipboard',
        style: { marginLeft: '1rem' },
        text: appFound
      })])]),
      h(div, {}, ['WDS app status: ', h(Fragment, [appRunning])]),
      h(div, {}, ['App proxy url: ', h(Fragment, [h(div, { style: _.merge({ width: '400px' }, Style.noWrapEllipsis) }, [proxyUrl]), h(ClipboardButton, {
        'aria-label': 'Copy proxy url to clipboard',
        style: { marginLeft: '1rem' },
        text: proxyUrl
      })])]),
      h(div, {}, ['WDS responding: ', h(Fragment, [JSON.stringify(wdsResponsive)])]),
      h(div, {}, ['WDS version: ', h(Fragment, [JSON.stringify(version), h(ClipboardButton, {
        'aria-label': 'Copy WDS version to clipboard',
        style: { marginLeft: '1rem' },
        text: version
      })])]),
      h(div, {}, ['WDS status: ', h(Fragment, [JSON.stringify(wdsStatus)])]),
      h(div, {}, ['WDS DB status: ', h(Fragment, [JSON.stringify(wdsDbStatus)])]),
      h(div, {}, ['WDS ping status: ', h(Fragment, [JSON.stringify(wdsPingStatus)])])]
  )])
}
//TODO: Implement doesSchemaExist API in WDS, then call it
// h(div, {}, ['WDS default instance exists: ', h(Fragment, ['tbd - need API support'])]),
