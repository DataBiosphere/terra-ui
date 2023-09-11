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

  it('throws an error if read fails', async () => {
    // Arrange
    class MockFileReader {
      onError: ((err: any) => void) | null = null;

      readAsText() {
        this.onError?.(new Error('Something went wrong'));
      }
    }

    const FileReader = window.FileReader;
    window.FileReader = MockFileReader as any;

    const file = new File(['Hello world'], 'test-file.txt');

    // Act
    const result = readFileAsText(file);

    // Assert
    expect(result).rejects.toEqual(new Error('Something went wrong'));

    // Cleanup
    window.FileReader = FileReader;
  });
});
