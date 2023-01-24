import * as _ from 'lodash/fp'
import {
  FilterSection,
  getMatchingDataForSection,
  getMatchingDataForSectionList,
  listItemsMatchForSectionEntry, sectionEntrySelected
} from 'src/pages/library/SearchAndFilterComponent'


const data = ['A quick brown fox jumped over a lazy gray dog', 'aeio', 'stock', 'styx']

// Arrange
const FILTERS: FilterSection<string>[] = [
  {
    header: 'Contains vowel',
    matchBy: (listValue, sectionEntry) => _.includes(sectionEntry, listValue),
    values: ['a', 'e', 'i', 'o', 'u']
  },
  {
    header: 'Starts with',
    matchBy: (listValue, sectionEntry) => _.startsWith(sectionEntry, listValue),
    values: ['x', 'y']
  }
]

describe('library/common', () => {
  it('matches correctly for a section entry', () => {
    // Act
    const listItemsMatching = listItemsMatchForSectionEntry('a', FILTERS[0].matchBy, data)
    // Assert
    expect(listItemsMatching).toContain(data[0])
    expect(listItemsMatching).toContain(data[1])
    expect(listItemsMatching).not.toContain(data[2])
    expect(listItemsMatching).not.toContain(data[3])
  })

  it('matches on union for a section', () => {
    // Act
    const listItemsMatching = getMatchingDataForSection(FILTERS[0], data)
    // Assert
    expect(listItemsMatching).toContain(data[0])
    expect(listItemsMatching).toContain(data[1])
    expect(listItemsMatching).toContain(data[2])
    expect(listItemsMatching).not.toContain(data[3])
  })

  it('matches on intersection for a list of sections', () => {
    // Act
    const listItemsMatching = getMatchingDataForSectionList(FILTERS, data)
    // Assert
    expect(listItemsMatching).not.toContain(data[0])
    expect(listItemsMatching).not.toContain(data[1])
    expect(listItemsMatching).not.toContain(data[2])
    expect(listItemsMatching).not.toContain(data[3])
  })

  it('checks properly if a section entry is selected', () => {
    // Assert
    expect(sectionEntrySelected(FILTERS[0], 'a', FILTERS)).toBeTruthy()
    expect(sectionEntrySelected(FILTERS[0], 'x', FILTERS)).toBeFalsy()
  })
})
