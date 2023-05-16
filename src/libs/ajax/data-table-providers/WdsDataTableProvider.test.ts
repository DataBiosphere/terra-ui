import { Ajax } from 'src/libs/ajax';
import { Apps } from 'src/libs/ajax/leonardo/Apps';
import { WorkspaceData } from 'src/libs/ajax/WorkspaceDataService';
import { cloudProviderTypes } from 'src/libs/workspace-utils';
import { asMockedFn } from 'src/testing/test-utils';

import { ListAppResponse } from '../leonardo/models/app-models';
import {
  EntityMetadata,
  EntityQueryOptions,
  EntityQueryResponse,
  TsvUploadButtonDisabledOptions,
} from './DataTableProvider';
import {
  RecordAttributes,
  RecordQueryResponse,
  RecordTypeSchema,
  resolveWdsUrl,
  SearchRequest,
  WdsDataTableProvider,
  wdsToEntityServiceMetadata,
} from './WdsDataTableProvider';

jest.mock('src/libs/ajax');

jest.mock('react-notifications-component', () => {
  return {
    store: {
      addNotification: jest.fn(),
      removeNotification: jest.fn(),
    },
  };
});

const uuid = '123e4567-e89b-12d3-a456-426614174000'; // value doesn't matter for these tests

// shell class that extends WdsDataTableProvider to allow testing protected methods
class TestableWdsProvider extends WdsDataTableProvider {
  transformPageOverride(
    wdsPage: RecordQueryResponse,
    recordType: string,
    queryOptions: EntityQueryOptions,
    metadata: EntityMetadata
  ): EntityQueryResponse {
    return this.transformPage(wdsPage, recordType, queryOptions, metadata);
  }

  transformAttributesOverride = (attributes: RecordAttributes, primaryKey: string): RecordAttributes => {
    return this.transformAttributes(attributes, primaryKey);
  };
}

const recordType = 'item';

const testProxyUrl = 'https://lzsomeTestUrl.servicebus.windows.net/super-cool-proxy-url/wds';
const testProxyUrlResponse: ListAppResponse[] = [
  {
    cloudContext: {
      cloudProvider: cloudProviderTypes.GCP,
      cloudResource: 'terra-test-e4000484',
    },
    appType: 'CROMWELL',
    auditInfo: {
      creator: 'cahrens@gmail.com',
      createdDate: '2021-12-10T20:19:13.162484Z',
      dateAccessed: '2021-12-11T20:19:13.162484Z',
    },
    kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
    errors: [],
    appName: `wds-${uuid}`,
    status: 'RUNNING',
    labels: { saturnWorkspaceName: 'test-workspace' },
    proxyUrls: { wds: testProxyUrl },
    workspaceId: uuid,
  },
];

const queryOptions: EntityQueryOptions = {
  pageNumber: 2,
  itemsPerPage: 50,
  sortField: 'stringAttr',
  sortDirection: 'desc',
  snapshotName: '',
  googleProject: '',
  activeTextFilter: '',
  filterOperator: '',
  columnFilter: '',
};

type WorkspaceDataContract = ReturnType<typeof WorkspaceData>;
type AjaxContract = ReturnType<typeof Ajax>;
type AppsContract = ReturnType<typeof Apps>;

