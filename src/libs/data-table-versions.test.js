import JSZip from 'jszip'
import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { getUser } from 'src/libs/auth'
import { restoreDataTableVersion, saveDataTableVersion, tableNameForRestore } from 'src/libs/data-table-versions'


jest.mock('src/libs/ajax')

jest.mock('src/libs/auth', () => ({
  ...jest.requireActual('src/libs/auth'),
  getUser: jest.fn()
}))

describe('tableNameForRestore', () => {
  it('names restored table with version timestamp', () => {
    expect(tableNameForRestore({
      url: 'gs://workspace-bucket/.data-table-versions/thing/thing.v1663096364243',
      createdBy: 'user@example.com',
      entityType: 'thing',
      timestamp: 1663096364243,
      description: 'A version'
    })).toBe('thing_2022-09-13_19-12-44')
  })
})

describe('saveDataTableVersion', () => {
  const workspace = { workspace: { namespace: 'test', name: 'test', googleProject: 'test-project', bucketName: 'test-bucket' } }

  const entityMetadata = {
    thing: {
      attributeNames: ['attribute_one', 'attribute_two'],
      count: 3,
      id_name: 'thing_id'
    },
    thing_set: {
      attributeNames: ['things', 'attribute_one'],
      count: 1,
      id_name: 'thing_set_id'
    }
  }

  const entities = {
    thing: [
      {
        name: 'thing_one',
        entityType: 'thing',
        attributes: {
          attribute_one: 'a',
          attribute_two: 1
        }
      },
      {
        name: 'thing_two',
        entityType: 'thing',
        attributes: {
          attribute_one: 'b',
          attribute_two: 2
        }
      },
      {
        name: 'thing_three',
        entityType: 'thing',
        attributes: {
          attribute_one: 'c',
          attribute_two: 3
        }
      }
    ],
    thing_set: [
      {
        name: 'some_things',
        entityType: 'thing_set',
        attributes: {
          attribute_one: 'a',
          things: {
            itemsType: 'EntityReference',
            items: [
              { entityType: 'thing', entityName: 'thing_one' },
              { entityType: 'thing', entityName: 'thing_two' }
            ]
          }
        }
      }
    ]
  }

  let getEntityMetadata
  let paginatedEntitiesOfType
  let uploadObject
  let patchObject

  beforeEach(() => {
    getEntityMetadata = jest.fn().mockReturnValue(Promise.resolve(entityMetadata))
    paginatedEntitiesOfType = jest.fn().mockImplementation(entityType => Promise.resolve({
      resultMetadata: {
        filterePageCount: 1
      },
      results: entities[entityType] || []
    }))
    uploadObject = jest.fn()
    patchObject = jest.fn()

    Ajax.mockImplementation(() => ({
      Buckets: {
        upload: uploadObject,
        patch: patchObject
      },
      Metrics: {
        captureEvent: jest.fn()
      },
      Workspaces: {
        workspace: () => ({
          entityMetadata: getEntityMetadata,
          paginatedEntitiesOfType
        })
      }
    }))

    getUser.mockReturnValue({
      email: 'user@example.com'
    })
  })

  it('downloads entities', async () => {
    await saveDataTableVersion(workspace, 'thing', {})
    expect(paginatedEntitiesOfType).toHaveBeenCalledWith('thing', expect.objectContaining({ page: 1 }))
  })

  it('downloads related sets', async () => {
    await saveDataTableVersion(workspace, 'thing', { includedSetEntityTypes: ['thing_set'] })
    expect(paginatedEntitiesOfType).toHaveBeenCalledWith('thing', expect.objectContaining({ page: 1 }))
    expect(paginatedEntitiesOfType).toHaveBeenCalledWith('thing_set', expect.objectContaining({ page: 1 }))
  })

  it('uploads zip file of data', async () => {
    await saveDataTableVersion(workspace, 'thing', { includedSetEntityTypes: ['thing_set'] })
    expect(uploadObject).toHaveBeenCalledWith('test-project', 'test-bucket', '.data-table-versions/thing/', expect.any(File))
  })

  describe('uploaded zip file', () => {
    let file

    beforeEach(async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1664838597117)
      await saveDataTableVersion(workspace, 'thing', { includedSetEntityTypes: ['thing_set'] })
      file = uploadObject.mock.calls[0][3]
    })

    it('is named with version timestamp', () => {
      expect(file.name).toBe('thing.v1664838597117.zip')
    })

    it('contains TSV export of table', async () => {
      const zip = await JSZip.loadAsync(file)
      expect(await zip.file('thing.tsv').async('text')).toBe(
        'entity:thing_id\tattribute_one\tattribute_two\n' +
    	  'thing_one\ta\t1\n' +
    	  'thing_two\tb\t2\n' +
    	  'thing_three\tc\t3\n'
      )
    })

    it('contains TSV export of set tables', async () => {
      const zip = await JSZip.loadAsync(file)
      expect(await zip.file('thing_set.tsv').async('text')).toBe(
        'entity:thing_set_id\tattribute_one\n' +
    	  'some_things\ta\n'
      )
      expect(await zip.file('thing_set.membership.tsv').async('text')).toBe(
        'membership:thing_set_id\tthing\n' +
    	  'some_things\tthing_one\n' +
        'some_things\tthing_two\n'
      )
    })
  })

  it('attaches metadata to uploaded zip file', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1664838597117)
    await saveDataTableVersion(workspace, 'thing', {
      description: 'This is a test',
      includedSetEntityTypes: ['thing_set']
    })
    expect(patchObject).toHaveBeenCalledWith(
      'test-project',
      'test-bucket',
      '.data-table-versions/thing/thing.v1664838597117.zip',
      {
        metadata: {
          createdBy: 'user@example.com',
          entityType: 'thing',
          includedSetEntityTypes: 'thing_set',
          timestamp: 1664838597117,
          description: 'This is a test'
        }
      }
    )
  })
})

