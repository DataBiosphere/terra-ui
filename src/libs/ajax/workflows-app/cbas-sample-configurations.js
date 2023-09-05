import _ from 'lodash/fp';

export const runSetInputDef = [
  {
    input_name: 'target_workflow_1.foo.foo_rating_workflow_var',
    input_type: { type: 'primitive', primitive_type: 'Int' },
    source: {
      type: 'record_lookup',
      record_attribute: 'foo_rating',
    },
  },
  {
    input_name: 'target_workflow_1.bar_string_workflow_var',
    input_type: { type: 'primitive', primitive_type: 'String' },
    source: {
      type: 'record_lookup',
      record_attribute: 'bar_string',
    },
  },
  {
    input_name: 'target_workflow_1.optional_var',
    input_type: {
      type: 'optional',
      optional_type: {
        type: 'primitive',
        primitive_type: 'String',
      },
    },
    source: {
      type: 'literal',
      parameter_value: 'Hello World',
    },
  },
];

// example input configuration for a newly imported method
export const runSetInputDefWithSourceNone = [
  {
    input_name: 'target_workflow_1.foo.foo_rating_workflow_var',
    input_type: { type: 'primitive', primitive_type: 'Int' },
    source: {
      type: 'none',
    },
  },
  {
    input_name: 'target_workflow_1.optional_var',
    input_type: {
      type: 'optional',
      optional_type: {
        type: 'primitive',
        primitive_type: 'String',
      },
    },
    source: {
      type: 'none',
    },
  },
  {
    input_name: 'target_workflow_1.foo.myStruct',
    input_type: {
      type: 'struct',
      name: 'myStruct',
      fields: [
        {
          field_name: 'myPrimitive',
          field_type: {
            type: 'primitive',
            primitive_type: 'String',
          },
        },
        {
          field_name: 'myOptional',
          field_type: {
            type: 'optional',
            optional_type: {
              type: 'primitive',
              primitive_type: 'String',
            },
          },
        },
      ],
    },
    source: {
      type: 'none',
    },
  },
];

// example input configuration for a newly imported method with some of the same variable names as the table
export const runSetInputDefSameInputNames = [
  {
    input_name: 'target_workflow_1.foo.foo_rating',
    input_type: { type: 'optional', optional_type: { type: 'primitive', primitive_type: 'Int' } },
    source: {
      type: 'none',
    },
  },
  {
    input_name: 'target_workflow_1.bar_string',
    input_type: {
      type: 'primitive',
      primitive_type: 'String',
    },
    source: {
      type: 'none',
    },
  },
  {
    input_name: 'target_workflow_1.not_in_table',
    input_type: {
      type: 'optional',
      optional_type: {
        type: 'primitive',
        primitive_type: 'String',
      },
    },
    source: {
      type: 'none',
    },
  },
];

export const myStructInput = {
  input_name: 'target_workflow_1.foo.myStruct',
  input_type: {
    type: 'struct',
    name: 'myStruct',
    fields: [
      {
        field_name: 'myPrimitive',
        field_type: {
          type: 'primitive',
          primitive_type: 'String',
        },
      },
      {
        field_name: 'myOptional',
        field_type: {
          type: 'optional',
          optional_type: {
            type: 'primitive',
            primitive_type: 'String',
          },
        },
      },
      {
        field_name: 'myArray',
        field_type: {
          type: 'array',
          array_type: {
            type: 'primitive',
            primitive_type: 'String',
          },
        },
      },
      {
        field_name: 'myMap',
        field_type: {
          type: 'map',
          key_type: 'String',
          value_type: {
            type: 'primitive',
            primitive_type: 'String',
          },
        },
      },
      {
        field_name: 'myInnerStruct',
        field_type: {
          type: 'struct',
          name: 'myInnerStruct',
          fields: [
            {
              field_name: 'myInnermostPrimitive',
              field_type: {
                type: 'primitive',
                primitive_type: 'String',
              },
            },
            {
              field_name: 'myInnermostRecordLookup',
              field_type: {
                type: 'primitive',
                primitive_type: 'Int',
              },
            },
          ],
        },
      },
    ],
  },
  source: {
    type: 'object_builder',
    fields: [
      {
        name: 'myPrimitive',
        source: {
          type: 'literal',
          parameter_value: 'Fiesty',
        },
      },
      {
        name: 'myOptional',
        source: {
          type: 'literal',
          parameter_value: 'Meh',
        },
      },
      {
        name: 'myArray',
        source: {
          type: 'literal',
          parameter_value: [],
        },
      },
      {
        name: 'myMap',
        source: {
          type: 'literal',
          parameter_value: {},
        },
      },
      {
        name: 'myInnerStruct',
        source: {
          type: 'object_builder',
          fields: [
            {
              name: 'myInnermostPrimitive',
              source: {
                type: 'none',
              },
            },
            {
              name: 'myInnermostRecordLookup',
              source: {
                type: 'record_lookup',
                record_attribute: 'foo_rating',
              },
            },
          ],
        },
      },
    ],
  },
};

export const runSetInputDefWithStruct = [...runSetInputDef, myStructInput];

