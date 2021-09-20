import _ from 'lodash/fp'
import { Fragment, useState } from 'react'
import { div, h, h1, h2, h3, table, tbody, td, tr } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, ButtonSecondary, Link } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import colors from 'src/libs/colors'
import * as Utils from 'src/libs/utils'
import { RequestDatasetAccessModal } from 'src/pages/library/RequestDatasetAccessModal'


const activeTab = 'browse & explore'
const styles = {
  content: { padding: 20, marginTop: 15 },
  headers: { margin: '20px 0 0' },
  attributesColumn: { width: '22%', marginRight: 20, marginTop: 30 }
}

const getSnapshot = id => new Promise(resolve => setTimeout(() => {
  resolve({
    namespace: 'harry-potter',
    name: 'Harry Potter',
    created: '2020-01-07T18:25:28.340Z',
    lastUpdated: '2020-01-07T18:25:28.340Z',
    tags: {
      itemsType: 'AttributeValue',
      items: ['1000 Genomes', 'CMG', 'Open Access', 'Exome']
    },
    description: 'The boy who lived',
    lowerName: 'harry potter',
    lowerDescription: 'lower description',
    project: {
      id: '112',
      name: 'CDC'
    },
    subjects: 10,
    dataType: 'RNA Seq',
    keepCollapsed: true,
    locked: true,
    donor: {
      size: 1202,
      modality: 'Exome'
    },
    sample: {
      size: 10593
    },
    files: {
      count: 15,
      size: 4432,
      types: {
        bam: 42,
        cram: 11,
        vcf: 20,
        tar: 1
      }
    },
    releasePolicy: 'GRU',
    region: 'Multi-region - US',
    cloudProvider: 'Azure',
    contributors: ['Erin Dogra', 'Jinzhou Zuanoh', 'Donna Bechard', 'Yim Lang Ching', 'David Smith', 'Peter Hanna', 'Pupsa Shape', 'Joel Szabo']
  })
}))

const MainContent = ({ snapshot }) => {
  return div({ style: { ...styles.content, width: '100%', marginTop: 0 } }, [
    h1([snapshot.name]),
    div([
      div([snapshot.description]),
      div({ style: { marginTop: 30 } }, [JSON.stringify(snapshot)]),
      h2({ className: 'sr-only' }, ['Snapshot Sources']),
      div({ style: { display: 'flex', width: '100%' } }, [
        div({ style: styles.attributesColumn }, [
          h3({ style: styles.headers }, ['Data release policy']),
          div([snapshot.releasePolicy])
        ]),
        div({ style: styles.attributesColumn }, [
          h3({ style: styles.headers }, ['Region']),
          div([snapshot.region])
        ]),
        div({ style: styles.attributesColumn }, [
          h3({ style: styles.headers }, ['Cloud provider']),
          div([snapshot.cloudProvider])
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
          _.map(contributor => div({ key: `contributor-list_${contributor}}` }, [contributor]), snapshot.contributors)
        ]),
        div({ style: styles.attributesColumn }, [
          h3({ style: styles.headers }, ['Publications']),
          div(['Will add later, after data structure is added'])
        ])
      ])
    ])
  ])
}

const Sidebar = ({ snapshot }) => {
  const [showRequestAccessModal, setShowRequestAccessModal] = useState()

  return div({ style: { ...styles.content, width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
    h2({ className: 'sr-only' }, ['Snapshot Data Details']),
    div({ style: { backgroundColor: 'white', padding: 20, paddingTop: 0, width: '100%', border: '2px solid #D6D7D7', borderRadius: 5 } }, [
      div([
        h3(['Access type']),
        div([
          snapshot.locked ?
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
        div([(snapshot.donor.size || 0).toLocaleString()])
      ]),
      div([
        h3({ style: styles.headers }, ['Sample size']),
        div([(snapshot.sample.size || 0).toLocaleString()])
      ]),
      div([
        h3({ style: styles.headers }, ['Donor modality']),
        div([snapshot.donor.modality])
      ]),
      div([
        h3({ style: styles.headers }, ['Data type']),
        div([snapshot.dataType])
      ]),
      div([
        h3({ style: styles.headers }, ['File counts']),
        table([
          tbody(
            [..._.map(filetype => {
              return tr({ key: `filetype-table-row_${filetype}` }, [
                td({ style: { paddingRight: 30 } }, [filetype]),
                td([snapshot.files.types[filetype].toLocaleString()])
              ])
            }, _.keys(snapshot.files.types)),
            tr({ style: { fontWeight: 'bold', borderTop: '2px solid rgba(0,0,0,.3)' } }, [
              td(['Total']),
              td([snapshot.files.count.toLocaleString()])
            ])]
          )
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
    }, ['Save to a workspace']),
    showRequestAccessModal && h(RequestDatasetAccessModal, {
      datasets: [snapshot],
      onDismiss: () => setShowRequestAccessModal(false)
    })
  ])
}

const DataBrowserDetails = ({ id }) => {
  const [snapshot, setSnapshot] = useState()

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
            icon('angle-left', { size: 35 })
          ]),
          h(MainContent, { snapshot }),
          h(Sidebar, { snapshot })
        ])
      ])
  ])
}

export const navPaths = [{
  name: 'library-details',
  path: '/library/browser/:id',
  component: DataBrowserDetails,
  title: ({ id }) => `${id} - Details`
}]
