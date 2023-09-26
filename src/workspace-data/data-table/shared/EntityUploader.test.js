import { getSuggestedTableName } from './EntityUploader';

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