export const runSetInputDefWithArrays = [
  {
    input_name: 'target_workflow_1.foo.foo_array',
    input_type: { type: 'array', array_type: { type: 'primitive', primitive_type: 'Int' } },
    source: {
      type: 'literal',
      parameter_value: [],
    },
  },
  {
    input_name: 'target_workflow_1.bar_array',
    input_type: { type: 'optional', optional_type: { type: 'array', array_type: { type: 'primitive', primitive_type: 'String' } } },
    source: {
      type: 'none',
    },
  },
];

export const runSetOutputDef = [
  {
    output_name: 'target_workflow_1.file_output',
    output_type: { type: 'primitive', primitive_type: 'File' },
    destination: {
      type: 'record_update',
      record_attribute: 'target_workflow_1_file_output',
    },
  },
  {
    output_name: 'target_workflow_1.unused_output',
    output_type: { type: 'primitive', primitive_type: 'String' },
    destination: {
      type: 'none',
    },
  },
];

export const runSetOutputDefWithDefaults = [
  {
    output_name: 'target_workflow_1.file_output',
    output_type: { type: 'primitive', primitive_type: 'File' },
    destination: {
      type: 'record_update',
      record_attribute: 'file_output',
    },
  },
  {
    output_name: 'target_workflow_1.unused_output',
    output_type: { type: 'primitive', primitive_type: 'String' },
    destination: {
      type: 'record_update',
      record_attribute: 'unused_output',
    },
  },
];

export const runSetResponse = {
  run_sets: [
    {
      run_set_id: '10000000-0000-0000-0000-000000000001',
      method_id: '00000000-0000-0000-0000-000000000001',
      method_version_id: '50000000-0000-0000-0000-000000000006',
      is_template: true,
      state: 'COMPLETE',
      record_type: 'FOO',
      submission_timestamp: '2022-12-07T17:26:53.153+00:00',
      last_modified_timestamp: '2022-12-07T17:26:53.153+00:00',
      run_count: 1,
      error_count: 0,
      input_definition: JSON.stringify(runSetInputDef),
      output_definition: JSON.stringify(runSetOutputDef),
    },
  ],
};

export const runSetResponseForNewMethod = {
  run_sets: [
    {
      run_set_id: '10000000-0000-0000-0000-000000000001',
      method_id: '00000000-0000-0000-0000-000000000001',
      method_version_id: '50000000-0000-0000-0000-000000000006',
      is_template: true,
      state: 'COMPLETE',
      record_type: 'FOO',
      submission_timestamp: '2022-12-07T17:26:53.153+00:00',
      last_modified_timestamp: '2022-12-07T17:26:53.153+00:00',
      run_count: 1,
      error_count: 0,
      input_definition: JSON.stringify(runSetInputDefWithSourceNone),
      output_definition: JSON.stringify(runSetOutputDef),
    },
  ],
};

export const runSetResponseSameInputNames = {
  run_sets: [
    {
      run_set_id: '10000000-0000-0000-0000-000000000001',
      method_id: '00000000-0000-0000-0000-000000000001',
      method_version_id: '50000000-0000-0000-0000-000000000006',
      is_template: true,
      state: 'COMPLETE',
      record_type: 'FOO',
      submission_timestamp: '2022-12-07T17:26:53.153+00:00',
      last_modified_timestamp: '2022-12-07T17:26:53.153+00:00',
      run_count: 1,
      error_count: 0,
      input_definition: JSON.stringify(runSetInputDefSameInputNames),
      output_definition: JSON.stringify(runSetOutputDef),
    },
  ],
};

export const runSetResponseWithStruct = _.set('run_sets[0].input_definition', JSON.stringify(runSetInputDefWithStruct), runSetResponse);

export const runSetResponseWithArrays = {
  run_sets: [
    {
      run_set_id: '10000000-0000-0000-0000-000000000001',
      method_id: '00000000-0000-0000-0000-000000000001',
      method_version_id: '50000000-0000-0000-0000-000000000006',
      is_template: true,
      state: 'COMPLETE',
      record_type: 'FOO',
      submission_timestamp: '2022-12-07T17:26:53.153+00:00',
      last_modified_timestamp: '2022-12-07T17:26:53.153+00:00',
      run_count: 1,
      error_count: 0,
      input_definition: JSON.stringify(runSetInputDefWithArrays),
      output_definition: JSON.stringify(runSetOutputDef),
    },
  ],
};

export const badRecordTypeRunSetResponse = {
  run_sets: [
    {
      run_set_id: '20000000-0000-0000-0000-000000000002',
      method_id: '00000000-0000-0000-0000-000000000002',
      method_version_id: '50000000-0000-0000-0000-000000000005',
      is_template: true,
      run_set_name: 'Target workflow 2, run 1',
      run_set_description: 'Example run for target workflow 2',
      state: 'COMPLETE',
      record_type: 'BADFOO',
      submission_timestamp: '2022-12-07T17:26:53.153+00:00',
      last_modified_timestamp: '2022-12-07T17:26:53.153+00:00',
      run_count: 1,
      error_count: 0,
      input_definition: JSON.stringify(runSetInputDef),
      output_definition: JSON.stringify(runSetOutputDef),
    },
  ],
};

