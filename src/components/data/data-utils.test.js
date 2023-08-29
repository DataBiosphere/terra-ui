import { entityAttributeText, getDownloadCommand, getRootTypeForSetTable, getSuggestedTableName } from 'src/components/data/data-utils';

describe('getRootTypeForSetTable', () => {
  it('gets member type for set tables', () => {
    expect(getRootTypeForSetTable('sample_set')).toBe('sample');
  });

  it('gets member type for nested set tables', () => {
    expect(getRootTypeForSetTable('sample_set_set')).toBe('sample');
  });
});

describe('getDownloadCommand', () => {
  it('gets download command for gsutil', () => {
    expect(getDownloadCommand('test.txt', 'gs://demo-data/test.txt')).toBe("gsutil cp 'gs://demo-data/test.txt' test.txt");
  });

  it('gets download command for azcopy', () => {
    expect(
      getDownloadCommand('test.txt', 'https://lz8a3d793f17ede9b79635cc.blob.core.windows.net/sc-4b638f1f-b0a3-4161-a3fa-70e48edd981d/test.txt')
    ).toBe("azcopy copy 'https://lz8a3d793f17ede9b79635cc.blob.core.windows.net/sc-4b638f1f-b0a3-4161-a3fa-70e48edd981d/test.txt' test.txt");
  });
});

describe('entityAttributeText', () => {
  describe('basic data types', () => {
    it('returns value for strings', () => {
      expect(entityAttributeText('abc')).toEqual('abc');
      expect(entityAttributeText({ items: ['a', 'b', 'c'], itemsType: 'AttributeValue' })).toEqual('a, b, c');
    });

    it('returns stringified value for numbers', () => {
      expect(entityAttributeText(42)).toEqual('42');
      expect(entityAttributeText({ items: [1, 2, 3], itemsType: 'AttributeValue' })).toEqual('1, 2, 3');
    });

    it('returns stringified value for booleans', () => {
      expect(entityAttributeText(true)).toEqual('true');
      expect(entityAttributeText(false)).toEqual('false');
      expect(entityAttributeText({ items: [true, false], itemsType: 'AttributeValue' })).toEqual('true, false');
    });

    it('returns entity name for references', () => {
      expect(entityAttributeText({ entityType: 'thing', entityName: 'thing_one' })).toEqual('thing_one');
      expect(
        entityAttributeText({
          items: [
            { entityType: 'thing', entityName: 'thing_one' },
            { entityType: 'thing', entityName: 'thing_two' },
          ],
          itemsType: 'EntityReference',
        })
      ).toEqual('thing_one, thing_two');
    });
  });

  it('formats missing values', () => {
    expect(entityAttributeText(undefined)).toEqual('');
  });

  it('formats empty lists', () => {
    expect(entityAttributeText({ items: [], itemsType: 'AttributeValue' })).toEqual('');
  });

  it('can return JSON encoded list items', () => {
    expect(entityAttributeText({ items: ['a', 'b', 'c'], itemsType: 'AttributeValue' }, true)).toEqual('["a","b","c"]');
    expect(entityAttributeText({ items: [1, 2, 3], itemsType: 'AttributeValue' }, true)).toEqual('[1,2,3]');
    expect(
      entityAttributeText(
        {
          items: [
            { entityType: 'thing', entityName: 'thing_one' },
            { entityType: 'thing', entityName: 'thing_two' },
          ],
          itemsType: 'EntityReference',
        },
        true
      )
    ).toEqual('[{"entityType":"thing","entityName":"thing_one"},{"entityType":"thing","entityName":"thing_two"}]');
  });

  describe('JSON values', () => {
    it('stringifies arrays containing basic data types', () => {
      expect(entityAttributeText(['one', 'two', 'three'])).toEqual('["one","two","three"]');
    });

    it('stringifies empty arrays', () => {
      expect(entityAttributeText([])).toEqual('[]');
    });

    it('stringifies arrays of objects', () => {
      expect(entityAttributeText([{ key1: 'value1' }, { key2: 'value2' }, { key3: 'value3' }])).toEqual(
        '[{"key1":"value1"},{"key2":"value2"},{"key3":"value3"}]'
      );
    });

    it('stringifies objects', () => {
      expect(entityAttributeText({ key: 'value' })).toEqual('{"key":"value"}');
    });
  });
});

describe('getSuggestedTableName', () => {
  it('returns first column heading', () => {
    // Arrange
    const tsv = 'foo\tbar\tbaz\n1\t2\t3\n';

    // Act
    const suggestedTableName = getSuggestedTableName(tsv);

    // Assert
    expect(suggestedTableName).toBe('foo');
  });

  it('removes _id suffix', () => {
    // Arrange
    const tsv = 'sample_id\tnumber\nfoo\t1\nbar\t2\nbaz\t3\n';

    // Act
    const suggestedTableName = getSuggestedTableName(tsv);

    // Assert
    expect(suggestedTableName).toBe('sample');
  });

  it('removes entity: prefix', () => {
    // Arrange
    const tsv = 'entity:sample_id\tnumber\nfoo\t1\nbar\t2\nbaz\t3\n';

    // Act
    const suggestedTableName = getSuggestedTableName(tsv);

    // Assert
    expect(suggestedTableName).toBe('sample');
  });

  it('handles one column heading', () => {
    // Arrange
    const tsv = 'sample_id\nfoo\nbar\nbaz\n';

    // Act
    const suggestedTableName = getSuggestedTableName(tsv);

    // Assert
    expect(suggestedTableName).toBe('sample');
  });

  it('returns undefined if no name can be determined', () => {
    // Arrange
    const notATsv = 'abcdefghijklmnopqrstuvwxyz';

    // Act
    const suggestedTableName = getSuggestedTableName(notATsv);

    // Assert
    expect(suggestedTableName).toBe(undefined);
  });
});
