const _ = require('lodash/fp')
const { checkbox, click, clickable, input, fillIn, heading, findHeading, findText, gotoPage, waitForNoSpinners, signIntoTerra } = require(
  '../utils/integration-utils')
const { registerTest } = require('../utils/jest-utils')
const { withUserToken } = require('../utils/terra-sa-utils')
const { enableDataCatalog } = require('../utils/integration-helpers')
const qs = require('qs')


const getDatasetCount = async page => {
  const datasetHeading = await findHeading(page, heading({ level: 2, text: 'Datasets', isDescendant: true }))
  return datasetHeading.evaluate(node => _.toNumber(_.split('Datasets', node.textContent)[1]))
}

const testCatalogFilterFn = withUserToken(async ({ testUrl, page, token }) => {
  const searchText = 'kidney'
  const filterItem = 'acoustic neuroma'
  const secondFilterItem = 'adrenal cortex adenoma'

  await gotoPage(page, testUrl)
  await waitForNoSpinners(page)

  await setDatasetsMockValues(page)

  await findText(page, 'Browse Data')
  await click(page, clickable({ textContains: 'Browse Data' }))
  await signIntoTerra(page, { token })
  await enableDataCatalog(page)

  await findText(page, filterItem)

  const totalDatasetSize = await getDatasetCount(page)

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

  expect(page.target().url()).toContain(qs.stringify(filterItem))

  // Testing filter by multiple same facets
  await click(page, checkbox({ text: secondFilterItem, isDescendant: true }))
  const datasetSizeAfterFilter2 = await getDatasetCount(page)
  if (datasetSizeAfterFilter2 === 0) {
    throw new Error('Filters should be ORed between the same facet category in the table')
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
        samples: {
          disease: [
            'acoustic neuroma',
            'adrenal cortex adenoma'
          ]
        },
        'dct:title': 'The Single Cell Transcriptomic Landscape of Early Human Diabetic Nephropathy',
        'dct:identifier': '32cfbe46-2cd9-4b13-95c0-e2670373dd9a',
        'dct:description': 'kidney',
        accessLevel: 'reader',
        id: 'df5eadfc-207b-4b96-9121-88759bd26cd5'
      },
      {
        samples: {
          disease: [
            'acoustic neuroma'
          ]
        },
        'dct:title': 'Single cell transcriptional and chromatin accessibility profiling redefine cellular heterogeneity in the adult human kidney',
        'dct:identifier': '1b3866aa-d2a3-42cf-888d-7fb57a77c5aa',
        'dct:description': 'kidney',
        accessLevel: 'reader',
        id: 'b3b8fd1d-3911-4c92-bbdb-dbd6c3e3a379'
      },
      {
        samples: {
          disease: [
            'anxiety disorder'
          ]
        },
        'dct:title': 'Filler Item',
        'dct:identifier': '32cfbe46-2cd9-4b13-95c0-e2670373dd9b',
        'dct:description': 'no description',
        accessLevel: 'reader',
        id: 'df5eadfc-207b-4b96-9121-88759bd26cd4'
      },
      {
        samples: {
          disease: [
            'test'
          ]
        },
        'dct:title': 'Filler Item 2',
        'dct:identifier': '32cfbe46-2cd9-4b13-95c0-e2670373dd9c',
        'dct:description': 'no kidney',
        accessLevel: 'reader',
        id: 'df5eadfc-207b-4b96-9121-88759bd26cd3'
      }
    ]
  }
  return await page.evaluate(datasetsResult => {
    window.ajaxOverridesStore.set([
      {
        filter: { url: new RegExp('/api/v1/datasets(.*)', 'g') },
        fn: () => () => {
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
  targetEnvironments: ['dev', 'staging']
})
