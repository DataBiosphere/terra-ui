import { getDownloadCommand } from './uri-viewer-utils';

describe('getDownloadCommand', () => {
  it('gets download command for gcloud storage using file directory', () => {
    expect(getDownloadCommand('test.txt', 'gs://demo-data/test.txt', true)).toBe(
      "gcloud storage cp 'gs://demo-data/test.txt' test.txt"
    );
  });

  it('gets download command for gcloud storage using current directory', () => {
    expect(getDownloadCommand('test.txt', 'gs://demo-data/test.txt', false)).toBe(
      "gcloud storage cp 'gs://demo-data/test.txt' ."
    );
  });

  it('gets download command for azcopy using file directory', () => {
    expect(
      getDownloadCommand(
        'test.txt',
        'https://lz8a3d793f17ede9b79635cc.blob.core.windows.net/sc-4b638f1f-b0a3-4161-a3fa-70e48edd981d/test.txt',
        true
      )
    ).toBe(
      "azcopy copy 'https://lz8a3d793f17ede9b79635cc.blob.core.windows.net/sc-4b638f1f-b0a3-4161-a3fa-70e48edd981d/test.txt' test.txt"
    );
  });

  it('gets download command for azcopy using current directory', () => {
    expect(
      getDownloadCommand(
        'test.txt',
        'https://lz8a3d793f17ede9b79635cc.blob.core.windows.net/sc-4b638f1f-b0a3-4161-a3fa-70e48edd981d/test.txt',
        false
      )
    ).toBe(
      "azcopy copy 'https://lz8a3d793f17ede9b79635cc.blob.core.windows.net/sc-4b638f1f-b0a3-4161-a3fa-70e48edd981d/test.txt' ."
    );
  });
});
