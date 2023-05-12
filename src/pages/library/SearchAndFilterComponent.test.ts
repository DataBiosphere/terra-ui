import * as _ from 'lodash/fp';
import {
  FilterSection,
  getMatchingDataForSection,
  getMatchingDataForSectionList,
  listItemsMatchForSectionEntry,
  sectionEntrySelected,
} from 'src/pages/library/SearchAndFilterComponent';
import { describe, expect, it } from 'vitest';

type TestStrings = 'A quick brown fox jumped over a lazy gray dog' | 'aeio' | 'stock' | 'styx' | 'xylophone';

const testStrings: Record<TestStrings, TestStrings> = {
  'A quick brown fox jumped over a lazy gray dog': 'A quick brown fox jumped over a lazy gray dog',
  aeio: 'aeio',
  stock: 'stock',
  styx: 'styx',
  xylophone: 'xylophone',
};

// Arrange
const FILTERS: FilterSection<string>[] = [
  {
    header: 'Contains vowel',
    matchBy: (listValue, sectionEntry) => _.includes(sectionEntry, listValue),
    values: ['a', 'e', 'i', 'o', 'u'],
  },
  {
    header: 'Starts with',
    matchBy: (listValue, sectionEntry) => _.startsWith(sectionEntry, listValue),
    values: ['x', 'y'],
  },
];

describe('library/common', () => {
  it('matches correctly for a section entry', () => {
    // Act
    const listItemsMatching = listItemsMatchForSectionEntry('a', FILTERS[0].matchBy, _.values(testStrings));
    // Assert
    expect(listItemsMatching).toContain(testStrings['A quick brown fox jumped over a lazy gray dog']);
    expect(listItemsMatching).toContain(testStrings.aeio);
    expect(listItemsMatching).not.toContain(testStrings.stock);
    expect(listItemsMatching).not.toContain(testStrings.styx);
    expect(listItemsMatching).not.toContain(testStrings.xylophone);
  });

  it('matches on union for a section', () => {
    // Act
    const listItemsMatching = getMatchingDataForSection(FILTERS[0], _.values(testStrings));
    // Assert
    expect(listItemsMatching).toContain(testStrings['A quick brown fox jumped over a lazy gray dog']);
    expect(listItemsMatching).toContain(testStrings.aeio);
    expect(listItemsMatching).toContain(testStrings.stock);
    expect(listItemsMatching).not.toContain(testStrings.styx);
    expect(listItemsMatching).toContain(testStrings.xylophone);
  });

  it('matches on intersection for a list of sections', () => {
    // Act
    const listItemsMatching = getMatchingDataForSectionList(FILTERS, _.values(testStrings));
    // Assert
    expect(listItemsMatching).not.toContain(testStrings['A quick brown fox jumped over a lazy gray dog']);
    expect(listItemsMatching).not.toContain(testStrings.aeio);
    expect(listItemsMatching).not.toContain(testStrings.stock);
    expect(listItemsMatching).not.toContain(testStrings.styx);
    expect(listItemsMatching).toContain(testStrings.xylophone);
  });

  it('checks properly if a section entry is selected', () => {
    // Assert
    expect(sectionEntrySelected(FILTERS[0], 'a', FILTERS)).toBeTruthy();
    expect(sectionEntrySelected(FILTERS[0], 'x', FILTERS)).toBeFalsy();
  });
});
