import * as _ from 'lodash/fp'
import {
  convertColsToSettings,
  convertSettingsToCols, extractCatalogFilters
} from 'src/pages/library/DataBrowser'
import { datasetAccessTypes } from 'src/pages/library/dataBrowser-utils'
import { TEST_DATASET_ONE, TEST_DATASET_TWO, TEST_DATASETS } from 'src/pages/library/test-datasets'


const settings = [{ name: 'Consortiums', key: 'consortiums', visible: true },
  { name: 'Species', key: 'species', visible: false }]
const cols = ['consortiums']
const expectedFilterSectionsAndValuesForTestDatasets = [
  {
    header: 'Access type',
    testAgainstValue: datasetAccessTypes.Granted,
    testSuccessfulMatch: TEST_DATASET_ONE,
    testFailureMatch: TEST_DATASET_TWO,
    values: [datasetAccessTypes.Granted, datasetAccessTypes.Controlled, datasetAccessTypes.External, datasetAccessTypes.Pending]
  },
  {
    header: 'Consortium',
    testAgainstValue: 'The Dog Land',
    testSuccessfulMatch: TEST_DATASET_ONE,
    testFailureMatch: TEST_DATASET_TWO,
    values: ['The Dog Land', 'Cats R Us']
  },
  {
    header: 'Data use policy',
    testAgainstValue: 'DUO:0000042',
    testSuccessfulMatch: TEST_DATASET_ONE,
    testFailureMatch: TEST_DATASET_TWO,
    values: ['DUO:0000042']
  },
  {
    header: 'Data modality',
    testAgainstValue: 'Epigenomic',
    testSuccessfulMatch: TEST_DATASET_ONE,
    testFailureMatch: TEST_DATASET_TWO,
    values: ['Epigenomic', 'Genomic', 'Transcriptomic']
  },
  {
    header: 'Assay category',
    testAgainstValue: 'nuq-seq',
    testSuccessfulMatch: TEST_DATASET_ONE,
    testFailureMatch: TEST_DATASET_TWO,
    values: ['nuq-seq', 'RNA-seq']
  },
  {
    header: 'File type',
    testAgainstValue: 'bam',
    testSuccessfulMatch: TEST_DATASET_ONE,
    testFailureMatch: TEST_DATASET_TWO,
    values: ['bam', 'bai']
  },
  {
    header: 'Disease',
    testAgainstValue: 'too cute',
    testSuccessfulMatch: TEST_DATASET_ONE,
    testFailureMatch: TEST_DATASET_TWO,
    values: ['too cute', 'aww']
  },
  {
    header: 'Species',
    testAgainstValue: 'dogs',
    testSuccessfulMatch: TEST_DATASET_ONE,
    testFailureMatch: TEST_DATASET_TWO,
    values: ['dogs', 'cats']
  }
]
const expectedFilterHeaders = _.map(expectedFilterSection => expectedFilterSection.header, expectedFilterSectionsAndValuesForTestDatasets)


describe('DataBrowser', () => {
  const extractCatalogFiltersResult = extractCatalogFilters(TEST_DATASETS)

  it('converts selected columns to settings', () => {
    // Avoid copying entire list of columns into this test by checking for a subset of elements.
    expect(convertColsToSettings(cols)).toEqual(expect.arrayContaining(settings))
  })

  it('converts settings to selected columns', () => {
    expect(convertSettingsToCols(settings)).toMatchObject(cols)
  })


  it('generates proper filter sections for datasets', () => {
    // Arrange is handled with test suite scoped constants
    // Act
    const extractCatalogFiltersResultHeaders = _.map(filter => filter.header, extractCatalogFiltersResult)
    // Assert
    _.forEach(expectedHeader => expect(extractCatalogFiltersResultHeaders).toContain(expectedHeader), expectedFilterHeaders)
  })

  it('generates the correct values for each filter section', () => {
    // This is asserting on values generated at the test suite level
    // Assert
    _.forEach(sectionAndValues => {
      const filter = _.find(filter => filter.header === sectionAndValues.header, extractCatalogFiltersResult)
      if (filter !== undefined) {
        expect(_.xor(filter.values, sectionAndValues.values).length).toBe(0)
      } else {
        fail(`Section ${sectionAndValues.header} did not appear as was expected`)
      }
    }, expectedFilterSectionsAndValuesForTestDatasets)
  })

  _.forEach(filterSectionAndValuesForTestDataset => {
    it(`generates a working matchBy function for the filter for ${filterSectionAndValuesForTestDataset.header}`, () => {
      // Arrange
      const section = _.find(filterSection => filterSection.header === filterSectionAndValuesForTestDataset.header, extractCatalogFiltersResult)
      if (section === undefined) {
        fail(`Section ${filterSectionAndValuesForTestDataset.header} did not appear as was expected`)
      } else {
        // Act
        const matchesDatasetOne = section.matchBy(filterSectionAndValuesForTestDataset.testSuccessfulMatch, filterSectionAndValuesForTestDataset.testAgainstValue)
        const matchesDatasetTwo = section.matchBy(filterSectionAndValuesForTestDataset.testFailureMatch, filterSectionAndValuesForTestDataset.testAgainstValue)
        // Assert
        expect(matchesDatasetOne).toBeTruthy()
        expect(matchesDatasetTwo).toBeFalsy()
      }
    })
  }, expectedFilterSectionsAndValuesForTestDatasets)
})
