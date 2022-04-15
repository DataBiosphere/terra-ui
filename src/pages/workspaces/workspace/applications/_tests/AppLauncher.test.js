import { getDisplayList } from 'src/pages/workspaces/workspace/applications/AppLauncher'


const analyses = [
  {
    kind: 'storage#object',
    id: 'fc-703dc22f-e644-4349-b613-87f20a385429/notebooks/testA.Rmd/1650041141891593',
    selfLink: 'https://www.googleapis.com/storage/v1/b/fc-703dc22f-e644-4349-b613-87f20a385429/o/notebooks%2FtestA.Rmd',
    mediaLink: 'https://storage.googleapis.com/download/storage/v1/b/fc-703dc22f-e644-4349-b613-87f20a385429/o/notebooks%2FtestA.Rmd?generation=1650041141891593&alt=media',
    name: 'notebooks/testA.Rmd',
    bucket: 'fc-703dc22f-e644-4349-b613-87f20a385429',
    generation: '1650041141891593',
    metageneration: '29',
    contentType: 'application/octet-stream',
    storageClass: 'STANDARD',
    size: '830',
    md5Hash: 'oOU8DFHszwwo9BbLKxmOyw==',
    crc32c: '6sSeiw==',
    etag: 'CImkgqHClvcCEB0=',
    temporaryHold: false,
    eventBasedHold: false,
    timeCreated: '2022-04-15T16:45:41.962Z',
    updated: '2022-04-15T17:03:58.139Z',
    timeStorageClassUpdated: '2022-04-15T16:45:41.962Z',
    customTime: '1970-01-01T00:00:00Z',
    metadata:
      {
        be789c74f6bc6d9df95b9f1b7ce07b4b8b6392c1a937f3a69e2de1b508d8690d: 'doNotSync',
        lastModifiedBy: '904998e4258c146e4f94e8bd9c4689b1f759ec384199e58067bfe7efbdd79d68'
      }
  },
  {
    kind: 'storage#object',
    id: 'fc-703dc22f-e644-4349-b613-87f20a385429/notebooks/testB.Rmd/1650042135115055',
    selfLink: 'https://www.googleapis.com/storage/v1/b/fc-703dc22f-e644-4349-b613-87f20a385429/o/notebooks%2FtestB.Rmd',
    mediaLink: 'https://storage.googleapis.com/download/storage/v1/b/fc-703dc22f-e644-4349-b613-87f20a385429/o/notebooks%2FtestB.Rmd?generation=1650042135115055&alt=media',
    name: 'notebooks/testB.Rmd',
    bucket: 'fc-703dc22f-e644-4349-b613-87f20a385429',
    generation: '1650042135115055',
    metageneration: '3',
    contentType: 'application/octet-stream',
    storageClass: 'STANDARD',
    size: '825',
    md5Hash: 'BW6DMzy4jK74aB2FQikGxA==',
    crc32c: '2GXfVA==',
    etag: 'CK/qz/rFlvcCEAM=',
    timeCreated: '2022-04-15T17:02:15.185Z',
    updated: '2022-04-15T17:03:58.177Z',
    timeStorageClassUpdated: '2022-04-15T17:02:15.185Z',
    metadata:
      {
        be789c74f6bc6d9df95b9f1b7ce07b4b8b6392c1a937f3a69e2de1b508d8690d: 'doNotSync',
        lastModifiedBy: '904998e4258c146e4f94e8bd9c4689b1f759ec384199e58067bfe7efbdd79d68'
      }
  }
]
describe('getDisplayList', () => {
  expect(getDisplayList(analyses)).toBe('testA.Rmd, testB.Rmd')
})
