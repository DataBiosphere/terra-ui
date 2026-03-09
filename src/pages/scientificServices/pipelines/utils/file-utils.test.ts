import { isFileBasedType } from 'src/pages/scientificServices/pipelines/utils/file-utils';

describe('file-utils', () => {
  describe('isFileBasedType', () => {
    const fileBasedTypes = ['FILE', 'MANIFEST'];

    fileBasedTypes.forEach((type) => {
      it(`returns true for ${type} type`, () => {
        expect(isFileBasedType(type)).toBe(true);
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
        expect(isFileBasedType(type)).toBe(false);
      });
    });
  });
});
