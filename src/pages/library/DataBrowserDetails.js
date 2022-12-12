import _ from 'lodash/fp'
import qs from 'qs'
import { Fragment, useState } from 'react'
import { div, h, h1, h2, h3, span, table, tbody, td, tr } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, ButtonSecondary, Link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon, spinner } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import Modal from 'src/components/Modal'
import { ReactComponent as AzureLogo } from 'src/images/azure.svg'
import { ReactComponent as GcpLogo } from 'src/images/gcp.svg'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import { withErrorReporting } from 'src/libs/error'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import { useCancellation, usePollingEffect } from 'src/libs/react-utils'
import * as Utils from 'src/libs/utils'
import { commonStyles } from 'src/pages/library/common'
import {
  datasetAccessTypes, datasetReleasePolicies, getDataReleasePolicyFromDataset, isDatarepoSnapshot, isWorkspace, uiMessaging, useDataCatalog
} from 'src/pages/library/dataBrowser-utils'
import { DataBrowserFeedbackModal } from 'src/pages/library/DataBrowserFeedbackModal'
import { RequestDatasetAccessModal } from 'src/pages/library/RequestDatasetAccessModal'


const activeTab = 'datasets'
const styles = {
  ...commonStyles,
  content: { padding: 20, marginTop: 15 },
  headers: { margin: '20px 0 10px' },
  attributesColumn: { width: '22%', marginRight: 20, marginTop: 30 },
  cloudIconProps: { role: 'img', style: { maxHeight: 25, maxWidth: 150 } }
}

export const ContactCard = ({ contactName, institution, email }) => {
  return div({ key: contactName, style: { marginBottom: 30 } }, [
    contactName,
    institution && div({ style: { marginTop: 5 } }, [institution]),
    email && h(Link, { href: `mailto:${email}`, style: { marginTop: 5, display: 'block' } }, [email])
  ])
}

const MetadataDetailsComponent = ({ dataObj, name }) => {
  return h(Fragment, [
    h2({ className: 'sr-only' }, [` ${name} Metadata`]),
    div({ style: { display: 'flex', width: '100%', flexWrap: 'wrap' } }, [
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Data release policy']),
        getDataReleasePolicyFromDataset(dataObj).label,
        getDataReleasePolicyFromDataset(dataObj) !== datasetReleasePolicies.unknownReleasePolicy && getDataReleasePolicyFromDataset(dataObj).desc && div({ style: { fontSize: '0.625rem', lineHeight: '0.625rem' } }, [getDataReleasePolicyFromDataset(dataObj).desc])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Last Updated']),
        dataObj['dct:modified'] && Utils.makeStandardDate(dataObj['dct:modified'])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Version']),
        dataObj['dct:version']
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Cloud provider']),
        _.map(
          ({ cloudPlatform }) => div({ key: cloudPlatform }, [
            Utils.switchCase(cloudPlatform,
              ['gcp', () => h(GcpLogo, { title: 'Google Cloud Platform', ...styles.cloudIconProps })],
              ['azure', () => h(AzureLogo, { title: 'Microsoft Azure', ...styles.cloudIconProps })]
            )
          ]),
          _.uniqBy('cloudPlatform', dataObj.storage)
        )
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Contact']),
        _.map(ContactCard, dataObj.contacts)
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Data curator']),
        _.map(ContactCard, dataObj.curators)
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Contributors']),
        div({ style: { whiteSpace: 'pre' } }, [_.join('\n', dataObj.contributorNames)])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Region']),
        div({ style: { whiteSpace: 'pre' } }, [_.flow(_.map('region'), _.uniq, _.join('\n'))(dataObj.storage)])
      ])
    ])
  ])
}

