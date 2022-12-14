import * as qs from 'qs'
import { fetchOk } from 'src/libs/ajax/ajax-common'
import { AzureStorageContract } from 'src/libs/ajax/AzureStorage'
import AzureBlobStorageFileBrowserProvider from 'src/libs/ajax/file-browser-providers/AzureBlobStorageFileBrowserProvider'
import { FileBrowserDirectory, FileBrowserFile } from 'src/libs/ajax/file-browser-providers/FileBrowserProvider'
import * as Utils from 'src/libs/utils'
import { asMockedFn } from 'src/testing/test-utils'


jest.mock('src/libs/ajax/ajax-common', () => ({
  fetchOk: jest.fn(),
}))

jest.mock('src/libs/ajax/AzureStorage', () => ({
  AzureStorage: () => ({
    details: jest.fn(() => Promise.resolve({
      location: 'Unknown',
      storageContainerName: 'test-storage-container',
      sas: {
        token: 'tokenPlaceholder=value',
        url: 'https://terra-ui-test.blob.core.windows.net/test-storage-container?tokenPlaceholder=value',
      },
    })),
  }) as Partial<AzureStorageContract>,
}))

const blobXml = (name: string): string => {
  return `
    <Blob>
      <Name>${name}</Name>
      <Properties>
        <Creation-Time>Wed, 07 Dec 2022 23:25:00 GMT</Creation-Time>
        <Last-Modified>Wed, 07 Dec 2022 23:30:00 GMT</Last-Modified>
        <Etag>0x8DAD8AA481719B0</Etag>
        <Content-Length>1</Content-Length>
        <Content-Type>text/plain</Content-Type>
        <Content-Encoding />
        <Content-Language />
        <Content-CRC64 />
        <Content-MD5>1B2M2Y8AsgTpgAmY7PhCfg==</Content-MD5>
        <Cache-Control />
        <Content-Disposition />
        <BlobType>BlockBlob</BlobType>
        <AccessTier>Hot</AccessTier>
        <AccessTierInferred>true</AccessTierInferred>
        <LeaseStatus>unlocked</LeaseStatus>
        <LeaseState>available</LeaseState>
        <ServerEncrypted>true</ServerEncrypted>
      </Properties>
      <OrMetadata />
    </Blob>`
}

const blobPrefixXml = (name: string): string => {
  return `
    <BlobPrefix>
      <Name>${name}</Name>
    </BlobPrefix>`
}

const expectedFile = (path: string): FileBrowserFile => ({
  path,
  url: `https://terra-ui-test.blob.core.windows.net/test-storage-container/${path}`,
  size: 1,
  createdAt: 1670455500000,
  updatedAt: 1670455800000,
})

