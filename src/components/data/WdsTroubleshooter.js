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
  const [defaultInstanceExists, setDefaultInstanceExists] = useState(null)

  const signal = useCancellation()

  useOnMount(() => {
    Ajax(signal).Apps.listAppsV2(workspaceId).then(res => {
      setLeoOk(res)
      const foundApp = resolveWdsApp(res)
      setAppFound(foundApp?.appName)
      setAppRunning(!!foundApp?.appName ? foundApp?.status : 'unknown')
      setProxyUrl(!!foundApp?.appName ? foundApp?.proxyUrls?.wds : 'unknown')
      Ajax(signal).WorkspaceData.getVersion(foundApp?.proxyUrls?.wds).then(res => {
        setWdsResponsive(true)
        setVersion(res.git?.commit?.id)
      }).catch(_ => {
        setWdsResponsive(false)
        setVersion('unknown')
      })
      Ajax(signal).WorkspaceData.getStatus(foundApp?.proxyUrls?.wds).then(res => {
        setWdsStatus(res.status)
        setWdsDbStatus(res.components?.db?.status)
        setWdsPingStatus(res.components?.ping?.status)
      }).catch(_ => {
        setWdsStatus('unresponsive')
        setWdsDbStatus('unknown')
        setWdsPingStatus('unknown')
      })
      Ajax(signal).WorkspaceData.listInstances(foundApp?.proxyUrls?.wds).then(res => {
        setDefaultInstanceExists(res.includes(workspaceId))
      }).catch(_ => {
        setDefaultInstanceExists('unknown')
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
      setDefaultInstanceExists('unknown')
    })
  })

  const checkIcon = (status, size = 24) => Utils.switchCase(status,
    ['success', () => icon('success-standard', { size, style: { color: colors.success() }, 'aria-label': 'Validation Success' })],
    ['failure', () => icon('error-standard', { size, style: { color: colors.danger(0.85) }, 'aria-label': 'Validation Failure' })],
    ['running', () => icon('loadingSpinner', { size, style: { color: colors.primary() }, 'aria-label': 'Validation Running' })]
  )

  const troubleShooterRow = ([label, text, iconRunning, iconSuccess, element]) => {
    return tr([
      td({ style: { fontWeight: 'bold' } }, [
        iconRunning ? checkIcon('running') : (iconSuccess ? checkIcon('success') : checkIcon('failure'))
      ]),
      td({ style: { fontWeight: 'bold' } }, [label]),
      td({ style: { fontWeight: 'bold' } }, [!!element]),
      Utils.cond([!!element, () => element], () => td([h(Fragment, [text])])
      )
    ])
  }

  // The proxyUrl is long and should be truncated,
  // so it gets it own special element
  const proxyElement =
      td([
        h(Fragment, [h(div, { style: _.merge({ width: '400px', float: 'left' }, Style.noWrapEllipsis) }, [proxyUrl])])
      ])

  /** For each piece of information we want to include in the troubleshooter, we want:
   * 1. A label
   * 2. The value of information
   * 3. A function or variable that evaluates to boolean, determining whether the info/validation is still running
   * 4. A function or variable that evaluates to boolean, determining whether the info/validation is successful
   * 5. An optional element to use in place of the standard defined in troubleShooterRow
  **/
  const troubleShooterText = [
    ['Workspace Id',	workspaceId, false, !!workspaceId],
    ['Resource Group Id',	mrgId, false, !!mrgId],
    ['App listing',	`${leoOk?.length} app(s) total`, leoOk == null, !!leoOk?.length],
    ['Data app name',	appFound, leoOk == null, !!appFound && appFound !== 'unknown'],
    ['Data app running?',	appRunning, appRunning == null, !!appRunning && appRunning !== 'unknown'],
    ['Data app proxy url',	proxyUrl, proxyUrl == null, !!proxyUrl && proxyUrl !== 'unknown', proxyElement],
    ['Data app responding',	`${wdsResponsive}`, wdsResponsive == null, !!wdsResponsive && wdsResponsive !== 'unknown'],
    ['Data app version',	version, version == null, !!version && version !== 'unknown'],
    ['Data app status',	wdsStatus, wdsStatus == null, !!wdsStatus && wdsStatus !== 'unresponsive' && wdsStatus !== 'DOWN'],
    ['Data app DB status',	wdsDbStatus, wdsDbStatus == null, !!wdsDbStatus && wdsDbStatus !== 'unknown' && wdsDbStatus !== 'DOWN'],
    ['Data app ping status',	wdsPingStatus, wdsPingStatus == null, !!wdsPingStatus && wdsPingStatus !== 'unknown' && wdsPingStatus !== 'DOWN'],
    ['Default Instance exists', `${defaultInstanceExists}`, defaultInstanceExists == null, !!defaultInstanceExists && defaultInstanceExists !== 'unknown']
  ]

  const tableRows = troubleShooterText.map(x => troubleShooterRow(x))

  return h(Modal, {
    showCancel: false,
    onDismiss,
    title: 'Data Table Status',
    width: '55rem',
    okButton: h(ButtonPrimary, {
      tooltip: 'Close',
      onClick: onDismiss
    }, ['Close'])
  }, [div({ style: { padding: '1rem 0.5rem', lineHeight: '1.4rem' } }, [
    table({ style: { borderSpacing: '1rem 0', borderCollapse: 'separate' } }, //[
      tableRows
    ),
    h(Fragment, {}, ['Please copy this information and email support@terra.bio to troubleshoot the error with your data tables.',
      h(ClipboardButton, {
        'aria-label': 'Copy troubleshooting info to clipboard',
        style: { marginLeft: '1rem' },
        text: troubleShooterText.map(x => x.slice(0, 2)).join('\n')
      })])
  ])])
}