const MainContent = ({ dataObj }) => {
  const accessURL = dataObj['dcat:accessURL']
  const workspaceName = accessURL?.includes('/#workspaces/') && accessURL.substring(accessURL.lastIndexOf('/') + 1)
  const linkStyle = { fontSize: 16, textDecoration: 'underline', textTransform: 'none', height: 'unset', display: 'block' }
  return div({ style: { ...styles.content, width: '100%', marginTop: 0 } }, [
    h1({ style: { lineHeight: '1.5em' } }, [dataObj['dct:title']]),
    !!workspaceName && div({ style: { marginBottom: '1rem' } }, [
      'This data is from the Terra workspace:',
      h(Link, {
        style: linkStyle,
        href: accessURL
      }, [
        icon('folderSolid', { size: 18, style: { marginRight: 10, color: styles.access.controlled } }),
        workspaceName
      ])
    ]),
    dataObj.access === datasetAccessTypes.EXTERNAL && div({ style: { marginBottom: '1rem', display: 'flex' } }, [
      'This data is hosted and managed externally from Terra. ',
      h(Link, {
        style: { ...linkStyle, marginLeft: 10 },
        href: accessURL, target: '_blank'
      }, [
        'Go to external data site',
        icon('pop-out', { size: 18, style: { marginLeft: 10, color: styles.access.controlled } })
      ])
    ]),
    dataObj['dct:description'],
    h(MetadataDetailsComponent, { dataObj })
  ])
}


