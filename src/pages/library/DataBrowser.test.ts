import * as _ from 'lodash/fp'
import {
  convertColsToSettings,
  convertSettingsToCols, extractCatalogFilters
} from 'src/pages/library/DataBrowser'
import { TEST_DATASETS } from 'src/pages/library/test-datasets'


const settings = [{ name: 'Consortiums', key: 'consortiums', visible: true },
  { name: 'Species', key: 'species', visible: false }]
const cols = ['consortiums']


describe('DataBrowser', () => {
  it('converts selected columns to settings', () => {
    // Avoid copying entire list of columns into this test by checking for a subset of elements.
    expect(convertColsToSettings(cols)).toEqual(expect.arrayContaining(settings))
  })

  it('converts settings to selected columns', () => {
    expect(convertSettingsToCols(settings)).toMatchObject(cols)
  })


  it('generates proper filter sections for datasets', () => {
    const extractCatalogFiltersResult = extractCatalogFilters(TEST_DATASETS)
    const expectedHeaders = ['Access type', 'Consortium', 'Data use policy', 'Data modality', 'Assay category', 'File type', 'Disease', 'Species']
    _.forEach(expectedValue => expect(_.map(filter => filter.header, extractCatalogFiltersResult)).toContain(expectedValue), expectedHeaders)
  })

  it('generates the correct values for each filter section', () => {
    const extractCatalogFiltersResult = extractCatalogFilters(TEST_DATASETS)
    const sectionsAndValues = [
      {
        header: 'Access type',
        values: ['Granted']
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

    _.forEach(sectionAndValues => {
      const filter = _.find(filter => filter.header === sectionAndValues.header, extractCatalogFiltersResult)
      if (filter !== undefined) {
        _.forEach(value => expect(filter.values).toContain(value), sectionAndValues.values)
      } else {
        fail(`Section ${sectionAndValues.header} did not appear as was expected`)
      }
    }, sectionsAndValues)
  })
})
