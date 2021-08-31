import _ from 'lodash/fp'
import { SearchAndFilterComponent } from 'src/pages/library/common'


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


const DataBrowser = () => {
  const featuredList = [{
    namespace: 'test-test',
    name: 'test1',
    created: '2020-01-13T18:25:28.340Z',
    tags: {
      itemsType: 'AttributeValue',
      items: ['1000 Genomes', 'CMG', 'Open Access', 'Exome']
    },
    description: 'test1 desc',
    lowerName: 'test1',
    lowerDescription: 'test1 desc',
    keepCollapsed: true
  }, {
    namespace: 'test-test',
    name: 'test2',
    created: '2020-01-13T18:25:28.340Z',
    tags: {
      itemsType: 'AttributeValue',
      items: ['1000 Genomes', 'CCDG', 'Controlled Access', 'Whole Genome', 'asthma']
    },
    description: 'test2 desc',
    lowerName: 'test2',
    lowerDescription: 'test2 desc',
    keepCollapsed: true
  }]

  // lowercase
  const snapshots = _.map(snapshot => ({
    ...snapshot,
    tags: _.update(['items'], _.map(_.toLower), snapshot.tags),
    lowerName: _.toLower(snapshot.name), lowerDescription: _.toLower(snapshot.description)
  }), featuredList)

  return SearchAndFilterComponent(snapshots, sidebarSections, 'browse & explore')
}

export const navPaths = [{
  name: 'library-browser',
  path: '/library/browser',
  component: DataBrowser,
  title: 'Browse & Explore'
}]
