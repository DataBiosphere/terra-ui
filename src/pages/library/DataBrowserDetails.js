import _ from 'lodash/fp'
import { Fragment } from 'react'
import { b, div, h, h1, table, td, tr } from 'react-hyperscript-helpers'
import { ButtonOutline, ButtonPrimary, ButtonSecondary } from 'src/components/common'
import FooterWrapper from 'src/components/FooterWrapper'
import { centeredSpinner, icon } from 'src/components/icons'
import { libraryTopMatter } from 'src/components/library-common'
import colors from 'src/libs/colors'


const activeTab = 'browse & explore'
const styles = {
  page: { padding: 20, marginTop: 15 }
}

const getSnapshot = id => {
  return {
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
    }
  }
}

const DataBrowserDetails = routeParams => {
  const id = routeParams.id
  const snapshot = getSnapshot(id)

  return h(FooterWrapper, { alwaysShow: true }, [
    libraryTopMatter(activeTab),
    !snapshot ?
      centeredSpinner() :
      h(Fragment, [
        div({ style: { display: 'flex', flexDirection: 'row', alignItems: 'top', width: '100%' } }, [
          div({ style: styles.page }, [
            icon('angle-left', { size: 35 })
          ]),
          getMainContent(snapshot),
          getSidebar(snapshot)
        ])
      ])
  ])
}

const getMainContent = snapshot => {
  return div({ style: { ...styles.page, width: '100%', marginTop: 0 } }, [
    h1(snapshot.name, { style: { marginTop: 0 } }),
    div([JSON.stringify(snapshot)])
  ])
}

const getSidebar = snapshot => {
  return div({ style: { ...styles.page, width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' } }, [
    div({ style: { backgroundColor: 'white', padding: '15px 20px', width: '100%', border: '2px solid #D6D7D7', borderRadius: 5, lineHeight: '26px' } }, [
      div([
        b('Access type'),
        div([
          snapshot.locked ?
            h(ButtonSecondary, {
              style: { fontSize: 16, textTransform: 'none', height: 'unset' },
              onClick: () => console.log('clicked')
            }, [
              div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
                icon('lock', { size: 18, style: { marginRight: 10, color: colors.accent() } }), 'Request Access'
              ])
            ]) :
            div([icon('lock-o', { size: 18, style: { marginRight: 10, color: colors.primary() } }), 'Access Granted'])
        ])
      ]),
      div({ style: { marginTop: 10 } }, [
        b('Donor size'),
        div([(snapshot.donor.size || 0).toLocaleString()])
      ]),
      div({ style: { marginTop: 10 } }, [
        b('Sample size'),
        div([(snapshot.sample.size || 0).toLocaleString()])
      ]),
      div({ style: { marginTop: 10 } }, [
        b('Donor modality'),
        div([snapshot.donor.modality])
      ]),
      div({ style: { marginTop: 10 } }, [
        b('Data type'),
        div([snapshot.dataType])
      ]),
      div({ style: { marginTop: 10 } }, [
        b('File counts'),
        table(
          [..._.map(filetype => {
            return tr([
              td({ style: { paddingRight: 30 } }, filetype),
              td(snapshot.files.types[filetype].toLocaleString())
            ])
          }, Object.keys(snapshot.files.types)),
          tr({ style: { fontWeight: 'bold', borderTop: '2px solid rgba(0,0,0,.3)' } }, [
            td('Total'),
            td(snapshot.files.count.toLocaleString())
          ])])
      ])
    ]),
    h(ButtonOutline, {
      style: { fontSize: 16, textTransform: 'none', height: 'unset', width: 250, marginTop: 20 },
      onClick: () => console.log('clicked')
    }, [
      div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
        icon('eye', { size: 22, style: { marginRight: 10 } }), 'Preview data'
      ])
    ]),
    h(ButtonPrimary, {
      style: { fontSize: 16, textTransform: 'none', height: 'unset', width: 250, marginTop: 20 },
      onClick: () => console.log('clicked')
    }, 'Save to a workspace')
  ])
}

export const navPaths = [{
  name: 'library-details',
  path: '/library/browser/:id',
  component: DataBrowserDetails,
  title: ({ id }) => `${id} - Details`
}]
