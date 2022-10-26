import { Ajax } from 'src/libs/ajax'
import GCSFileBrowserProvider from 'src/libs/ajax/file-browser-providers/GCSFileBrowserProvider'
import * as Utils from 'src/libs/utils'
import { asMockedFn } from 'src/test-utils'


jest.mock('src/libs/ajax')

const gcsObject = name => ({
  bucket: 'test-bucket',
  crc32c: 'crc32c',
  etag: 'etag',
  generation: '1666792590000000',
  id: `test-bucket}/${name}/1666792590000000`,
  kind: 'storage#object',
  md5Hash: 'abcdef',
  mediaLink: `https://storage.googleapis.com/download/storage/v1/b/test-bucket/o/${name}?generation=1666792590000000&alt=media`,
  metageneration: '1',
  name,
  selfLink: `https://www.googleapis.com/storage/v1/b/test-bucket/o/${name}`,
  size: '1',
  storageClass: 'STANDARD',
  timeCreated: '2022-10-26T13:56:30.000Z',
  timeStorageClassUpdated: '2022-10-26T13:56:30.000Z',
  updated: '2022-10-26T13:56:30.000Z'
})

const expectedFile = path => ({
  path,
  url: `gs://test-bucket/${path}`,
  size: 1,
  createdAt: 1666792590000,
  updatedAt: 1666792590000
})

describe('GCSFileBrowserProvider', () => {
  let list

  beforeEach(() => {
    list = jest.fn().mockImplementation((_googleProject, _bucket, _prefix, options = {}) => {
      const { pageToken } = options

      const response = Utils.switchCase(pageToken,
        [undefined, () => ({
          items: [
            gcsObject('a-file.txt'),
            gcsObject('b-file.txt')
          ],
          prefixes: [
            'a-prefix/'
          ],
          nextPageToken: '2'
        })],
        ['2', () => ({
          items: [
            gcsObject('c-file.txt'),
            gcsObject('d-file.txt')
          ],
          prefixes: [
            'b-prefix/'
          ],
          nextPageToken: '3'
        })],
        ['3', () => ({
          prefixes: [
            'c-prefix/',
            'd-prefix/'
          ]
        })],
        [Utils.DEFAULT, () => {
          throw new Error('Unrecognized page token')
        }]
      )

      return Promise.resolve(response)
    })

    asMockedFn(Ajax).mockImplementation(() => ({ Buckets: { list } } as ReturnType<typeof Ajax>))
  })

  it('pages through files (objects)', async () => {
    const backend = GCSFileBrowserProvider({ bucket: 'test-bucket', project: 'test-project', pageSize: 3 })

    const firstResponse = await backend.getFilesInDirectory('')
    expect(firstResponse.results).toEqual([
      expectedFile('a-file.txt'),
      expectedFile('b-file.txt'),
      expectedFile('c-file.txt')
    ])
    expect(firstResponse.hasNextPage).toBe(true)
    expect(list.mock.calls.length).toBe(2)

    const secondResponse = await firstResponse.getNextPage()
    expect(secondResponse.results).toEqual([
      expectedFile('a-file.txt'),
      expectedFile('b-file.txt'),
      expectedFile('c-file.txt'),
      expectedFile('d-file.txt')
    ])
    expect(secondResponse.hasNextPage).toBe(false)
    expect(list.mock.calls.length).toBe(3)
  })

  it('pages through directories (prefixes)', async () => {
    const backend = GCSFileBrowserProvider({ bucket: 'test-bucket', project: 'test-project', pageSize: 3 })

    const firstResponse = await backend.getDirectoriesInDirectory('')
    expect(firstResponse.results).toEqual([
      { path: 'a-prefix/' },
      { path: 'b-prefix/' },
      { path: 'c-prefix/' }
    ])
    expect(firstResponse.hasNextPage).toBe(true)
    expect(list.mock.calls.length).toBe(3)

    const secondResponse = await firstResponse.getNextPage()
    expect(secondResponse.results).toEqual([
      { path: 'a-prefix/' },
      { path: 'b-prefix/' },
      { path: 'c-prefix/' },
      { path: 'd-prefix/' }
    ])
    expect(secondResponse.hasNextPage).toBe(false)
    expect(list.mock.calls.length).toBe(3)
  })
})
