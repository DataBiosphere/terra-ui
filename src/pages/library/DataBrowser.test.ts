import * as _ from 'lodash/fp'
import {
  convertColsToSettings,
  convertSettingsToCols, extractCatalogFilters
} from 'src/pages/library/DataBrowser'
import { TEST_DATASET_ONE, TEST_DATASET_TWO, TEST_DATASETS } from 'src/pages/library/test-datasets'


const settings = [{ name: 'Consortiums', key: 'consortiums', visible: true },
  { name: 'Species', key: 'species', visible: false }]
const cols = ['consortiums']
const expectedFilterSectionsAndValuesForTestDatasets = [
  {
    header: 'Access type',
    values: ['Granted', 'Controlled']
  },
  {
    header: 'Consortium',
    values: ['The Dog Land', 'Cats R Us']
  },
  {
    header: 'Data use policy',
    values: ['DUO:0000042']
  },
  {
    header: 'Data modality',
    values: ['Epigenomic', 'Genomic', 'Transcriptomic']
  },
  {
    header: 'Assay category',
    values: ['nuq-seq', 'RNA-seq']
  },
  {
    header: 'File type',
    values: ['bam', 'bai']
  },
  {
    header: 'Disease',
    values: ['too cute', 'aww']
  },
  {
    header: 'Species',
    values: ['dogs', 'cats']
  }
]
const expectedFilterHeaders = _.map(expectedFilterSection => expectedFilterSection.header, expectedFilterSectionsAndValuesForTestDatasets)


describe('DataBrowser', () => {
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
    const extractCatalogFiltersResultHeaders = _.map(filter => filter.header, extractCatalogFilters(TEST_DATASETS))
    // Assert
    _.forEach(expectedHeader => expect(extractCatalogFiltersResultHeaders).toContain(expectedHeader), expectedFilterHeaders)
  })

  it('generates the correct values for each filter section', () => {
    // Act
    const extractCatalogFiltersResult = extractCatalogFilters(TEST_DATASETS)
    // Assert
    _.forEach(sectionAndValues => {
      const filter = _.find(filter => filter.header === sectionAndValues.header, extractCatalogFiltersResult)
      if (filter !== undefined) {
        _.forEach(value => expect(filter.values).toContain(value), sectionAndValues.values)
      } else {
        fail(`Section ${sectionAndValues.header} did not appear as was expected`)
      }
    }, expectedFilterSectionsAndValuesForTestDatasets)
  })

  _.forEach(header => {
    it(`generates a working matchBy function for the filter for ${header}`, () => {
      // Arrange
      const extractCatalogFiltersResult = extractCatalogFilters(TEST_DATASETS)
      const section = _.find(filterSection => filterSection.header === header, extractCatalogFiltersResult)
      if (section === undefined) {
        fail(`Section ${header} did not appear as was expected`)
      } else {
        // Act
        const matchesDatasetOne = section.matchBy(TEST_DATASET_ONE, section.values[0])
        const matchesDatasetTwo = section.matchBy(TEST_DATASET_TWO, section.values[0])
        // Assert
        expect(matchesDatasetOne).toBeTruthy()
        expect(matchesDatasetTwo).toBeFalsy()
      }
    })
  }, expectedFilterHeaders)
})
