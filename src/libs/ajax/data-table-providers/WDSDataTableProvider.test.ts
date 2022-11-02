import { EntityMetadata, EntityQueryOptions, EntityQueryResponse } from './DataTableProvider'
import { RecordQueryResponse, RecordTypeSchema, WDSDataTableProvider } from './WDSDataTableProvider'


const uuid = '123e4567-e89b-12d3-a456-426614174000' // value doesn't matter for these tests

// shell class that extends WDSDataTableProvider to allow testing protected methods
class TestableWdsProvider extends WDSDataTableProvider {
  transformPageOverride(wdsPage: RecordQueryResponse, recordType: string, queryOptions: EntityQueryOptions): EntityQueryResponse {
    return this.transformPage(wdsPage, recordType, queryOptions)
  }
}

const recordType: string = 'mytype'

const queryOptions: EntityQueryOptions = {
  pageNumber: 2,
  itemsPerPage: 50,
  sortField: 'stringAttr',
  sortDirection: 'desc',
  snapshotName: '',
  googleProject: '',
  activeTextFilter: '',
  filterOperator: ''
}


describe('WDSDataTableProvider', () => {
  describe('transformPage', () => {
    it('restructures a WDS response', () => {
      // ====== Arrange
      const provider = new TestableWdsProvider(uuid)

      // example response from WDS, copy-pasted from a WDS swagger call
      const wdsPage: RecordQueryResponse = {
        searchRequest: {
          limit: 50,
          offset: 50,
          sort: 'DESC',
          sortAttribute: 'stringAttr'
        },
        records: [
          {
            id: '1',
            type: 'item',
            attributes: {
              booleanAttr: true,
              numericAttr: 11,
              stringAttr: 'string',
              timestamp: '2022-10-19T17:39:03.274+00:00'
            }
          },
          {
            id: '2',
            type: 'item',
            attributes: {
              booleanAttr: true,
              numericAttr: 22,
              stringAttr: 'string',
              timestamp: '2022-10-19T17:39:03.274+00:00'
            }
          }
        ],
        totalRecords: 52
      }

      // ====== Act
      const actual: EntityQueryResponse = provider.transformPageOverride(wdsPage, recordType, queryOptions)

      // ====== Assert
      const expected: EntityQueryResponse = {
        results: [
          {
            entityType: recordType,
            attributes: {
              booleanAttr: true,
              numericAttr: 11,
              stringAttr: 'string',
              timestamp: '2022-10-19T17:39:03.274+00:00'
            },
            name: '1'
          },
          {
            entityType: recordType,
            attributes: {
              booleanAttr: true,
              numericAttr: 22,
              stringAttr: 'string',
              timestamp: '2022-10-19T17:39:03.274+00:00'
            },
            name: '2'
          }
        ],
        parameters: {
          page: 2,
          pageSize: 50,
          sortField: 'stringAttr',
          sortDirection: 'desc',
          filterTerms: '',
          filterOperator: 'and'
        },
        resultMetadata: {
          filteredCount: 52,
          unfilteredCount: 52,
          filteredPageCount: -1
        }
      }

      expect(actual).toStrictEqual(expected)
    })
  })

  describe('transformMetadata', () => {
    it('restructures a WDS response', () => {
      // ====== Arrange
      const provider = new TestableWdsProvider(uuid)

      // example response from WDS, copy-pasted from a WDS swagger call
      const wdsSchema: RecordTypeSchema[] = [
        {
          name: 'item',
          attributes: [
            {
              name: 'booleanAttr',
              datatype: 'BOOLEAN'
            },
            {
              name: 'stringAttr',
              datatype: 'STRING'
            }
          ],
          count: 7
        },
        {
          name: 'thing',
          attributes: [
            {
              name: 'numericAttr',
              datatype: 'NUMBER'
            },
            {
              name: 'stringAttr',
              datatype: 'STRING'
            },
            {
              name: 'timestamp',
              datatype: 'STRING'
            }
          ],
          count: 4
        }
      ]

      // ====== Act
      const actual: EntityMetadata = provider.transformMetadata(wdsSchema)

      // ====== Assert
      const expected: EntityMetadata = {
        item: {
          count: 7,
          attributeNames: ['booleanAttr', 'stringAttr'],
          idName: 'sys_name'
        },
        thing: {
          count: 4,
          attributeNames: ['numericAttr', 'stringAttr', 'timestamp'],
          idName: 'sys_name'
        }
      }

      expect(actual).toStrictEqual(expected)
    })
  })
})
