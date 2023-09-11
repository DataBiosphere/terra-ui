import { readFileAsText } from './io-utils';

describe('readFileAsText', () => {
  it('returns file contents', async () => {
    // Arrange
    const file = new File(['Hello world'], 'test-file.txt');

    // Act
    const content = await readFileAsText(file);

    // Assert
    expect(content).toEqual('Hello world');
  });
});
