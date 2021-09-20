import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h1, h2, h3, table, tbody, td, tr } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, ButtonSecondary, Link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon, stackedIcon } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import colors from 'src/libs/colors'
import * as Nav from 'src/libs/nav'
import * as Utils from 'src/libs/utils'
import * as tempData from 'src/pages/library/hca-sample.json'
import { RequestDatasetAccessModal } from 'src/pages/library/RequestDatasetAccessModal'


const activeTab = 'browse & explore'
const styles = {
  content: { padding: 20, marginTop: 15 },
  headers: { margin: '20px 0 0' },
  attributesColumn: { width: '22%', marginRight: 20, marginTop: 30 }
}

const getSnapshot = id => new Promise(resolve => setTimeout(() => {
  const dataMap = _.groupBy('dct:identifier', tempData.default.data)
  resolve(_.get(`${id}.0`, dataMap))
}))

const MainContent = ({ snapshot }) => {
  console.log('snapshot', snapshot)
  return div({ style: { ...styles.content, width: '100%', marginTop: 0 } }, [
    h1([_.get('dct:title', snapshot)]),
    div([
      div([_.get('dct:description', snapshot)]),
      h2({ className: 'sr-only' }, ['Snapshot Sources']),
      div({ style: { display: 'flex', width: '100%' } }, [
        div({ style: styles.attributesColumn }, [
          h3({ style: styles.headers }, ['Data release policy']),
          div([_.get('releasePolicy', snapshot)])
        ]),
        div({ style: styles.attributesColumn }, [
          h3({ style: styles.headers }, ['Region']),
          div([
            _.map(
              storage => div({ key: `region-table-${storage.region}` }, [storage.region]),
              _.uniqBy('region', snapshot.storage || [])
            )
          ])
        ]),
        div({ style: styles.attributesColumn }, [
          h3({ style: styles.headers }, ['Cloud provider']),
          div([
            _.map(
              storage => div({ key: `cloud-platform-table-${storage.cloudPlatform}` }, [storage.cloudPlatform]),
              _.uniqBy('cloudPlatform', snapshot.storage || [])
            )
          ])
        ])
      ]),
      div({ style: { display: 'flex', width: '100%' } }, [
        div({ style: styles.attributesColumn }, [
          h3({ style: styles.headers }, ['Contact']),
          div(['Eric Miron']),
          div(['University of Chicago Medical Center']),
          h(Link, { href: `mailto:fakeemail@fake.org` }, ['fakeemail@fake.org'])
        ]),
        div({ style: styles.attributesColumn }, [
          h3({ style: styles.headers }, ['Data curator']),
          div(['Will add later, after data structure is added'])
        ]),
        div({ style: styles.attributesColumn }, [
          h3({ style: styles.headers }, ['Contributors']),
          _.map(contributor => div({ key: `contributor-list_${contributor}}` }, [contributor]), _.get('contributors', snapshot))
        ]),
        div({ style: styles.attributesColumn }, [
          h3({ style: styles.headers }, ['Publications']),
          div(['Will add later, after data structure is added'])
        ])
      ])
    ])
  ])
}

const Sidebar = ({ snapshot, setShowRequestAccessModal }) => {
  return div({ style: { ...styles.content, width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
    h2({ className: 'sr-only' }, ['Snapshot Data Details']),
    div({ style: { backgroundColor: 'white', padding: 20, paddingTop: 0, width: '100%', border: '2px solid #D6D7D7', borderRadius: 5 } }, [
      div([
        h3(['Access type']),
        div([
          _.get('locked', snapshot) ?
            h(ButtonSecondary, {
              style: { fontSize: 16, textTransform: 'none', height: 'unset' },
              onClick: () => setShowRequestAccessModal(true)
            }, [
              div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
                icon('lock', { size: 18, style: { marginRight: 10, color: colors.accent() } }), 'Request Access'
              ])
            ]) :
            div([icon('lock-o', { size: 18, style: { marginRight: 10, color: colors.primary() } }), 'Access Granted'])
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
        h3({ style: styles.headers }, ['Donor modality']),
        div([_.get('donor.modality', snapshot)])
      ]),
      div([
        h3({ style: styles.headers }, ['Data type']),
        div([_.get('dataType', snapshot)])
      ]),
      div([
        h3({ style: styles.headers }, ['File counts']),
        table([
          tbody(
            [
              ..._.map(file => {
                return tr({}, [
                  td({ style: { paddingRight: 30 } }, [file['dcat:mediaType']]),
                  td([(file.count || 0).toLocaleString()])
                ])
              }, _.get('files', snapshot)),
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
      onClick: () => console.log('clicked')
    }, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
        icon('eye', { size: 22, style: { marginRight: 10 } }), 'Preview data'
      ])
    ]),
    h(ButtonPrimary, {
      style: { fontSize: 16, textTransform: 'none', height: 'unset', width: 230, marginTop: 20 },
      onClick: () => console.log('clicked')
    }, ['Save to a workspace'])
  ])
}

const DataBrowserDetails = ({ id }) => {
  const [snapshot, setSnapshot] = useState()
  const [showRequestAccessModal, setShowRequestAccessModal] = useState()

  Utils.useOnMount(() => {
    const loadData = async () => setSnapshot(await getSnapshot(id))
    loadData()
  })

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter(activeTab),
    !snapshot ?
      centeredSpinner() :
      h(Fragment, [
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'top', width: '100%', lineHeight: '26px' } }, [
          div({ style: styles.content }, [
            h(Link, { onClick: Nav.history.goBack }, [
              stackedIcon('angle-left', 'circle', {
                size: 30,
                'aria-label': 'Back',
                top: { color: colors.primary('light') },
                bot: { color: colors.primary('light'), style: { opacity: 0.2 } }
              })
            ])
          ]),
          h(MainContent, { snapshot }),
          h(Sidebar, { snapshot, setShowRequestAccessModal }),
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
  title: ({ id }) => `Catalog - Dataset Details`
}]
