const _ = require('lodash/fp')
const { checkbox, click, clickable, input, fillIn, heading, findHeading, findText } = require('../utils/integration-utils')
const { enableDataCatalog } = require('../utils/integration-helpers')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')


const getDatasetCount = async page => {
  const datasetHeading = await findHeading(page, heading({ level: 2, text: 'Datasets', isDescendant: true }))
  return datasetHeading.evaluate(node => _.toNumber(_.split('Datasets', node.textContent)[1]))
}

const testCatalogFilterFn = withUserToken(async ({ testUrl, page, token }) => {
  const searchText = 'kidney'
  const filterItem = 'acoustic neuroma'
  const secondFilterItem = 'adrenal cortex adenoma'

  await enableDataCatalog(page, testUrl, token)
  await setDatasetsMockValues(page)
  await click(page, clickable({ textContains: 'datasets' }))
  await click(page, clickable({ textContains: 'BETA Data Catalog OFF' }))
  await findText(page, filterItem)

  const totalDatasetSize = await getDatasetCount(page)
  console.log(totalDatasetSize)

  // Testing filter by search text
  await fillIn(page, input({ labelContains: 'Search Datasets' }), searchText)
  await page.keyboard.press('Enter')
  const datasetSizeAfterSearch = await getDatasetCount(page)

  if (datasetSizeAfterSearch >= totalDatasetSize) {
    throw new Error(`Rows not filtered after searching for '${searchText}'`)
  }

  // Testing filter by facet
  await click(page, checkbox({ text: filterItem, isDescendant: true }))
  const datasetSizeAfterFilter = await getDatasetCount(page)

  if (datasetSizeAfterFilter >= datasetSizeAfterSearch) {
    throw new Error(`Filter for '${filterItem}' was not applied to the table`)
  }

  // Testing filter by multiple same facets
  await click(page, checkbox({ text: secondFilterItem, isDescendant: true }))
  const datasetSizeAfterFilter2 = await getDatasetCount(page)
  if (datasetSizeAfterFilter2 === 0) {
    throw new Error(`Filters should be ORed between the same facet category in the table'`)
  }

  // Testing clearing filters
  await click(page, clickable({ textContains: 'clear' }))
  const datasetSizeAfterClear = await getDatasetCount(page)
  if (datasetSizeAfterClear !== datasetSizeAfterSearch) {
    throw new Error(`Clear Filter was not applied to the table, ${datasetSizeAfterClear}, ${datasetSizeAfterSearch}`)
  }
})

const setDatasetsMockValues = async page => {
  const datasetsResult = {
    result: [
      {
        files: [
          {
            count: 28,
            'dcat:byteSize': 173929092601,
            'dcat:mediaType': 'fastq.gz'
          },
          {
            count: 1,
            'dcat:byteSize': 1487226880,
            'dcat:mediaType': 'tar'
          }
        ],
        counts: {
          files: 29,
          donors: 6,
          samples: 6
        },
        samples: {
          genus: [
            'Homo sapiens'
          ],
          disease: [
            'acoustic neuroma',
            'adrenal cortex adenoma',
            'anxiety disorder'
          ]
        },
        storage: [
          {
            region: 'us-central1',
            cloudPlatform: 'gcp',
            cloudResource: 'bigquery'
          },
          {
            region: 'us-east4',
            cloudPlatform: 'gcp',
            cloudResource: 'firestore'
          },
          {
            region: 'us-central1',
            cloudPlatform: 'gcp',
            cloudResource: 'bucket'
          }
        ],
        'dct:title': 'The Single Cell Transcriptomic Landscape of Early Human Diabetic Nephropathy',
        'dct:issued': '2019-09-04T18:59:09.150000Z',
        'dct:creator': {
          'foaf:name': 'Human Cell Atlas'
        },
        contributors: [],
        'dct:modified': '2021-10-20T09:03:21.280000Z',
        'dcat:accessURL': 'https://jade.datarepo-dev.broadinstitute.org/snapshots/details/32cfbe46-2cd9-4b13-95c0-e2670373dd9a',
        'dct:identifier': '32cfbe46-2cd9-4b13-95c0-e2670373dd9a',
        'dct:description': 'kidney',
        'prov:wasGeneratedBy': [
          {
            'TerraCore:hasAssayType': [
              '10X 5\' v2 sequencing'
            ]
          },
          {
            'TerraCore:hasDataModality': [
              'TerraCoreValueSets:Transcriptomic'
            ]
          },
          {
            'TerraCore:hasAssayCategory': [
              'snRNA-seq'
            ]
          }
        ],
        'TerraDCAT_ap:hasDataCollection': [
          {
            'dct:title': 'Human Cell Atlas',
            'dct:issued': '2022-04-15T14:13:17.131257',
            'dct:creator': {
              'foaf:name': 'Human Cell Atlas'
            },
            'dct:modified': '2022-04-15T14:13:17.131259',
            'dct:publisher': 'Human Cell Atlas',
            'dct:identifier': 'HCA',
            'dct:description': 'The Human Cell Atlas (HCA) data collection contains comprehensive reference maps of all human cells - the fundamental units of life - as a basis for understanding fundamental human biological processes and diagnosing, monitoring, and treating disease.'
          }
        ],
        'TerraDCAT_ap:hasDataUsePermission': [
          'TerraCore:NoRestriction'
        ],
        'TerraDCAT_ap:hasOriginalPublication': [
          {
            'dct:title': 'The Single Cell Transcriptomic Landscape of Early Human Diabetic Nephropathy',
            'dcat:accessURL': 'https://www.pnas.org/content/116/39/19619'
          }
        ],
        accessLevel: 'reader',
        id: 'df5eadfc-207b-4b96-9121-88759bd26cd5'
      }
    ]
  }
  return await page.evaluate(datasetsResult => {
    window.ajaxOverridesStore.set([
      {
        filter: { url: new RegExp(`/api/v1/datasets(.*)`, 'g') },
        fn: () => () => {
          console.log('called mock function')
          console.log(JSON.stringify([datasetsResult]))
          return Promise.resolve(new Response(JSON.stringify(datasetsResult), { status: 200 }))
        }
      }
    ])
  }, datasetsResult)
}

registerTest({
  name: 'run-catalog-filter',
  fn: testCatalogFilterFn,
  timeout: 2 * 60 * 1000,
  targetEnvironments: ['local', 'dev']
})
