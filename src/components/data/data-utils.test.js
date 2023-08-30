import { getDownloadCommand, getRootTypeForSetTable } from 'src/components/data/data-utils';

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
