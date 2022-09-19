const _ = require('lodash/fp')
const { navigateToDataCatalog } = require('../utils/integration-helpers')
const { click, clickable, checkbox, clickTableCell, noSpinnersAfter } = require('../utils/integration-utils')


const eitherThrow = (testFailure, { cleanupFailure, cleanupMessage }) => {
  if (testFailure) {
    cleanupFailure && console.error(`${cleanupMessage}: ${cleanupFailure.message}`)
    throw testFailure
  } else if (cleanupFailure) {
    throw new Error(`${cleanupMessage}: ${cleanupFailure.message}`)
  }
}

//chance to dataset with asses
const linkDataToWorkspace = async (page, testUrl, token) => {
  await navigateToDataCatalog(page, testUrl, token)
  await click(page, checkbox({ text: 'Granted', isDescendant: true }))
  // TODO: add test data with granted access DC-321
  await clickTableCell(page, { tableName: 'dataset list', columnHeader: 'Dataset Name', text: 'Readable Catalog Snapshot 1', isDescendant: true })
  await noSpinnersAfter(page, { action: () => click(page, clickable({ textContains: 'Prepare for analysis' })) })
}

const setDatasetsMockValues = async (page, accessLevelsToInclude) => {
  const datasetsResult = [
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
  return await page.evaluate(datasetsResult => {
    window.ajaxOverridesStore.set([
      {
        filter: { url: new RegExp(`/api/v1/datasets(.*)`, 'g') },
        fn: () => () => {
          return Promise.resolve(new Response(JSON.stringify({ result: _.filter(dataset => _.includes(dataset.accessLevel, accessLevelsToInclude), datasetsResult) }), { status: 200 }))
        }
      }
    ])
  }, datasetsResult)
}

module.exports = { eitherThrow, linkDataToWorkspace, setDatasetsMockValues }
