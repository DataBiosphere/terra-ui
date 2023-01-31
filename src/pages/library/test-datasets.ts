import { Dataset } from 'src/libs/ajax/Catalog'


export const TEST_DATASET_ONE: Dataset = {
  'dct:title': 'The worlds best dataset',
  'dct:description': 'The best there ever was',
  'dct:creator': 'The hero we all need',
  'dct:issued': new Date().toDateString(),
  // The workspaces url segment is so that the dataset resolves as true for isWorkspace
  'dcat:accessURL': 'https://http.cat/#workspaces/',
  'TerraDCAT_ap:hasDataUsePermission': 'DUO:0000042',
  'TerraDCAT_ap:hasDataCollection': [
    { 'dct:title': 'The Dog Land' }, { 'dct:title': 'Cats R Us' }
  ],
  storage: [],
  counts: {},
  samples: {
    species: ['dogs', 'cats'],
    disease: ['too cute', 'aww']
  },
  fileAggregate: [
    {
      'TerraCore:hasFileFormat': 'bam',
      byteSize: 10,
      count: 2
    }, {
      'TerraCore:hasFileFormat': 'bai',
      byteSize: 3,
      count: 1
    }
  ],
  contributors: [],
  id: 'id',
  'prov:wasGeneratedBy': [
    {
      'TerraCore:hasAssayCategory': ['RNA-seq'],
      'TerraCore:hasDataModality': ['Epigenomic', 'Genomic']
    }, {
      'TerraCore:hasAssayCategory': ['RNA-seq', 'nuq-seq'],
      'TerraCore:hasDataModality': ['Transcriptomic']
    }
  ],
  accessLevel: 'owner'
}

// This dataset is designed to not match any filters that we are using in DataBrowser.test.ts
export const TEST_DATASET_TWO: Dataset = {
  'dct:title': 'The worlds worst dataset',
  'dct:description': 'What a bad dataset',
  'dct:creator': 'Some person',
  'dct:issued': new Date().toDateString(),
  'dcat:accessURL': 'https://http.cat/',
  'TerraDCAT_ap:hasDataCollection': [],
  storage: [],
  counts: {},
  samples: {},
  contributors: [],
  id: 'id',
  accessLevel: 'discoverer'
}
export const TEST_DATASETS: Dataset[] = [TEST_DATASET_ONE, TEST_DATASET_TWO]