describe('WdsDataTableProvider', () => {
  const getRecordsMockImpl: WorkspaceDataContract['getRecords'] = (
    _root: string,
    _instanceId: string,
    _recordType: string,
    _parameters: SearchRequest
  ) => {
    const recordQueryResponse: RecordQueryResponse = {
      searchRequest: {
        limit: 10,
        offset: 0,
        sort: 'desc',
        sortAttribute: 'numericAttr',
      },
      records: [
        {
          id: '2',
          type: recordType,
          attributes: {
            arrayBoolean: [true, false],
            arrayDate: ['2022-11-03'],
            arrayDateTime: ['2022-11-03T04:36:20'],
            arrayNumber: [12821.112, 0.12121211, 11],
            arrayString: ['green', 'red'],
            booleanAttr: true,
            numericAttr: 2,
            stringAttr: 'string',
          },
        },
        {
          id: '1',
          type: recordType,
          attributes: {
            arrayBoolean: [true, false],
            arrayDate: ['2022-11-03'],
            arrayDateTime: ['2022-11-03T04:36:20'],
            arrayNumber: [12821.112, 0.12121211, 11],
            arrayString: ['green', 'red'],
            booleanAttr: true,
            numericAttr: 1,
            stringAttr: 'string',
          },
        },
      ],
      totalRecords: 2,
    };
    return Promise.resolve(recordQueryResponse);
  };

  const deleteTableMockImpl: WorkspaceDataContract['deleteTable'] = (_instanceId: string, _recordType: string) => {
    return Promise.resolve(new Response('', { status: 204 }));
  };

  const downloadTsvMockImpl: WorkspaceDataContract['downloadTsv'] = (_instanceId: string, _recordType: string) => {
    return Promise.resolve(new Blob(['hello']));
  };

  const uploadTsvMockImpl: WorkspaceDataContract['uploadTsv'] = (
    _root: string,
    _instanceId: string,
    _recordType: string,
    _file: File
  ) => {
    return Promise.resolve({ message: 'Upload Succeeded', recordsModified: 1 });
  };

  const listAppsV2MockImpl = (_workspaceId: string): Promise<ListAppResponse[]> => {
    return Promise.resolve(testProxyUrlResponse);
  };

  let getRecords: jest.MockedFunction<WorkspaceDataContract['getRecords']>;
  let deleteTable: jest.MockedFunction<WorkspaceDataContract['deleteTable']>;
  let downloadTsv: jest.MockedFunction<WorkspaceDataContract['downloadTsv']>;
  let uploadTsv: jest.MockedFunction<WorkspaceDataContract['uploadTsv']>;
  let listAppsV2: jest.MockedFunction<AppsContract['listAppsV2']>;

  beforeEach(() => {
    getRecords = jest.fn().mockImplementation(getRecordsMockImpl);
    deleteTable = jest.fn().mockImplementation(deleteTableMockImpl);
    downloadTsv = jest.fn().mockImplementation(downloadTsvMockImpl);
    uploadTsv = jest.fn().mockImplementation(uploadTsvMockImpl);
    listAppsV2 = jest.fn().mockImplementation(listAppsV2MockImpl);

    asMockedFn(Ajax).mockImplementation(
      () =>
        ({
          WorkspaceData: { getRecords, deleteTable, downloadTsv, uploadTsv } as Partial<WorkspaceDataContract>,
          Apps: { listAppsV2 } as Partial<AppsContract>,
        } as Partial<AjaxContract> as AjaxContract)
    );
  });

  describe('transformAttributes', () => {
    it('excludes the primary key from the resultant attributes', () => {
      // Arrange
      const provider = new TestableWdsProvider(uuid, testProxyUrl);

      const input: RecordAttributes = {
        something: 123,
        somethingElse: 'hello',
        myPrimaryKey: 'an id of some sort',
        foo: 'bar',
      };

      // Act
      const actual = provider.transformAttributesOverride(input, 'myPrimaryKey');

      // Assert
      const expected: RecordAttributes = {
        something: 123,
        somethingElse: 'hello',
        foo: 'bar',
      };

      // Assert
      expect(actual).toStrictEqual(expected);
    });
    it('is resilient if the primary key does not exist in input attributes', () => {
      // Arrange
      const provider = new TestableWdsProvider(uuid, testProxyUrl);

      const input: RecordAttributes = {
        something: 123,
        somethingElse: 'hello',
        foo: 'bar',
      };

      // Act
      const actual = provider.transformAttributesOverride(input, 'myPrimaryKey');

      // Assert
      const expected: RecordAttributes = {
        something: 123,
        somethingElse: 'hello',
        foo: 'bar',
      };

      // Assert
      expect(actual).toStrictEqual(expected);
    });
  });
  describe('transformPage', () => {
    it('restructures a WDS response', () => {
      // Arrange
      const provider = new TestableWdsProvider(uuid, testProxyUrl);

      // example response from WDS, copy-pasted from a WDS swagger call
      const wdsPage: RecordQueryResponse = {
        searchRequest: {
          limit: 50,
          offset: 50,
          sort: 'desc',
          sortAttribute: 'stringAttr',
        },
        records: [
          {
            id: '1',
            type: recordType,
            attributes: {
              booleanAttr: true,
              numericAttr: 11,
              stringAttr: 'string',
              timestamp: '2022-10-19T17:39:03.274+00:00',
            },
          },
          {
            id: '2',
            type: recordType,
            attributes: {
              booleanAttr: true,
              numericAttr: 22,
              stringAttr: 'string',
              timestamp: '2022-10-19T17:39:03.274+00:00',
            },
          },
        ],
        totalRecords: 52,
      };

      // example metadata for the previous response
      const metadata: EntityMetadata = {
        item: {
          count: 7,
          attributeNames: ['booleanAttr', 'numericAttr', 'stringAttr', 'timestamp'],
          idName: 'stringAttr',
        },
      };

      // Act
      const actual: EntityQueryResponse = provider.transformPageOverride(wdsPage, recordType, queryOptions, metadata);

      // Assert
      const expected: EntityQueryResponse = {
        results: [
          {
            entityType: recordType,
            attributes: {
              booleanAttr: true,
              numericAttr: 11,
              timestamp: '2022-10-19T17:39:03.274+00:00',
            },
            name: '1',
          },
          {
            entityType: recordType,
            attributes: {
              booleanAttr: true,
              numericAttr: 22,
              timestamp: '2022-10-19T17:39:03.274+00:00',
            },
            name: '2',
          },
        ],
        parameters: {
          page: 2,
          pageSize: 50,
          sortField: 'stringAttr',
          sortDirection: 'desc',
          filterTerms: '',
          filterOperator: 'and',
        },
        resultMetadata: {
          filteredCount: 52,
          unfilteredCount: 52,
          filteredPageCount: -1,
        },
      };

      expect(actual).toStrictEqual(expected);
    });
    it('restructures array attributes', () => {
      // Arrange
      const provider = new TestableWdsProvider(uuid, testProxyUrl);

      // example response from WDS, copy-pasted from a WDS swagger call
      const wdsPage: RecordQueryResponse = {
        searchRequest: {
          limit: 1,
          offset: 0,
          sort: 'asc',
          sortAttribute: 'stringAttr',
        },
        records: [
          {
            id: '1',
            type: recordType,
            attributes: {
              stringAttr: 'string',
              arrayOfNums: [2, 4, 6, 8],
            },
          },
        ],
        totalRecords: 1,
      };

      // example metadata for the previous response
      const metadata: EntityMetadata = {
        item: {
          count: 7,
          attributeNames: ['arrayOfNums', 'stringAttr'],
          idName: 'stringAttr',
        },
      };

      // Act
      const actual: EntityQueryResponse = provider.transformPageOverride(wdsPage, recordType, queryOptions, metadata);

      // Assert
      const expected: EntityQueryResponse = {
        results: [
          {
            entityType: recordType,
            attributes: {
              arrayOfNums: {
                itemsType: 'AttributeValue',
                items: [2, 4, 6, 8],
              },
            },
            name: '1',
          },
        ],
        parameters: {
          page: 2,
          pageSize: 50,
          sortField: 'stringAttr',
          sortDirection: 'desc',
          filterTerms: '',
          filterOperator: 'and',
        },
        resultMetadata: {
          filteredCount: 1,
          unfilteredCount: 1,
          filteredPageCount: -1,
        },
      };

      expect(actual).toStrictEqual(expected);
    });
    it('restructures relation URIs, both scalar and array', () => {
      // Arrange
      const provider = new TestableWdsProvider(uuid, testProxyUrl);

      // example response from WDS, copy-pasted from a WDS swagger call
      const wdsPage: RecordQueryResponse = {
        searchRequest: {
          limit: 1,
          offset: 0,
          sort: 'asc',
          sortAttribute: 'stringAttr',
        },
        records: [
          {
            id: '1',
            type: recordType,
            attributes: {
              stringAttr: 'string',
              numAttr: 123,
              relationScalar: 'terra-wds:/mytype/myid',
              relationArray: ['terra-wds:/mytype/3', 'terra-wds:/mytype/6', 'terra-wds:/mytype/12'],
            },
          },
        ],
        totalRecords: 1,
      };

      // example metadata for the previous response
      const metadata: EntityMetadata = {
        item: {
          count: 7,
          attributeNames: ['numAttr', 'stringAttr', 'relationScalar', 'relationArray'],
          idName: 'stringAttr',
        },
      };

      // Act
      const actual: EntityQueryResponse = provider.transformPageOverride(wdsPage, recordType, queryOptions, metadata);

      // Assert
      const expected: EntityQueryResponse = {
        results: [
          {
            entityType: recordType,
            attributes: {
              numAttr: 123,
              relationScalar: { entityType: 'mytype', entityName: 'myid' },
              relationArray: {
                itemsType: 'EntityReference',
                items: [
                  { entityType: 'mytype', entityName: '3' },
                  { entityType: 'mytype', entityName: '6' },
                  { entityType: 'mytype', entityName: '12' },
                ],
              },
            },
            name: '1',
          },
        ],
        parameters: {
          page: 2,
          pageSize: 50,
          sortField: 'stringAttr',
          sortDirection: 'desc',
          filterTerms: '',
          filterOperator: 'and',
        },
        resultMetadata: {
          filteredCount: 1,
          unfilteredCount: 1,
          filteredPageCount: -1,
        },
      };

      expect(actual).toStrictEqual(expected);
    });
    it('handles mixed arrays that contain some relation URIs and some strings', () => {
      // Arrange
      const provider = new TestableWdsProvider(uuid, testProxyUrl);

      // example response from WDS, copy-pasted from a WDS swagger call
      const wdsPage: RecordQueryResponse = {
        searchRequest: {
          limit: 1,
          offset: 0,
          sort: 'asc',
          sortAttribute: 'stringAttr',
        },
        records: [
          {
            id: '1',
            type: recordType,
            attributes: {
              mixedArrayRelationFirst: ['terra-wds:/mytype/3', 'hello', 'world'],
              mixedArrayRelationLast: ['hello', 'world', 'terra-wds:/mytype/12'],
            },
          },
        ],
        totalRecords: 1,
      };

      // example metadata for the previous response
      const metadata: EntityMetadata = {
        item: {
          count: 7,
          attributeNames: ['mixedArrayRelationFirst', 'mixedArrayRelationLast'],
          idName: 'sys_name',
        },
      };

      // Act
      const actual: EntityQueryResponse = provider.transformPageOverride(wdsPage, recordType, queryOptions, metadata);

      // Assert
      const expected: EntityQueryResponse = {
        results: [
          {
            entityType: recordType,
            attributes: {
              mixedArrayRelationFirst: {
                itemsType: 'AttributeValue',
                items: ['terra-wds:/mytype/3', 'hello', 'world'],
              },
              mixedArrayRelationLast: {
                itemsType: 'AttributeValue',
                items: ['hello', 'world', 'terra-wds:/mytype/12'],
              },
            },
            name: '1',
          },
        ],
        parameters: {
          page: 2,
          pageSize: 50,
          sortField: 'stringAttr',
          sortDirection: 'desc',
          filterTerms: '',
          filterOperator: 'and',
        },
        resultMetadata: {
          filteredCount: 1,
          unfilteredCount: 1,
          filteredPageCount: -1,
        },
      };

      expect(actual).toStrictEqual(expected);
    });
  });
  describe('getPage', () => {
    it('restructures a WDS response', () => {
      // Arrange
      const provider = new TestableWdsProvider(uuid, testProxyUrl);
      const signal = new AbortController().signal;

      const metadata: EntityMetadata = {
        item: {
          count: 7,
          attributeNames: ['mixedArrayRelationFirst', 'mixedArrayRelationLast'],
          idName: 'sys_name',
        },
      };

      // Act
      return provider.getPage(signal, recordType, queryOptions, metadata).then((actual) => {
        // Assert
        expect(getRecords.mock.calls.length).toBe(1);
        expect(actual.resultMetadata.unfilteredCount).toBe(2);
      });
    });
  });
  describe('deleteTable', () => {
    it('restructures a WDS response', () => {
      // Arrange
      const provider = new TestableWdsProvider(uuid, testProxyUrl);

      // Act
      return provider.deleteTable(recordType).then((actual) => {
        // Assert
        expect(deleteTable.mock.calls.length).toBe(1);
        expect(actual.status).toBe(204);
      });
    });
  });
  describe('downloadTsv', () => {
    it('restructures a WDS response', () => {
      // Arrange
      const provider = new TestableWdsProvider(uuid, testProxyUrl);
      const signal = new AbortController().signal;

      // Act
      return provider.downloadTsv(signal, recordType).then((actual) => {
        // Assert
        expect(downloadTsv.mock.calls.length).toBe(1);
        actual.text().then((txt) => {
          expect(txt).toBe('hello');
        });
      });
    });
  });

  describe('disabled', () => {
    it.each([
      [{ filePresent: false, uploading: false, recordTypePresent: true }, true],
      [{ filePresent: true, uploading: true, recordTypePresent: true }, true],
      [{ filePresent: true, uploading: false, recordTypePresent: false }, true],
    ])('Upload button is disabled', (conditions: TsvUploadButtonDisabledOptions, result: boolean) => {
      const provider = new TestableWdsProvider(uuid, testProxyUrl);
      expect(provider.tsvFeatures.disabled(conditions)).toEqual(result);
    });

    it('Upload button is not disabled', () => {
      const provider = new TestableWdsProvider(uuid, testProxyUrl);
      const actual = provider.tsvFeatures.disabled({ filePresent: true, uploading: false, recordTypePresent: true });
      expect(actual).toBe(false);
    });
  });

  describe('tooltip', () => {
    it('Tooltip -- needs table name', () => {
      const provider = new TestableWdsProvider(uuid, testProxyUrl);
      const actual = provider.tsvFeatures.tooltip({ filePresent: true, recordTypePresent: false });
      expect(actual).toBe('Please enter table name');
    });

    it('Tooltip -- needs valid data', () => {
      const provider = new TestableWdsProvider(uuid, testProxyUrl);
      const actual = provider.tsvFeatures.tooltip({ filePresent: false, recordTypePresent: true });
      expect(actual).toBe('Please select valid data to upload');
    });
  });

  describe('uploadTsv', () => {
    it('uploads a TSV', () => {
      // ====== Arrange
      const provider = new TestableWdsProvider(uuid, testProxyUrl);
      const tsvFile = new File([''], 'testFile.tsv');
      // ====== Act
      return provider
        .uploadTsv({
          recordType,
          file: tsvFile,
          workspaceId: uuid,
          name: '',
          deleteEmptyValues: false,
          namespace: '',
          useFireCloudDataModel: false,
        })
        .then((actual) => {
          // ====== Assert
          expect(uploadTsv.mock.calls.length).toBe(1);
          expect(actual.recordsModified).toBe(1);
        });
    });
  });
});

