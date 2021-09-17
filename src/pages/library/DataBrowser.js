import _ from 'lodash/fp'
import { useState } from 'react'
import * as StateHistory from 'src/libs/state-history'
import * as Utils from 'src/libs/utils'
import { SearchAndFilterComponent } from 'src/pages/library/common'
import * as tempData from 'src/pages/library/hca-sample.json'


// Description of the structure of the sidebar. Case is preserved when rendering but all matching is case-insensitive.
const sidebarSections = [{
  name: 'Access Type',
  labels: ['Controlled Access', 'Open Access']
}, {
  name: 'Consortium',
  labels: [
    '1000 Genomes',
    'CCDG',
    'CMG',
    'Convergent Neuro',
    'GTEx (v8)',
    'HPRC',
    'PAGE',
    'WGSPD1'
  ]
}, {
  name: 'Disease',
  labels: [
    'Alzheimer\'s disease',
    'asthma',
    'autism spectrum disorder'
  ]
},
{
  name: 'Data Type',
  labels: [
    'Exome',
    'Whole Genome'
  ]
}]

const getRawList = () => new Promise(resolve => setTimeout(() => {
  resolve(tempData.default.data)
}, 2000))

const DataBrowser = () => {
  const stateHistory = StateHistory.get()
  const [catalogSnapshots, setCatalogSnapshots] = useState(stateHistory.catalogSnapshots)

  Utils.useOnMount(() => {
    const loadData = async () => {
      const rawList = await getRawList()
      const normList = _.map(snapshot => ({
        ...snapshot,
        tags: _.update(['items'], _.map(_.toLower), snapshot.tags),
        name: snapshot['dct:title'],
        description: snapshot['dct:description'],
        project: _.get('0.dct:title', snapshot['TerraDCAT_ap:hasDataCollection']),
        lastUpdated: snapshot['dct:modified'],
        lowerName: _.toLower(snapshot['dct:title']), lowerDescription: _.toLower(snapshot['dct:description'])
      }), rawList)

      setCatalogSnapshots(normList)
      StateHistory.update({ catalogSnapshots })
    }
    loadData()
  })

  return SearchAndFilterComponent(catalogSnapshots, sidebarSections, 'browse & explore', 'datasets')
}

export const navPaths = [{
  name: 'library-browser',
  path: '/library/browser',
  component: DataBrowser,
  title: 'Browse & Explore'
}]