export const undefinedRecordTypeRunSetResponse = {
  run_sets: [
    {
      run_set_id: '20000000-0000-0000-0000-000000000002',
      method_id: '00000000-0000-0000-0000-000000000002',
      method_version_id: '50000000-0000-0000-0000-000000000005',
      is_template: true,
      run_set_name: 'Target workflow 2, run 1',
      run_set_description: 'Example run for target workflow 2',
      state: 'COMPLETE',
      record_type: undefined,
      submission_timestamp: '2022-12-07T17:26:53.153+00:00',
      last_modified_timestamp: '2022-12-07T17:26:53.153+00:00',
      run_count: 1,
      error_count: 0,
      input_definition: JSON.stringify(runSetInputDef),
      output_definition: JSON.stringify(runSetOutputDef),
    },
  ],
};

export const methodsResponse = {
  methods: [
    {
      method_id: '00000000-0000-0000-0000-000000000001',
      name: 'Target Workflow 1',
      description: 'Target Workflow 1',
      source: 'Github',
      source_url: 'https://raw.githubusercontent.com/DataBiosphere/cbas/main/useful_workflows/target_workflow_1/target_workflow_1.wdl',
      method_versions: [
        {
          method_version_id: '50000000-0000-0000-0000-000000000006',
          method_id: '00000000-0000-0000-0000-000000000001',
          name: '1.0',
          description: 'method description',
          created: '2023-01-26T19:45:50.419Z',
          url: 'https://raw.githubusercontent.com/DataBiosphere/cbas/main/useful_workflows/target_workflow_1/target_workflow_1.wdl',
          last_run: {
            previously_run: true,
            timestamp: '2023-01-26T19:45:50.419Z',
            run_set_id: '10000000-0000-0000-0000-000000000001',
            method_version_id: '50000000-0000-0000-0000-000000000006',
            method_version_name: 'string',
          },
        },
      ],
      created: '2022-12-07T17:26:53.131+00:00',
      last_run: {
        run_previously: false,
      },
    },
  ],
};

export const typesResponse = [
  {
    name: 'FOO',
    attributes: [
      {
        name: 'foo_rating',
        datatype: 'NUMBER',
      },
      {
        name: 'bar_string',
        datatype: 'STRING',
      },
      {
        name: 'sys_name',
        datatype: 'STRING',
      },
    ],
    count: 4,
    primaryKey: 'sys_name',
  },
  {
    name: 'BAR',
    attributes: [
      {
        name: 'bar_rating',
        datatype: 'NUMBER',
      },
      {
        name: 'sys_name',
        datatype: 'STRING',
      },
    ],
    count: 4,
    primaryKey: 'sys_name',
  },
];

export const typesResponseWithoutFooRating = [
  {
    name: 'FOO',
    attributes: [
      {
        name: 'rating_for_foo',
        datatype: 'NUMBER',
      },
      {
        name: 'bar_string',
        datatype: 'STRING',
      },
      {
        name: 'sys_name',
        datatype: 'STRING',
      },
    ],
    count: 4,
    primaryKey: 'sys_name',
  },
];

export const searchResponseFOO = {
  searchRequest: {
    limit: 10,
    offset: 0,
    sort: 'ASC',
    sortAttribute: null,
  },
  records: [
    {
      id: 'FOO1',
      type: 'FOO',
      attributes: { sys_name: 'FOO1', foo_rating: 1000 },
    },
    {
      id: 'FOO2',
      type: 'FOO',
      attributes: { sys_name: 'FOO2', foo_rating: 999 },
    },
    {
      id: 'FOO3',
      type: 'FOO',
      attributes: { sys_name: 'FOO3', foo_rating: 85 },
    },
    {
      id: 'FOO4',
      type: 'FOO',
      attributes: { sys_name: 'FOO4', foo_rating: 30 },
    },
  ],
  totalRecords: 4,
};

export const searchResponseBAR = {
  searchRequest: {
    limit: 10,
    offset: 0,
    sort: 'ASC',
    sortAttribute: null,
  },
  records: [
    {
      id: 'BAR1',
      type: 'BAR',
      attributes: { sys_name: 'BAR1', bar_rating: 1000 },
    },
    {
      id: 'BAR2',
      type: 'BAR',
      attributes: { sys_name: 'BAR2', bar_rating: 999 },
    },
  ],
  totalRecords: 2,
};

export const searchResponses = {
  FOO: searchResponseFOO,
  BAR: searchResponseBAR,
};

export const mockWdsProxyUrl = 'https://lzabc123.servicebus.windows.net/abc-proxy-url/wds';
export const mockApps = [
  {
    appType: 'CROMWELL',
    workspaceId: 'abc-123',
    appName: 'wds-abc-123',
    status: 'RUNNING',
    proxyUrls: { wds: mockWdsProxyUrl },
  },
];

export const mockAbortResponse = {
  run_set_id: '20000000-0000-0000-0000-200000000002',
  runs: ['30000000-0000-0000-0000-200000000003'],
  state: 'CANCELING',
};
