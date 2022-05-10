import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h1, h2, h3, span, table, tbody, td, tr } from 'react-hyperscript-helpers'
import Collapse from 'src/components/Collapse'
import { ButtonOutline, ButtonPrimary, ButtonSecondary, Link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import { ReactComponent as AzureLogo } from 'src/images/azure.svg'
import { ReactComponent as GcpLogo } from 'src/images/gcp.svg'
import { Ajax } from 'src/libs/ajax'
import colors from 'src/libs/colors'
import Events from 'src/libs/events'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { commonStyles } from 'src/pages/library/common'
import { datasetAccessTypes, importDataToWorkspace, uiMessaging, useDataCatalog } from 'src/pages/library/dataBrowser-utils'
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
        dataObj.dataReleasePolicy.label,
        dataObj.dataReleasePolicy.desc && div({ style: { fontSize: '0.625rem', lineHeight: '0.625rem' } }, [dataObj.dataReleasePolicy.desc])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Last Updated']),
        Utils.makeStandardDate(dataObj['dct:modified'])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Version']),
        '1.0'
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

const LegacyAttributesComponent = ({ dataObj }) => {
  return h(Collapse, {
    title: h2({ style: { fontWeight: 'normal', fontSize: '1.2rem' } }, ['Legacy Dataset Attributes']),
    initialOpenState: true,
    style: { borderTop: '2px solid #D6D7D7', marginTop: '1.5rem' }
  }, [
    div({ style: { display: 'flex', width: '100%', flexWrap: 'wrap' } },
      _.flow(
        _.toPairs,
        _.flatMap(([key, value]) => {
          return div({ style: { width: '30%', margin: '0 10px' } }, [
            h3({ style: { textTransform: 'capitalize' } }, [
              key.split(/(?=[A-Z])/).join(' ')
            ]),
            div([value])
          ])
        })
      )(dataObj.legacyDatasetAttributes)
    )
  ])
}

const MainContent = ({ dataObj }) => {
  return div({ style: { ...styles.content, width: '100%', marginTop: 0 } }, [
    h1({ style: { lineHeight: '1.5em' } }, [dataObj['dct:title']]),
    dataObj.dataSource && div({ style: { marginBottom: '1rem' } }, [
      `This data is from ${dataObj.dataSource.storageSystemName}:`,
      h(ButtonSecondary, {
        style: { fontSize: 16, textTransform: 'none', height: 'unset', display: 'block' },
        onClick: () => {
          // TODO: fill out this link
        }
      }, [
        icon('folder', { size: 18, style: { marginRight: 10, color: styles.access.controlled } }),
        dataObj.dataSource.storageSourceName
      ])
    ]),
    dataObj['dct:description'],
    h(MetadataDetailsComponent, { dataObj }),
    dataObj.legacyDatasetAttributes && h(LegacyAttributesComponent, { dataObj })
  ])
}


export const SidebarComponent = ({ dataObj, id }) => {
  const { access } = dataObj
  const [showRequestAccessModal, setShowRequestAccessModal] = useState()

  return h(Fragment, [
    div({ style: { ...styles.content, width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
      h2({ className: 'sr-only' }, [`${dataObj.type} Data Details`]),
      div({ style: { backgroundColor: 'white', padding: 20, paddingTop: 0, width: '100%', border: '2px solid #D6D7D7', borderRadius: 5 } }, [
        div([
          h3(['Access type']),
          div([
            Utils.switchCase(access,
              [datasetAccessTypes.CONTROLLED, () => h(ButtonSecondary, {
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
              [datasetAccessTypes.PENDING, () => div({ style: { color: styles.access.pending } }, [
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
      h(ButtonOutline, {
        disabled: dataObj.access !== datasetAccessTypes.GRANTED,
        tooltip: dataObj.access === datasetAccessTypes.GRANTED ? '' : uiMessaging.controlledFeature_tooltip,
        style: { fontSize: 16, textTransform: 'none', height: 'unset', width: 230, marginTop: 20 },
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
        disabled: dataObj.access !== datasetAccessTypes.GRANTED,
        tooltip: dataObj.access === datasetAccessTypes.GRANTED ? '' : uiMessaging.controlledFeature_tooltip,
        style: { fontSize: 16, textTransform: 'none', height: 'unset', width: 230, marginTop: 20 },
        onClick: () => {
          Ajax().Metrics.captureEvent(`${Events.catalogWorkspaceLink}:detailsView`, {
            id,
            title: dataObj['dct:title']
          })
          importDataToWorkspace([dataObj])
        }
      }, ['Link to a workspace'])
    ]),
    showRequestAccessModal && h(RequestDatasetAccessModal, {
      datasets: [dataObj],
      onDismiss: () => setShowRequestAccessModal(false)
    })
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