describe('transformMetadata', () => {
  it('restructures a WDS response', () => {
    // Arrange
    // example response from WDS, copy-pasted from a WDS swagger call
    const wdsSchema: RecordTypeSchema[] = [
      {
        name: recordType,
        attributes: [
          {
            name: 'booleanAttr',
            datatype: 'BOOLEAN',
          },
          {
            name: 'stringAttr',
            datatype: 'STRING',
          },
          {
            name: 'item_id',
            datatype: 'STRING',
          },
        ],
        count: 7,
        primaryKey: 'item_id',
      },
      {
        name: 'thing',
        attributes: [
          {
            name: 'thing_id',
            datatype: 'STRING',
          },
          {
            name: 'numericAttr',
            datatype: 'NUMBER',
          },
          {
            name: 'stringAttr',
            datatype: 'STRING',
          },
          {
            name: 'timestamp',
            datatype: 'STRING',
          },
        ],
        count: 4,
        primaryKey: 'thing_id',
      },
      {
        name: 'system',
        attributes: [
          {
            name: 'one',
            datatype: 'NUMBER',
          },
          {
            name: 'two',
            datatype: 'STRING',
          },
        ],
        count: 12345,
        primaryKey: 'sys_name',
      },
    ];

    // Act
    const actual: EntityMetadata = wdsToEntityServiceMetadata(wdsSchema);

    // Assert
    const expected: EntityMetadata = {
      item: {
        count: 7,
        attributeNames: ['booleanAttr', 'stringAttr'],
        idName: 'item_id',
      },
      thing: {
        count: 4,
        attributeNames: ['numericAttr', 'stringAttr', 'timestamp'],
        idName: 'thing_id',
      },
      system: {
        count: 12345,
        attributeNames: ['one', 'two'],
        idName: 'sys_name',
      },
    };

    expect(actual).toStrictEqual(expected);
  });
});