export const SidebarComponent = ({ dataObj, id }) => {
  const { access, requestAccessURL } = dataObj
  const [showRequestAccessModal, setShowRequestAccessModal] = useState(false)
  const [feedbackShowing, setFeedbackShowing] = useState(false)
  const [datasetNotSupportedForExport, setDatasetNotSupportedForExport] = useState(false)
  const [snapshotExportJobId, setSnapshotExportJobId] = useState()
  const [tdrSnapshotPreparePolling, setTdrSnapshotPreparePolling] = useState(false)
  const sidebarButtonWidth = 230


  const importDataToWorkspace = dataset => {
    Ajax().Metrics.captureEvent(`${Events.catalogWorkspaceLink}:detailsView`, {
      id,
      title: dataObj['dct:title'],
      source: dataset['dcat:accessURL']
    })
    Utils.cond(
      [isWorkspace(dataset), () => {
        Nav.history.push({
          pathname: Nav.getPath('import-data'),
          search: qs.stringify({
            format: 'catalog',
            snapshotName: dataset['dct:title'],
            catalogDatasetId: dataset.id
          })
        })
      }],
      [isDatarepoSnapshot(dataset), async () => {
        setTdrSnapshotPreparePolling(true)
        const jobInfo = await withErrorReporting('Error exporting dataset', async () => await Ajax().DataRepo.snapshot(dataset['dct:identifier']).exportSnapshot())()
        setSnapshotExportJobId(jobInfo.id)
      }],
      () => setDatasetNotSupportedForExport(true)
    )
  }

  return h(Fragment, [
    div({ style: { ...styles.content, width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
      h2({ className: 'sr-only' }, [`${dataObj.type} Data Details`]),
      div({ style: { backgroundColor: 'white', padding: 20, paddingTop: 0, width: '100%', border: '2px solid #D6D7D7', borderRadius: 5 } }, [
        div([
          h3(['Access type']),
          div([
            Utils.cond(
              [access === datasetAccessTypes.EXTERNAL, () => div({ style: { fontSize: 12 } }, ['Managed Externally'])],
              [!!requestAccessURL && access === datasetAccessTypes.CONTROLLED, () => h(ButtonOutline, {
                style: { height: 'unset', textTransform: 'none', padding: '.5rem' },
                href: requestAccessURL, target: '_blank'
              }, [icon('lock'), div({ style: { paddingLeft: 10, fontSize: 12 } }, ['Request Access'])])],
              [access === datasetAccessTypes.CONTROLLED, () => h(ButtonSecondary, {
                style: { fontSize: 16, textTransform: 'none', height: 'unset' },
                onClick: () => {
                  setShowRequestAccessModal(true)
                  Ajax().Metrics.captureEvent(`${Events.catalogRequestAccess}:popUp`, {
                    id: dataObj.id,
                    title: dataObj['dct:title']
                  })
                }
              }, [
                icon('lock', { size: 18, style: { marginRight: 10, color: styles.access.controlled } }),
                'Request Access'
              ])],
              [access === datasetAccessTypes.PENDING, () => div({ style: { color: styles.access.pending } }, [
                icon('unlock', { size: 18, style: { marginRight: 10 } }),
                'Pending Access'
              ])],
              [Utils.DEFAULT, () => div({ style: { color: styles.access.granted } }, [
                icon('unlock', { size: 18, style: { marginRight: 10 } }),
                'Granted Access'
              ])])
          ])
        ]),
        div([
          h3({ style: styles.headers }, ['Donor size']),
          div([_.getOr(0, 'counts.donors', dataObj).toLocaleString()])
        ]),
        div([
          h3({ style: styles.headers }, ['Sample size']),
          div([_.getOr(0, 'counts.samples', dataObj).toLocaleString()])
        ]),
        div([
          h3({ style: styles.headers }, ['Data Modality']),
          div([_.join(', ', dataObj.dataModality)])
        ]),
        div([
          h3({ style: styles.headers }, ['Data type']),
          div([_.join(', ', dataObj.dataType)])
        ]),
        div([
          h3({ style: styles.headers }, ['File counts']),
          table([
            tbody([
              _.map(file => {
                return tr({ key: `filetype_${file['dcat:mediaType']}_${file.count}` }, [
                  td({ style: { paddingRight: 30 } }, [file['dcat:mediaType']]),
                  td([(file.count || 0).toLocaleString()])
                ])
              }, dataObj.files),
              tr({ style: { fontWeight: 'bold', borderTop: '2px solid rgba(0,0,0,.3)' } }, [
                td(['Total']),
                td([_.sumBy('count', dataObj.files).toLocaleString()])
              ])
            ])
          ])
        ])
      ]),
      access === datasetAccessTypes.EXTERNAL ?
        h(Fragment, [
          h(ButtonPrimary, {
            style: { fontSize: 14, textTransform: 'none', height: 'unset', width: '100%', marginTop: 20 },
            href: dataObj['dcat:accessURL'], target: '_blank'
          }, [div(['Go to external data site']), icon('pop-out', { style: { marginLeft: 10 }, size: 18 })]),
          div({ style: { width: '100%', marginTop: 10 } }, ['The site may allow you to export to a Terra workspace for further analysis.'])
        ]) :
        h(Fragment, [
          h(ButtonOutline, {
            disabled: (isWorkspace(dataObj) || isDatarepoSnapshot(dataObj)) && dataObj.access !== datasetAccessTypes.GRANTED,
            tooltip: (isWorkspace(dataObj) || isDatarepoSnapshot(dataObj)) ?
              dataObj.access === datasetAccessTypes.GRANTED ? '' : uiMessaging.controlledFeatureTooltip :
              uiMessaging.unsupportedDatasetTypeTooltip('preview'),
            style: { fontSize: 16, textTransform: 'none', height: 'unset', width: sidebarButtonWidth, marginTop: 20 },
            onClick: () => {
              Ajax().Metrics.captureEvent(`${Events.catalogView}:previewData`, {
                id: dataObj.id,
                title: dataObj['dct:title']
              })
              Nav.goToPath('library-catalog-preview', { id: dataObj.id })
            }
          }, [
            div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
              icon('eye', { size: 22, style: { marginRight: 10 } }),
              'Preview data'
            ])
          ]),
          h(ButtonPrimary, {
            disabled: (isWorkspace(dataObj) || isDatarepoSnapshot(dataObj)) && (dataObj.access !== datasetAccessTypes.GRANTED || tdrSnapshotPreparePolling),
            tooltip: (isWorkspace(dataObj) || isDatarepoSnapshot(dataObj)) ?
              dataObj.access === datasetAccessTypes.GRANTED ? '' : uiMessaging.controlledFeatureTooltip :
              uiMessaging.unsupportedDatasetTypeTooltip('preparing for analysis'),
            style: { fontSize: 16, textTransform: 'none', height: 'unset', width: sidebarButtonWidth, marginTop: 20 },
            onClick: () => {
              importDataToWorkspace(dataObj)
            }
          }, ['Prepare for analysis']),
          div({ style: { display: 'flex', width: sidebarButtonWidth, marginTop: 20 } }, [
            icon('talk-bubble', { size: 60, style: { width: 60, height: 45 } }),
            div({ style: { marginLeft: 10, lineHeight: '1.3rem' } }, [
              h(Link, {
                onClick: () => setFeedbackShowing(true)
              }, ['Provide feedback on this dataset view'])
            ])
          ])
        ])
    ]),
    feedbackShowing && h(DataBrowserFeedbackModal, {
      onDismiss: () => setFeedbackShowing(false),
      onSuccess: () => setFeedbackShowing(false),
      primaryQuestion: 'Is there anything missing or that you would like to see in this dataset view?',
      sourcePage: 'Catalog Details'
    }),
    showRequestAccessModal && h(RequestDatasetAccessModal, {
      datasets: [dataObj],
      onDismiss: () => setShowRequestAccessModal(false)
    }),
    datasetNotSupportedForExport && h(Modal, {
      title: 'Cannot Export Dataset',
      showCancel: false,
      onDismiss: () => setDatasetNotSupportedForExport(false)
    }, ['This dataset is not hosted in a storage system that currently has the ability to export to a research environment.']),
    !!snapshotExportJobId && h(SnapshotExportModal, {
      jobId: snapshotExportJobId,
      dataset: dataObj,
      onDismiss: () => {
        setSnapshotExportJobId(undefined)
        setTdrSnapshotPreparePolling(false)
      },
      onFailure: () => {
        setDatasetNotSupportedForExport(true)
        setSnapshotExportJobId(undefined)
        setTdrSnapshotPreparePolling(false)
      }
    })
  ])
}

