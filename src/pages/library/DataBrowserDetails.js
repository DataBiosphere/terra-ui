import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h1, h2, h3, span, table, tbody, td, tr } from 'react-hyperscript-helpers'
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
import { importDataToWorkspace, snapshotAccessTypes, useDataCatalog } from 'src/pages/library/dataBrowser-utils'
import { RequestDatasetAccessModal } from 'src/pages/library/RequestDatasetAccessModal'


const activeTab = 'browse & explore'
const styles = {
  ...commonStyles,
  content: { padding: 20, marginTop: 15 },
  headers: { margin: '20px 0 10px' },
  attributesColumn: { width: '22%', marginRight: 20, marginTop: 30 }
}
const cloudIconProps = { role: 'img', style: { maxHeight: 25, maxWidth: 150 } }

const makeContactCard = ({ contactName, institution, email }) => {
  return div({ key: contactName, style: { marginBottom: 30 } }, [
    contactName,
    institution && div({ style: { marginTop: 5 } }, [institution]),
    email && h(Link, { href: `mailto:${email}`, style: { marginTop: 5, display: 'block' } }, [email])
  ])
}

const MainContent = ({ snapshot }) => {
  return div({ style: { ...styles.content, width: '100%', marginTop: 0 } }, [
    h1({ style: { lineHeight: '1.5em' } }, [snapshot['dct:title']]),
    snapshot['dct:description'],
    h2({ className: 'sr-only' }, ['Snapshot Sources']),
    div({ style: { display: 'flex', width: '100%', flexWrap: 'wrap' } }, [
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Data release policy']),
        snapshot.dataReleasePolicy.label,
        snapshot.dataReleasePolicy.desc && div({ style: { fontSize: '0.625rem', lineHeight: '0.625rem' } }, [snapshot.dataReleasePolicy.desc])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Last Updated']),
        Utils.makeStandardDate(snapshot['dct:modified'])
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
              ['gcp', () => h(GcpLogo, { title: 'Google Cloud Platform', ...cloudIconProps })],
              ['azure', () => h(AzureLogo, { title: 'Microsoft Azure', ...cloudIconProps })]
            )
          ]),
          _.uniqBy('cloudPlatform', snapshot.storage)
        )
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Contact']),
        _.map(makeContactCard, snapshot.contacts)
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Data curator']),
        _.map(makeContactCard, snapshot.curators)
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Contributors']),
        div({ style: { whiteSpace: 'pre' } }, [_.join('\n', snapshot.contributorNames)])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Region']),
        div({ style: { whiteSpace: 'pre' } }, [_.flow(_.map('region'), _.uniq, _.join('\n'))(snapshot.storage)])
      ])
    ])

  ])
}

const Sidebar = ({ snapshot, id, setShowRequestAccessModal }) => {
  const { access } = snapshot

  return div({ style: { ...styles.content, width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
    h2({ className: 'sr-only' }, ['Snapshot Data Details']),
    div({ style: { backgroundColor: 'white', padding: 20, paddingTop: 0, width: '100%', border: '2px solid #D6D7D7', borderRadius: 5 } }, [
      div([
        h3(['Access type']),
        div([
          Utils.switchCase(access,
            [snapshotAccessTypes.CONTROLLED, () => h(ButtonSecondary, {
              style: { fontSize: 16, textTransform: 'none', height: 'unset' },
              onClick: () => {
                setShowRequestAccessModal(true)
                Ajax().Metrics.captureEvent(`${Events.catalogRequestAccess}:popUp`, {
                  snapshotId: _.get('dct:identifier', snapshot),
                  snapshotName: snapshot['dct:title']
                })
              }
            }, [
              icon('lock', { size: 18, style: { marginRight: 10, color: styles.access.controlled } }),
              'Request Access'
            ])],
            [snapshotAccessTypes.PENDING, () => div({ style: { color: styles.access.pending } }, [
              icon('unlock', { size: 18, style: { marginRight: 10 } }),
              'Pending Access'
            ])],
            [Utils.DEFAULT, () => div({ style: { color: styles.access.open } }, [
              icon('unlock', { size: 18, style: { marginRight: 10 } }),
              'Granted Access'
            ])])
        ])
      ]),
      div([
        h3({ style: styles.headers }, ['Donor size']),
        div([_.getOr(0, 'counts.donors', snapshot).toLocaleString()])
      ]),
      div([
        h3({ style: styles.headers }, ['Sample size']),
        div([_.getOr(0, 'counts.samples', snapshot).toLocaleString()])
      ]),
      div([
        h3({ style: styles.headers }, ['Data Modality']),
        div([_.join(', ', snapshot.dataModality)])
      ]),
      div([
        h3({ style: styles.headers }, ['Data type']),
        div([_.join(', ', snapshot.dataType)])
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
            }, snapshot.files),
            tr({ style: { fontWeight: 'bold', borderTop: '2px solid rgba(0,0,0,.3)' } }, [
              td(['Total']),
              td([_.sumBy('count', snapshot.files).toLocaleString()])
            ])
          ])
        ])
      ])
    ]),
    h(ButtonOutline, {
      style: { fontSize: 16, textTransform: 'none', height: 'unset', width: 230, marginTop: 20 },
      onClick: () => {
        Ajax().Metrics.captureEvent(`${Events.catalogView}:previewData`, {
          snapshotId: _.get('dct:identifier', snapshot),
          snapshotName: snapshot['dct:title']
        })
        Nav.goToPath('library-catalog-preview', { id: _.get('dct:identifier', snapshot) })
      }
    }, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
        icon('eye', { size: 22, style: { marginRight: 10 } }),
        'Preview data'
      ])
    ]),
    h(ButtonPrimary, {
      style: { fontSize: 16, textTransform: 'none', height: 'unset', width: 230, marginTop: 20 },
      onClick: () => {
        Ajax().Metrics.captureEvent(`${Events.catalogWorkspaceLink}:detailsView`, {
          snapshotId: id,
          snapshotName: snapshot['dct:title']
        })
        importDataToWorkspace([snapshot])
      }
    }, ['Link to a workspace'])
  ])
}

const DataBrowserDetails = ({ id }) => {
  const [showRequestAccessModal, setShowRequestAccessModal] = useState()
  const { dataCatalog } = useDataCatalog()
  const dataMap = _.keyBy('dct:identifier', dataCatalog)
  const snapshot = dataMap[id]

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter(activeTab),
    !snapshot ?
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
          h(MainContent, { snapshot }),
          h(Sidebar, { snapshot, id, setShowRequestAccessModal }),
          showRequestAccessModal && h(RequestDatasetAccessModal, {
            datasets: [snapshot],
            onDismiss: () => setShowRequestAccessModal(false)
          })
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