describe('resolveWdsUrl', () => {
  it.each([
    { appStatus: 'RUNNING', expectedUrl: testProxyUrl },
    { appStatus: 'PROVISIONING', expectedUrl: '' },
    { appStatus: 'STOPPED', expectedUrl: '' },
    { appStatus: 'STOPPING', expectedUrl: '' },
  ])(
    'properly extracts the correct value for a healthy WDS app from the leo response',
    ({ appStatus, expectedUrl }) => {
      const testHealthyAppProxyUrlResponse: Array<Object> = [
        {
          appType: 'CROMWELL',
          appName: `wds-${uuid}`,
          status: appStatus,
          proxyUrls: { wds: testProxyUrl },
          workspaceId: uuid,
        },
      ];
      expect(resolveWdsUrl(testHealthyAppProxyUrlResponse)).toBe(expectedUrl);
    }
  );

  it('returns an empty string if the response status is in ERROR and the app is not found', () => {
    const testProxyUrlResponseWithDifferentAppName: Array<Object> = [
      { appType: 'SOMETHING_ELSE', appName: 'something-else', status: 'ERROR', proxyUrls: { wds: testProxyUrl } },
    ];
    expect(resolveWdsUrl(testProxyUrlResponseWithDifferentAppName)).toBe('');
  });

  it('return empty string if no CROMWELL app exists but other apps are present', () => {
    const testProxyUrlResponseWithDifferentAppName: Array<Object> = [
      { appType: 'A_DIFFERENT_APP', appName: 'something-else', status: 'RUNNING', proxyUrls: { wds: testProxyUrl } },
    ];
    expect(resolveWdsUrl(testProxyUrlResponseWithDifferentAppName)).toBe('');
  });

  it('return the earliest created RUNNING app url if more than one exists', () => {
    const testProxyUrlResponseMultipleApps: Array<Object> = [
      {
        appType: 'CROMWELL',
        workspaceId: uuid,
        appName: `wds-${uuid}`,
        status: 'RUNNING',
        proxyUrls: { wds: 'something-older.com' },
        auditInfo: {
          createdDate: '2022-01-24T15:27:28.740880Z',
        },
      },
      {
        appType: 'CROMWELL',
        workspaceId: uuid,
        appName: `wds-${uuid}`,
        status: 'RUNNING',
        proxyUrls: { wds: testProxyUrl },
        auditInfo: {
          createdDate: '2023-01-24T15:27:28.740880Z',
        },
      },
    ];
    expect(resolveWdsUrl(testProxyUrlResponseMultipleApps)).toBe('something-older.com');
  });

  it("return the earliest created app if more than one exists and are in the 'PROVISIONING', 'STOPPED', or 'STOPPING' states", () => {
    const testProxyUrlResponseMultipleApps: Array<Object> = [
      {
        appType: 'CROMWELL',
        workspaceId: uuid,
        appName: `wds-${uuid}`,
        status: 'STOPPED',
        proxyUrls: { wds: 'something-older.com' },
        auditInfo: {
          createdDate: '2021-01-24T15:27:28.740880Z',
        },
      },
      {
        appType: 'CROMWELL',
        workspaceId: uuid,
        appName: `wds-${uuid}`,
        status: 'STOPPING',
        proxyUrls: { wds: testProxyUrl },
        auditInfo: {
          createdDate: '2022-01-24T15:27:28.740880Z',
        },
      },
      {
        appType: 'CROMWELL',
        workspaceId: uuid,
        appName: `wds-${uuid}`,
        status: 'PROVISIONING',
        proxyUrls: { wds: testProxyUrl },
        auditInfo: {
          createdDate: '2023-01-24T15:27:28.740880Z',
        },
      },
    ];
    expect(resolveWdsUrl(testProxyUrlResponseMultipleApps)).toBe('');
  });

  it.each([
    { appStatus: 'RUNNING', expectedUrl: testProxyUrl },
    { appStatus: 'PROVISIONING', expectedUrl: '' },
    { appStatus: 'STOPPED', expectedUrl: '' },
    { appStatus: 'STOPPING', expectedUrl: '' },
  ])('gives precedence to the WDS appType over the CROMWELL appType', ({ appStatus, expectedUrl }) => {
    const testHealthyAppProxyUrlResponse: Array<Object> = [
      {
        appType: 'CROMWELL',
        appName: `wds-${uuid}`,
        status: 'RUNNING',
        proxyUrls: { wds: 'should_not_return' },
        workspaceId: uuid,
      },
      {
        appType: 'WDS',
        appName: `wds-${uuid}`,
        status: appStatus,
        proxyUrls: { wds: testProxyUrl },
        workspaceId: uuid,
      },
    ];
    expect(resolveWdsUrl(testHealthyAppProxyUrlResponse)).toBe(expectedUrl);
  });
});