const SnapshotExportModal = ({ jobId, dataset, onDismiss, onFailure }) => {
  const signal = useCancellation()
  const [jobStatus, setJobStatus] = useState('running')
  const [abortWarningShowing, setAbortWarningShowing] = useState(false)

  usePollingEffect(
    withErrorReporting('Problem checking status of snapshot import', async () => {
      jobStatus === 'running' && await checkJobStatus()
    }), { ms: 1000 })

  const checkJobStatus = async () => {
    const jobInfo = await Ajax(signal).DataRepo.job(jobId).details()
    const newJobStatus = jobInfo['job_status']
    Utils.switchCase(newJobStatus,
      ['succeeded', async () => {
        const jobResult = await withErrorReporting('Error getting export result', async () => await Ajax().DataRepo.job(jobId).result())()
        const jobResultManifest = jobResult?.format?.parquet?.manifest
        Ajax().Metrics.captureEvent(Events.catalogWorkspaceLinkExportFinished)
        jobResultManifest ? Nav.history.push({
          pathname: Nav.getPath('import-data'),
          search: qs.stringify({
            url: getConfig().dataRepoUrlRoot, format: 'tdrexport', referrer: 'data-catalog',
            snapshotId: dataset['dct:identifier'], snapshotName: dataset['dct:title'], tdrmanifest: jobResultManifest
          })
        }) : onFailure()
      }],
      ['running', () => setJobStatus('running')],
      [Utils.DEFAULT, onFailure])
  }

  const buttonStyle = { width: 88, borderRadius: 1 }

  return h(Modal, {
    title: 'Preparing Dataset for Analysis',
    onDismiss,
    showCancel: false,
    shouldCloseOnOverlayClick: false,
    shouldCloseOnEsc: false,
    okButton: abortWarningShowing ? div(
      { style: { display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' } },
      [
        'Are you sure you want to abort?',
        h(ButtonOutline, { onClick: () => setAbortWarningShowing(false), style: buttonStyle }, ['No']),
        h(ButtonOutline, { onClick: onDismiss, style: buttonStyle }, ['Yes'])
      ]) : h(ButtonOutline, { onClick: () => setAbortWarningShowing(true), style: buttonStyle }, ['Abort'])
  }, [
    div({ style: { display: 'flex', alignItems: 'center' } }, [
      spinner({ size: 100 }),
      div({ style: { marginLeft: 10 } }, ['Your dataset is being prepared for analysis. This may take a minute or two.'])
    ])
  ])
}

const DataBrowserDetails = ({ id }) => {
  const { dataCatalog } = useDataCatalog()
  const dataMap = _.keyBy('id', dataCatalog)
  const dataObj = dataMap[id]

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter(activeTab),
    !dataObj ?
      centeredSpinner() :
      h(Fragment, [
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'top', width: '100%', lineHeight: '26px' } }, [
          div({ style: styles.content }, [
            h(Link, { onClick: Nav.history.goBack, 'aria-label': 'Back' }, [
              span({ className: 'fa-stack fa-2x' }, [
                icon('circle', { size: 40, className: 'fa-stack-2x', style: { color: colors.primary('light'), opacity: 0.2 } }),
                icon('angle-left', { size: 30, className: 'fa-stack-1x', style: { color: colors.primary('light') } })
              ])
            ])
          ]),
          h(MainContent, { dataObj }),
          h(SidebarComponent, { dataObj, id })
        ])
      ])
  ])
}

export const navPaths = [{
  name: 'library-details',
  path: '/library/browser/:id',
  component: DataBrowserDetails,
  title: 'Catalog - Dataset Details'
}]
