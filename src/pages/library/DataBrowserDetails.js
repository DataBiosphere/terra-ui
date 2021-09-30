import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h1, h2, h3, img, span, table, tbody, td, tr } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, ButtonSecondary, Link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import TooltipTrigger from 'src/components/TooltipTrigger'
import colors from 'src/libs/colors'
import { getConfig } from 'src/libs/config'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import { RequestDatasetAccessModal } from 'src/pages/library/RequestDatasetAccessModal'
import { normalizeSnapshot, snapshotStyles } from 'src/pages/library/Snapshots'


const activeTab = 'browse & explore'
const styles = {
  ...snapshotStyles,
  content: { padding: 20, marginTop: 15 },
  headers: { margin: '20px 0 10px' },
  attributesColumn: { width: '22%', marginRight: 20, marginTop: 30 }
}

const getSnapshot = async id => {
  const list = await fetch('hca-sample.json').then(res => res.json())
  const dataMap = _.keyBy('dct:identifier', list.data)
  return new Promise(resolve => setTimeout(resolve(dataMap[id]), 1000))
}

const MainContent = ({ snapshot }) => {
  return div({ style: { ...styles.content, width: '100%', marginTop: 0 } }, [
    h1({ style: { lineHeight: '1.5em' } }, [_.get('dct:title', snapshot)]),
    div([_.get('dct:description', snapshot)]),
    h2({ className: 'sr-only' }, ['Snapshot Sources']),
    div({ style: { display: 'flex', width: '100%', flexWrap: 'wrap' } }, [
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Data release policy']),
        div([_.get('dataReleasePolicy', snapshot)])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Last Updated']),
        div([Utils.makeStandardDate(_.get('dct:modified', snapshot))])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Version']),
        div(['1.0'])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Cloud provider']),
        div([
          _.map(
            storage => div({ key: `cloud-platform-table-${storage.cloudPlatform}` }, [
              Utils.cond(
                [storage.cloudPlatform === 'gcp', () => img({ src: 'logos/gcp.svg', alt: 'Google Cloud Platform', style: { maxHeight: 25, maxWidth: 150 } })],
                [storage.cloudPlatform === 'azure', () => img({ src: 'logos/azure.svg', alt: 'Microsoft Azure', style: { maxHeight: 25, maxWidth: 150 } })]
              )
            ]),
            _.uniqBy('cloudPlatform', snapshot.storage)
          )
        ])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Contact']),
        _.map(contact => div({ key: `data-curator_${contact.contactName}`, style: { marginBottom: 30 } }, [
          contact.contactName,
          contact.institution && div({ style: { marginTop: 5 } }, [contact.institution]),
          contact.email && h(Link, { href: contact.email, style: { marginTop: 5, display: 'block' } }, [contact.email])
        ]), snapshot.contacts)
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Data curator']),
        _.map(curator => div({ key: `data-curator_${curator.contactName}`, style: { marginBottom: 30 } }, [
          curator.contactName,
          curator.institution && div({ style: { marginTop: 5 } }, [curator.institution]),
          curator.email && h(Link, { href: curator.email, style: { marginTop: 5, display: 'block' } }, [curator.email])
        ]), snapshot.curators)
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Contributors']),
        div({ style: { whiteSpace: 'pre' } }, [snapshot.contributors.join('\n')])
      ]),
      div({ style: styles.attributesColumn }, [
        h3({ style: styles.headers }, ['Region']),
        div({ style: { whiteSpace: 'pre' } }, _.map('region', _.uniqBy('region', snapshot.storage)).join('\n'))
      ])
    ])

  ])
}

const Sidebar = ({ snapshot, setShowRequestAccessModal }) => {
  const { access } = snapshot

  return div({ style: { ...styles.content, width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
    h2({ className: 'sr-only' }, ['Snapshot Data Details']),
    div({ style: { backgroundColor: 'white', padding: 20, paddingTop: 0, width: '100%', border: '2px solid #D6D7D7', borderRadius: 5 } }, [
      div([
        h3(['Access type']),
        div([
          Utils.cond(
            [access === 'Controlled', () => h(ButtonSecondary, {
              style: { fontSize: 16, textTransform: 'none', height: 'unset' },
              onClick: () => setShowRequestAccessModal(true)
            }, [
              icon('lock', { size: 18, style: { marginRight: 10, color: styles.access.controlled } }),
              'Request Access'
            ])],
            [access === 'Pending', () => div({ style: { color: styles.access.pending } }, [
              icon('unlock', { size: 18, style: { marginRight: 10 } }),
              'Pending Access'
            ])],
            () => div({ style: { color: styles.access.open } }, [
              icon('unlock', { size: 18, style: { marginRight: 10 } }),
              'Open Access'
            ])
          )
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
        div([_.join(', ', _.get('dataModality', snapshot))])
      ]),
      div([
        h3({ style: styles.headers }, ['Data type']),
        div([_.join(', ', _.get('dataType', snapshot))])
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
            }, _.get('files', snapshot)),
            tr({ style: { fontWeight: 'bold', borderTop: '2px solid rgba(0,0,0,.3)' } }, [
              td(['Total']),
              td([_.sumBy('count', _.get('files', snapshot)).toLocaleString()])
            ])
          ])
        ])
      ])
    ]),
    h(TooltipTrigger, { content: 'Coming soon!' }, [
      h(ButtonOutline, {
        disabled: true,
        style: { fontSize: 16, textTransform: 'none', height: 'unset', width: 230, marginTop: 20, hover: 'none',
          color: colors.dark(1)
        },
        hover: { backgroundColor: colors.dark(0.25), cursor: 'default' }
        // onClick: () => Nav.goToPath('library-catalog-preview', { id: _.get('dct:identifier', snapshot) })
      }, [
        div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
          icon('eye', { size: 22, style: { marginRight: 10 } }),
          'Preview data'
        ])
      ])
    ]),
    h(ButtonPrimary, {
      style: { fontSize: 16, textTransform: 'none', height: 'unset', width: 230, marginTop: 20 },
      onClick: () => {
        Nav.history.push({
          pathname: Nav.getPath('import-data'),
          search: `?url=${getConfig().dataRepoUrlRoot}&snapshotId=REPLACE_ME&snapshotName=${snapshot['dct:title']}&format=snapshot`
        })
      }
    }, ['Save to a workspace'])
  ])
}

const DataBrowserDetails = ({ id }) => {
  const [snapshot, setSnapshot] = useState()
  const [showRequestAccessModal, setShowRequestAccessModal] = useState()

  Utils.useOnMount(() => {
    const loadData = async () => setSnapshot(normalizeSnapshot(await getSnapshot(id)))
    loadData()
  })

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
          h(Sidebar, { snapshot, setShowRequestAccessModal }),
          showRequestAccessModal && h(RequestDatasetAccessModal, {
            datasets: [snapshot],
            onDismiss: () => {
              setShowRequestAccessModal(false)
              snapshot.access = 'Pending'
            }
          })
        ])
      ])
  ])
}

export const navPaths = [{
  name: 'library-details',
  path: '/library/browser/:id',
  component: DataBrowserDetails,
  title: ({ id }) => `Catalog - Dataset Details`
}]