describe('AzureBlobStorageFileBrowserProvider', () => {
  describe('listing files/directories', () => {
    beforeAll(() => {
      asMockedFn(fetchOk).mockImplementation(url => {
        const { marker } = qs.parse(new URL(url).search)

        const responseXml = Utils.switchCase(marker,
          [undefined, () => {
            return `
              <EnumerationResults ServiceEndpoint="https://terra-ui-test.blob.core.windows.net/" ContainerName="test-storage-container">
                <MaxResults>1000</MaxResults>
                <Delimiter>/</Delimiter>
                <Blobs>
                  ${blobXml('a-file.txt')}
                  ${blobPrefixXml('a-prefix/')}
                  ${blobXml('b-file.txt')}
                </Blobs>
                <NextMarker>2</NextMarker>
              </EnumerationResults>
            `
          }],
          ['2', () => {
            return `
              <EnumerationResults ServiceEndpoint="https://terra-ui-test.blob.core.windows.net/" ContainerName="test-storage-container">
                <MaxResults>1000</MaxResults>
                <Delimiter>/</Delimiter>
                <Blobs>
                  ${blobPrefixXml('b-prefix/')}
                  ${blobXml('c-file.txt')}
                  ${blobXml('d-file.txt')}
                </Blobs>
                <NextMarker>3</NextMarker>
              </EnumerationResults>`
          }],
          ['3', () => {
            return `
              <EnumerationResults ServiceEndpoint="https://terra-ui-test.blob.core.windows.net/" ContainerName="test-storage-container">
                <MaxResults>1000</MaxResults>
                <Delimiter>/</Delimiter>
                <Blobs>
                  ${blobPrefixXml('c-prefix/')}
                  ${blobPrefixXml('d-prefix/')}
                </Blobs>
                <NextMarker />
              </EnumerationResults>`
          }],
          [Utils.DEFAULT, () => {
            throw new Error('Unrecognized page token')
          }]
        )

        return Promise.resolve(new Response(responseXml))
      })
    })

    it('pages through files (objects)', async () => {
      // Arrange
      const provider = AzureBlobStorageFileBrowserProvider({ workspaceId: 'test-workspace', pageSize: 3 })

      // Act
      const firstResponse = await provider.getFilesInDirectory('')
      const numAzureStorageRequestsAfterFirstResponse = asMockedFn(fetchOk).mock.calls.length
      const secondResponse = await firstResponse.getNextPage()
      const numAzureStorageRequestsAfterSecondResponse = asMockedFn(fetchOk).mock.calls.length

      // Assert
      const expectedFirstPageFiles: FileBrowserFile[] = [
        expectedFile('a-file.txt'),
        expectedFile('b-file.txt'),
        expectedFile('c-file.txt')
      ]
      expect(firstResponse.items).toEqual(expectedFirstPageFiles)
      expect(firstResponse.hasNextPage).toBe(true)
      expect(numAzureStorageRequestsAfterFirstResponse).toBe(2)

      const expectedSecondPageFiles: FileBrowserFile[] = [
        expectedFile('a-file.txt'),
        expectedFile('b-file.txt'),
        expectedFile('c-file.txt'),
        expectedFile('d-file.txt')
      ]
      expect(secondResponse.items).toEqual(expectedSecondPageFiles)
      expect(secondResponse.hasNextPage).toBe(false)
      expect(numAzureStorageRequestsAfterSecondResponse).toBe(3)
    })

    it('pages through directories (prefixes)', async () => {
      // Arrange
      const provider = AzureBlobStorageFileBrowserProvider({ workspaceId: 'test-workspace', pageSize: 3 })

      // Act
      const firstResponse = await provider.getDirectoriesInDirectory('')
      const numAzureStorageRequestsAfterFirstResponse = asMockedFn(fetchOk).mock.calls.length
      const secondResponse = await firstResponse.getNextPage()
      const numAzureStorageRequestsAfterSecondResponse = asMockedFn(fetchOk).mock.calls.length

      // Assert
      const expectedFirstPageDirectories: FileBrowserDirectory[] = [
        { path: 'a-prefix/' },
        { path: 'b-prefix/' },
        { path: 'c-prefix/' }
      ]
      expect(firstResponse.items).toEqual(expectedFirstPageDirectories)
      expect(firstResponse.hasNextPage).toBe(true)
      expect(numAzureStorageRequestsAfterFirstResponse).toBe(3)

      const expectedSecondPageDirectories: FileBrowserDirectory[] = [
        { path: 'a-prefix/' },
        { path: 'b-prefix/' },
        { path: 'c-prefix/' },
        { path: 'd-prefix/' }
      ]
      expect(secondResponse.items).toEqual(expectedSecondPageDirectories)
      expect(secondResponse.hasNextPage).toBe(false)
      expect(numAzureStorageRequestsAfterSecondResponse).toBe(3)
    })
  })

  it('uploads a file', async () => {
    // Arrange
    asMockedFn(fetchOk).mockResolvedValue(new Response())

    const testFile = new File(['somecontent'], 'example.txt', { type: 'text/text' })

    const provider = AzureBlobStorageFileBrowserProvider({ workspaceId: 'test-workspace' })

    // Act
    await provider.uploadFileToDirectory('path/to/directory/', testFile)

    // Assert
    expect(fetchOk).toHaveBeenCalledWith(
      'https://terra-ui-test.blob.core.windows.net/test-storage-container/path/to/directory/example.txt?tokenPlaceholder=value',
      {
        body: testFile,
        headers: {
          'Content-Length': 11,
          'Content-Type': 'text/text',
          'x-ms-blob-type': 'BlockBlob',
        },
        method: 'PUT',
      }
    )
  })

  it('deletes files', async () => {
    // Arrange
    asMockedFn(fetchOk).mockResolvedValue(new Response())

    const provider = AzureBlobStorageFileBrowserProvider({ workspaceId: 'test-workspace' })

    // Act
    await provider.deleteFile('path/to/file.txt')

    // Assert
    expect(fetchOk).toHaveBeenCalledWith(
      'https://terra-ui-test.blob.core.windows.net/test-storage-container/path/to/file.txt?tokenPlaceholder=value',
      {
        method: 'DELETE',
      }
    )
  })
})
