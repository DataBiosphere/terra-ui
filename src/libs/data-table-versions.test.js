import _ from 'lodash/fp'
import { Ajax } from 'src/libs/ajax'
import { restoreDataTableVersion, tableNameForRestore } from 'src/libs/data-table-versions'


jest.mock('src/libs/ajax')

describe('tableNameForRestore', () => {
  it('names restored table with version timestamp', () => {
    expect(tableNameForRestore({
      url: 'gs://workspace-bucket/.data-table-versions/thing/thing.v1663096364243',
      createdBy: 'user@example.com',
      entityType: 'thing',
      timestamp: 1663096364243,
      description: 'A version'
    })).toBe('thing_2022-09-13_15-12-44')
  })
})

describe('restoreDataTableVersion', () => {
  const workspace = { workspace: { namespace: 'test', name: 'test', googleProject: 'test-project', bucketName: 'test-bucket' } }
  const version = {
    url: 'gs://workspace-bucket/.data-table-versions/thing/thing.v1663096364243',
    createdBy: 'user@example.com',
    entityType: 'thing',
    timestamp: 1663096364243,
    description: 'A version'
  }

  let getObjectPreview
  let importFlexibleEntitiesFileSynchronous

  beforeEach(() => {
    getObjectPreview = jest.fn().mockReturnValue(Promise.resolve({ text: () => Promise.resolve('entity:thing_id\tvalue\nthing_1\tabc') }))
    importFlexibleEntitiesFileSynchronous = jest.fn().mockReturnValue(Promise.resolve({}))

    Ajax.mockImplementation(() => ({
      Buckets: { getObjectPreview },
      Workspaces: { workspace: () => ({ importFlexibleEntitiesFileSynchronous }) }
    }))
  })

  it('downloads version from GCS', async () => {
    await restoreDataTableVersion(workspace, version)
    expect(getObjectPreview).toHaveBeenCalledWith('test-project', 'test-bucket', '.data-table-versions/thing/thing.v1663096364243', true)
  })

  it('imports table', async () => {
    await restoreDataTableVersion(workspace, version)
    expect(importFlexibleEntitiesFileSynchronous).toHaveBeenCalled()
  })

  it('rewrites entity type', async () => {
    await restoreDataTableVersion(workspace, version)

    const importedFile = importFlexibleEntitiesFileSynchronous.mock.calls[0][0]
    const importedTsv = await importedFile.text()

    const entityTypeHeader = _.flow(_.split('\n'), _.first, _.split('\t'), _.first)(importedTsv)
    expect(entityTypeHeader).toBe('entity:thing_2022-09-13_15-12-44_id')
  })

  it('returns restored table name', async () => {
    const { tableName } = await restoreDataTableVersion(workspace, version)
    expect(tableName).toBe('thing_2022-09-13_15-12-44')
  })
})