describe('restoreDataTableVersion', () => {
  const workspace = { workspace: { namespace: 'test', name: 'test', googleProject: 'test-project', bucketName: 'test-bucket' } }
  const version = {
    url: 'gs://workspace-bucket/.data-table-versions/thing/thing.v1663096364243.zip',
    createdBy: 'user@example.com',
    entityType: 'thing',
    includedSetEntityTypes: ['thing_set'],
    timestamp: 1663096364243,
    description: 'A version'
  }

  const versionFile = new JSZip()
  versionFile.file(
    'thing.tsv',
    'entity:thing_id\tattribute_one\tattribute_two\n' +
    'thing_one\ta\t1\n' +
    'thing_two\tb\t2\n' +
    'thing_three\tc\t3\n'
  )
  versionFile.file(
    'thing_set.tsv',
    'entity:thing_set_id\tattribute_one\n' +
    'some_things\ta\n'
  )
  versionFile.file(
    'thing_set.membership.tsv',
    'membership:thing_set_id\tthing\n' +
    'some_things\tthing_one\n' +
    'some_things\tthing_two\n'
  )

  let getObjectPreview
  let importFlexibleEntitiesFileSynchronous

  beforeEach(() => {
    getObjectPreview = jest.fn().mockReturnValue(Promise.resolve({ blob: () => versionFile.generateAsync({ type: 'blob' }) }))
    importFlexibleEntitiesFileSynchronous = jest.fn().mockReturnValue(Promise.resolve({}))

    Ajax.mockImplementation(() => ({
      Buckets: { getObjectPreview },
      Metrics: { captureEvent: jest.fn() },
      Workspaces: { workspace: () => ({ importFlexibleEntitiesFileSynchronous }) }
    }))
  })

  it('downloads version from GCS', async () => {
    await restoreDataTableVersion(workspace, version)
    expect(getObjectPreview).toHaveBeenCalledWith('test-project', 'test-bucket', '.data-table-versions/thing/thing.v1663096364243.zip', true)
  })

  it('imports table and set tables', async () => {
    await restoreDataTableVersion(workspace, version)
    expect(importFlexibleEntitiesFileSynchronous).toHaveBeenCalledTimes(3)
  })

  it('rewrites entity type', async () => {
    await restoreDataTableVersion(workspace, version)

    const getHeaders = async callIndex => {
      const file = importFlexibleEntitiesFileSynchronous.mock.calls[callIndex][0]
      const tsv = await file.text()
      const headers = _.flow(_.split('\n'), _.first, _.split('\t'))(tsv)
      return headers
    }

    const tableHeaders = await getHeaders(0)
    expect(tableHeaders[0]).toBe('entity:thing_2022-09-13_19-12-44_id')

    const setTableHeaders = await getHeaders(1)
    expect(setTableHeaders[0]).toBe('entity:thing_2022-09-13_19-12-44_set_id')

    const setMembershipTableHeaders = await getHeaders(2)
    expect(setMembershipTableHeaders).toEqual(['membership:thing_2022-09-13_19-12-44_set_id', 'thing_2022-09-13_19-12-44'])
  })

  it('returns restored table name', async () => {
    const { tableName } = await restoreDataTableVersion(workspace, version)
    expect(tableName).toBe('thing_2022-09-13_19-12-44')
  })
})
