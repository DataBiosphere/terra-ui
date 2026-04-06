import { isFileLikeType } from 'src/pages/scientificServices/pipelines/utils/file-utils';

describe('file-utils', () => {
  describe('isFileLikeType', () => {
    const fileBasedTypes = ['FILE', 'MANIFEST'];

    fileBasedTypes.forEach((type) => {
      it(`returns true for ${type} type`, () => {
        expect(isFileLikeType(type)).toBe(true);
      });
    });

    const nonFileBasedTypes = [
      { type: 'STRING', description: 'STRING type' },
      { type: 'FLOAT', description: 'FLOAT type' },
      { type: 'BOOLEAN', description: 'BOOLEAN type' },
      { type: 'UNKNOWN_TYPE', description: 'unknown type' },
      { type: '', description: 'empty string' },
    ];

    nonFileBasedTypes.forEach(({ type, description }) => {
      it(`returns false for ${description}`, () => {
        expect(isFileLikeType(type)).toBe(false);
      });
    });
  });
});
