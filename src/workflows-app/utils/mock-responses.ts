import _ from 'lodash/fp';
import { appAccessScopes } from 'src/analysis/utils/tool-utils';
import { App, LeoAppStatus } from 'src/libs/ajax/leonardo/models/app-models';
import { AuditInfo } from 'src/libs/ajax/leonardo/models/core-models';
import { defaultAzureRegion } from 'src/libs/azure-utils';
import { InputDefinition, OutputDefinition } from 'src/workflows-app/models/submission-models';
import { AzureWorkspace } from 'src/workspaces/utils';

import { WorkflowMetadata } from './submission-utils';

export const runSetInputDef: InputDefinition[] = [
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
export const runSetInputDefWithSourceNone: InputDefinition[] = [
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

export const runSetInputDefWithEmptySources = _.flow(
  _.set('[0].source', { type: 'record_lookup', record_attribute: '' }),
  _.set('[2].source', { type: 'object_builder', fields: [] })
)(runSetInputDefWithSourceNone);

export const runSetInputDefWithWrongTypes: InputDefinition[] = [
  {
    input_name: 'target_workflow_1.a.empty_rating_workflow_var',
    input_type: { type: 'primitive', primitive_type: 'Int' },
    source: {
      type: 'literal',
      parameter_value: '',
    },
  },
  {
    input_name: 'target_workflow_1.b.foo_rating_workflow_var',
    input_type: { type: 'primitive', primitive_type: 'Int' },
    source: {
      type: 'literal',
      parameter_value: '123X',
    },
  },
  {
    input_name: 'target_workflow_1.c.bar_rating_workflow_var',
    input_type: { type: 'primitive', primitive_type: 'Int' },
    source: {
      type: 'literal',
      parameter_value: 123,
    },
  },
];

// example input configuration for a newly imported method with some of the same variable names as the table
export const runSetInputDefSameInputNames: InputDefinition[] = [
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

export const myStructInput: InputDefinition = {
  input_name: 'target_workflow_1.foo.myStruct',
  input_type: {
    type: 'struct',
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

export const myStructInputCompleteAttribute = _.set(
  'source.fields[4].source.fields[0].source',
  { type: 'literal', parameter_value: 2 },
  myStructInput
);

export const runSetInputDefWithStruct: InputDefinition[] = [...runSetInputDef, myStructInput];

export const runSetInputDefWithCompleteStruct = [...runSetInputDef, myStructInputCompleteAttribute];

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
    input_type: {
      type: 'optional',
      optional_type: { type: 'array', array_type: { type: 'primitive', primitive_type: 'String' } },
    },
    source: {
      type: 'none',
    },
  },
];

export const runSetInputDefWithArrayMessages: InputDefinition[] = [
  {
    input_name: 'target_workflow_1.a.empty_int_array',
    input_type: { type: 'array', array_type: { type: 'primitive', primitive_type: 'Int' } },
    source: {
      type: 'literal',
      parameter_value: [],
    },
  },
  {
    input_name: 'target_workflow_1.b.invalid_int_array',
    input_type: { type: 'array', array_type: { type: 'primitive', primitive_type: 'Int' } },
    source: {
      type: 'literal',
      parameter_value: '[X]',
    },
  },
  {
    input_name: 'target_workflow_1.c.valid_int_array',
    input_type: { type: 'array', array_type: { type: 'primitive', primitive_type: 'Int' } },
    source: {
      type: 'literal',
      parameter_value: '[1, 2]',
    },
  },
  {
    input_name: 'target_workflow_1.d.string_array_no_source',
    input_type: { type: 'array', array_type: { type: 'primitive', primitive_type: 'String' } },
    source: {
      type: 'none',
    },
  },
  {
    input_name: 'target_workflow_1.e.string_array_empty_source',
    input_type: { type: 'array', array_type: { type: 'primitive', primitive_type: 'String' } },
    source: {
      type: 'literal',
      parameter_value: '',
    },
  },
  {
    input_name: 'target_workflow_1.f.string_array_string_value',
    input_type: { type: 'array', array_type: { type: 'primitive', primitive_type: 'String' } },
    source: {
      type: 'literal',
      parameter_value: 'not an array',
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

export const runSetOutputDefEmpty = [
  {
    output_name: 'target_workflow_1.file_output',
    output_type: { type: 'primitive', primitive_type: 'File' },
    destination: {
      type: 'none',
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

export const runSetOutputDefFilled: OutputDefinition[] = [
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
      type: 'record_update',
      record_attribute: 'unused_output',
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
      call_caching_enabled: true,
      submission_timestamp: '2022-12-07T17:26:53.153+00:00',
      last_modified_timestamp: '2022-12-07T17:26:53.153+00:00',
      run_count: 0,
      error_count: 0,
      input_definition: JSON.stringify(runSetInputDefWithSourceNone),
      output_definition: JSON.stringify(runSetOutputDefEmpty),
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
      call_caching_enabled: true,
      submission_timestamp: '2022-12-07T17:26:53.153+00:00',
      last_modified_timestamp: '2022-12-07T17:26:53.153+00:00',
      run_count: 1,
      error_count: 0,
      input_definition: JSON.stringify(runSetInputDefSameInputNames),
      output_definition: JSON.stringify(runSetOutputDef),
    },
  ],
};

export const runSetResponseWithStruct = _.set(
  'run_sets[0].input_definition',
  JSON.stringify(runSetInputDefWithStruct),
  runSetResponse
);

export const runSetResponseWithArrays = {
  run_sets: [
    {
      run_set_id: '10000000-0000-0000-0000-000000000001',
      method_id: '00000000-0000-0000-0000-000000000001',
      method_version_id: '50000000-0000-0000-0000-000000000006',
      is_template: true,
      state: 'COMPLETE',
      record_type: 'FOO',
      call_caching_enabled: true,
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
      call_caching_enabled: true,
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
      call_caching_enabled: true,
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
      source_url:
        'https://raw.githubusercontent.com/DataBiosphere/cbas/main/useful_workflows/target_workflow_1/target_workflow_1.wdl',
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
        previously_run: false,
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

const auditInfo: AuditInfo = {
  creator: 'groot@gmail.com',
  createdDate: '2023-10-13T22:26:06.124Z',
  dateAccessed: '2023-10-13T22:26:06.124Z',
  destroyedDate: null,
};

export const mockCromwellApp: App = {
  workspaceId: 'abc-c07807929cd1',
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource: 'path/to/cloud/resource',
  },
  errors: [],
  status: 'RUNNING',
  proxyUrls: {
    cbas: 'https://lz-abc/terra-app-abc/cbas',
    'cbas-ui': 'https://lz-abc/terra-app-abc/',
    cromwell: 'https://lz-abc/terra-app-abc/cromwell',
  },
  appName: 'terra-app-abc',
  appType: 'CROMWELL',
  diskName: null,
  auditInfo,
  accessScope: null,
  labels: {},
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  region: defaultAzureRegion,
};

export const mockCromwellRunner = (status: LeoAppStatus, creator: string = auditInfo.creator): App => ({
  workspaceId: 'abc-c07807929cd1',
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource: 'path/to/cloud/resource',
  },
  errors: [],
  status,
  proxyUrls: {
    'cromwell-runner': 'https://lz-abc/terra-app-cra-def/cromwell',
  },
  appName: 'terra-app-cra-def',
  appType: 'CROMWELL_RUNNER_APP',
  diskName: null,
  auditInfo: {
    ...auditInfo,
    creator,
  },
  accessScope: appAccessScopes.USER_PRIVATE,
  labels: {},
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  region: defaultAzureRegion,
});

export const mockWorkflowsApp: App = {
  workspaceId: 'abc-c07807929cd1',
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource: 'path/to/cloud/resource',
  },
  errors: [],
  status: 'RUNNING',
  proxyUrls: {
    cbas: 'https://lz-abc/terra-app-wfa-abc/cbas',
    'cromwell-reader': 'https://lz-abc/terra-app-wfa-abc/cromwell',
  },
  appName: 'terra-app-wfa-abc',
  appType: 'WORKFLOWS_APP',
  diskName: null,
  auditInfo,
  accessScope: appAccessScopes.WORKSPACE_SHARED,
  labels: {},
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  region: defaultAzureRegion,
};

export const mockWdsApp: App = {
  workspaceId: 'abc-c07807929cd1',
  cloudContext: {
    cloudProvider: 'AZURE',
    cloudResource: 'path/to/cloud/resource',
  },
  errors: [],
  status: 'RUNNING',
  proxyUrls: {
    wds: 'https://lz-abc/wds-abc-c07807929cd1/',
  },
  appName: 'wds-abc-c07807929cd1',
  appType: 'WDS',
  diskName: null,
  auditInfo,
  accessScope: 'WORKSPACE_SHARED',
  labels: {},
  kubernetesRuntimeConfig: { numNodes: 1, machineType: 'n1-highmem-8', autoscalingEnabled: false },
  region: defaultAzureRegion,
};

export const mockAzureApps: App[] = [mockCromwellApp, mockWdsApp];

export const mockCollaborativeAzureApps: App[] = [mockWorkflowsApp, mockCromwellRunner('RUNNING'), mockWdsApp];

export const mockAbortResponse = {
  run_set_id: '20000000-0000-0000-0000-200000000002',
  runs: ['30000000-0000-0000-0000-200000000003'],
  state: 'CANCELING',
};

export const mockAzureWorkspace: AzureWorkspace = {
  workspace: {
    authorizationDomain: [],
    cloudPlatform: 'Azure',
    isLocked: false,
    name: 'test-azure-ws-name',
    namespace: 'test-azure-ws-namespace',
    workspaceId: 'abc-c07807929cd1',
    createdDate: '2023-02-15T19:17:15.711Z',
    lastModified: '2023-02-15T20:17:15.711Z',
    createdBy: 'groot@gmail.com',
  },
  azureContext: {
    managedResourceGroupId: 'test-mrg',
    subscriptionId: 'test-sub-id',
    tenantId: 'test-tenant-id',
  },
  accessLevel: 'OWNER',
  canShare: true,
  canCompute: true,
  policies: [],
};

export const mockWorkflow: WorkflowMetadata = {
  workflowName: 'fetch_sra_to_bam',
  workflowProcessingEvents: [
    {
      cromwellId: 'cromid-b3a731a',
      description: 'Finished',
      timestamp: '2024-01-11T19:58:56.503Z',
      cromwellVersion: '87-225ea5a',
    },
    {
      cromwellId: 'cromid-b3a731a',
      description: 'PickedUp',
      timestamp: '2024-01-11T19:36:14.600Z',
      cromwellVersion: '87-225ea5a',
    },
  ],
  actualWorkflowLanguageVersion: '1.0',
  submittedFiles: {
    workflow:
      'version 1.0\n\nimport "../tasks/tasks_ncbi_tools.wdl" as ncbi_tools\n\nworkflow fetch_sra_to_bam {\n    meta {\n        description: "Retrieve reads from the NCBI Short Read Archive in unaligned BAM format with relevant metadata encoded."\n        author: "Broad Viral Genomics"\n        email:  "viral-ngs@broadinstitute.org"\n        allowNestedInputs: true\n    }\n\n    call ncbi_tools.Fetch_SRA_to_BAM\n\n    output {\n        File   reads_ubam                = Fetch_SRA_to_BAM.reads_ubam\n        String sequencing_center         = Fetch_SRA_to_BAM.sequencing_center\n        String sequencing_platform       = Fetch_SRA_to_BAM.sequencing_platform\n        String sequencing_platform_model = Fetch_SRA_to_BAM.sequencing_platform_model\n        String biosample_accession       = Fetch_SRA_to_BAM.biosample_accession\n        String library_id                = Fetch_SRA_to_BAM.library_id\n        String run_date                  = Fetch_SRA_to_BAM.run_date\n        String sample_collection_date    = Fetch_SRA_to_BAM.sample_collection_date\n        String sample_collected_by       = Fetch_SRA_to_BAM.sample_collected_by\n        String sample_strain             = Fetch_SRA_to_BAM.sample_strain\n        String sample_geo_loc            = Fetch_SRA_to_BAM.sample_geo_loc\n        File   sra_metadata              = Fetch_SRA_to_BAM.sra_metadata\n    }\n}\n',
    root: '',
    options:
      '{\n  "final_workflow_log_dir": "https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-a5150ece-9040-4ff2-8206-375c1e492be5/cromwell-workflow-logs",\n  "read_from_cache": true,\n  "workflow_callback_uri": "https://lz7388ada396994bb48ea5c87a02eed673689c82c2af423d03.servicebus.windows.net/terra-app-a5150ece-9040-4ff2-8206-375c1e492be5-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/cbas/api/batch/v1/runs/results",\n  "write_to_cache": true\n}',
    inputs: '{"fetch_sra_to_bam.Fetch_SRA_to_BAM.SRA_ID":"ERR4868270"}',
    workflowUrl:
      'https://raw.githubusercontent.com/broadinstitute/viral-pipelines/v2.1.33.16/pipes/WDL/workflows/fetch_sra_to_bam.wdl',
    labels: '{}',
  },
  calls: {
    'fetch_sra_to_bam.Fetch_SRA_to_BAM': [
      {
        tes_stderr:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/tes_task/stderr.txt',
        tes_stdout:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/tes_task/stdout.txt',
        stdout:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/execution/stdout',
        commandLine:
          "set -e\n# fetch SRA metadata on this record\nesearch -db sra -q \"ERR4868270\" | efetch -mode json -json > SRA.json\ncp SRA.json \"ERR4868270.json\"\n\n# pull reads from SRA and make a fully annotated BAM -- must succeed\nCENTER=$(jq -r .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SUBMISSION.center_name SRA.json)\nPLATFORM=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM | keys[] as $k | \"\\($k)\"' SRA.json)\nMODEL=$(jq -r \".EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM.$PLATFORM.INSTRUMENT_MODEL\" SRA.json)\nSAMPLE=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.IDENTIFIERS.EXTERNAL_ID|select(.namespace == \"BioSample\")|.content' SRA.json)\nLIBRARY=$(jq -r .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.alias SRA.json)\nRUNDATE=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.RUN_SET.RUN.SRAFiles|if (.SRAFile|type) == \"object\" then .SRAFile.date else [.SRAFile[]|select(.supertype == \"Original\")][0].date end' SRA.json | cut -f 1 -d ' ')\n\nif [ \"$PLATFORM\" = \"OXFORD_NANOPORE\" ]; then\n    # per the SAM/BAM specification\n    SAM_PLATFORM=\"ONT\"\nelse\n    SAM_PLATFORM=\"$PLATFORM\"\nfi\n\nsam-dump --unaligned --header \"ERR4868270\" \\\n    | samtools view -bhS - \\\n    > temp.bam\npicard AddOrReplaceReadGroups \\\n    I=temp.bam \\\n    O=\"ERR4868270.bam\" \\\n    RGID=1 \\\n    RGLB=\"$LIBRARY\" \\\n    RGSM=\"$SAMPLE\" \\\n    RGPL=\"$SAM_PLATFORM\" \\\n    RGPU=\"$LIBRARY\" \\\n    RGPM=\"$MODEL\" \\\n    RGDT=\"$RUNDATE\" \\\n    RGCN=\"$CENTER\" \\\n    VALIDATION_STRINGENCY=SILENT\nrm temp.bam\nsamtools view -H \"ERR4868270.bam\"\n\n# emit numeric WDL outputs\necho $CENTER > OUT_CENTER\necho $PLATFORM > OUT_PLATFORM\necho $SAMPLE > OUT_BIOSAMPLE\necho $LIBRARY > OUT_LIBRARY\necho $RUNDATE > OUT_RUNDATE\nsamtools view -c \"ERR4868270.bam\" | tee OUT_NUM_READS\n\n# pull other metadata from SRA -- allow for silent failures here!\ntouch OUT_MODEL OUT_COLLECTION_DATE OUT_STRAIN OUT_COLLECTED_BY OUT_GEO_LOC\nset +e\njq -r \\\n    .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM.\"$PLATFORM\".INSTRUMENT_MODEL \\\n    SRA.json | tee OUT_MODEL\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"collection_date\" or .TAG==\"collection date\")|.VALUE' \\\n    SRA.json | tee OUT_COLLECTION_DATE\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"strain\")|.VALUE' \\\n    SRA.json | tee OUT_STRAIN\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"collected_by\" or .TAG == \"collecting institution\")|.VALUE' \\\n    SRA.json | tee OUT_COLLECTED_BY\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"geo_loc_name\" or .TAG == \"geographic location (country and/or sea)\")|.VALUE' \\\n    SRA.json | tee OUT_GEO_LOC\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.DESIGN.LIBRARY_DESCRIPTOR.LIBRARY_STRATEGY' \\\n    SRA.json | tee OUT_LIBRARY_STRATEGY\n\nset -e\npython3 << CODE\nimport json\nwith open('SRA.json', 'rt') as inf:\n    meta = json.load(inf)\n# reorganize to look more like a biosample attributes tsv\nbiosample = dict((x['TAG'],x['VALUE']) for x in meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['SAMPLE']['SAMPLE_ATTRIBUTES']['SAMPLE_ATTRIBUTE'])\nbiosample['accession'] = meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['SAMPLE']['IDENTIFIERS']['EXTERNAL_ID']['content']\nbiosample['message'] = 'Successfully loaded'\nbiosample['bioproject_accession'] = meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['STUDY']['IDENTIFIERS']['EXTERNAL_ID']['content']\nbiosample['sample_name'] = biosample['isolate']\nfor k,v in biosample.items():\n    if v == 'not provided':\n        biosample[k] = ''\n\n# British to American conversions (NCBI vs ENA)\nus_to_uk = {\n    'sample_name': 'Sample Name',\n    'isolate': 'Sample Name',\n    'collected_by': 'collecting institution',\n    'collection_date': 'collection date',\n    'geo_loc_name': 'geographic location (country and/or sea)',\n    'host': 'host scientific name',\n}\nfor key_us, key_uk in us_to_uk.items():\n    if not biosample.get(key_us,''):\n        biosample[key_us] = biosample.get(key_uk,'')\n\n# write outputs\nwith open('ERR4868270-biosample_attributes.json', 'wt') as outf:\n    json.dump(biosample, outf)\nCODE",
        shardIndex: -1,
        runtimeAttributes: {
          preemptible: 'true',
          disk: '750 GB',
          failOnStderr: 'false',
          disks: 'local-disk 750 LOCAL',
          continueOnReturnCode: '0',
          docker: 'quay.io/broadinstitute/ncbi-tools:2.10.7.10',
          maxRetries: '2',
          cpu: '2',
          memory: '6 GB',
        },
        callCaching: {
          allowResultReuse: false,
          effectiveCallCachingMode: 'CallCachingOff',
        },
        inputs: {
          docker: 'quay.io/broadinstitute/ncbi-tools:2.10.7.10',
          disk_size: 750,
          SRA_ID: 'ERR4868270',
          machine_mem_gb: null,
        },
        returnCode: 2,
        backend: 'TES',
        end: '2024-01-11T19:49:32.350Z',
        start: '2024-01-11T19:36:15.842Z',
        retryableFailure: true,
        executionStatus: 'RetryableFailure',
        backendStatus: 'Complete',
        compressedDockerSize: 1339143280,
        failures: [
          {
            message:
              "Job fetch_sra_to_bam.Fetch_SRA_to_BAM:NA:1 exited with return code 2 which has not been declared as a valid return code. See 'continueOnReturnCode' runtime attribute for more details.",
            causedBy: [],
          },
        ],
        jobId: '0f25918d_bcf27511ec024b439fb1afa092ba2b91',
        stderr:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/execution/stderr',
        callRoot:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM',
        attempt: 1,
        executionEvents: [
          {
            startTime: '2024-01-11T19:36:18.331Z',
            description: 'PreparingJob',
            endTime: '2024-01-11T19:36:18.352Z',
          },
          {
            startTime: '2024-01-11T19:36:18.331Z',
            description: 'WaitingForValueStore',
            endTime: '2024-01-11T19:36:18.331Z',
          },
          {
            startTime: '2024-01-11T19:36:15.842Z',
            description: 'Pending',
            endTime: '2024-01-11T19:36:15.842Z',
          },
          {
            startTime: '2024-01-11T19:36:15.842Z',
            description: 'RequestingExecutionToken',
            endTime: '2024-01-11T19:36:18.331Z',
          },
          {
            startTime: '2024-01-11T19:36:18.352Z',
            description: 'RunningJob',
            endTime: '2024-01-11T19:49:32.148Z',
          },
          {
            startTime: '2024-01-11T19:49:32.148Z',
            description: 'UpdatingJobStore',
            endTime: '2024-01-11T19:49:32.350Z',
          },
        ],
      },
      {
        tes_stderr:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/tes_task/stderr.txt',
        tes_stdout:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/tes_task/stdout.txt',
        executionStatus: 'Done',
        stdout:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/stdout',
        commandLine:
          "set -e\n# fetch SRA metadata on this record\nesearch -db sra -q \"ERR4868270\" | efetch -mode json -json > SRA.json\ncp SRA.json \"ERR4868270.json\"\n\n# pull reads from SRA and make a fully annotated BAM -- must succeed\nCENTER=$(jq -r .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SUBMISSION.center_name SRA.json)\nPLATFORM=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM | keys[] as $k | \"\\($k)\"' SRA.json)\nMODEL=$(jq -r \".EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM.$PLATFORM.INSTRUMENT_MODEL\" SRA.json)\nSAMPLE=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.IDENTIFIERS.EXTERNAL_ID|select(.namespace == \"BioSample\")|.content' SRA.json)\nLIBRARY=$(jq -r .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.alias SRA.json)\nRUNDATE=$(jq -r '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.RUN_SET.RUN.SRAFiles|if (.SRAFile|type) == \"object\" then .SRAFile.date else [.SRAFile[]|select(.supertype == \"Original\")][0].date end' SRA.json | cut -f 1 -d ' ')\n\nif [ \"$PLATFORM\" = \"OXFORD_NANOPORE\" ]; then\n    # per the SAM/BAM specification\n    SAM_PLATFORM=\"ONT\"\nelse\n    SAM_PLATFORM=\"$PLATFORM\"\nfi\n\nsam-dump --unaligned --header \"ERR4868270\" \\\n    | samtools view -bhS - \\\n    > temp.bam\npicard AddOrReplaceReadGroups \\\n    I=temp.bam \\\n    O=\"ERR4868270.bam\" \\\n    RGID=1 \\\n    RGLB=\"$LIBRARY\" \\\n    RGSM=\"$SAMPLE\" \\\n    RGPL=\"$SAM_PLATFORM\" \\\n    RGPU=\"$LIBRARY\" \\\n    RGPM=\"$MODEL\" \\\n    RGDT=\"$RUNDATE\" \\\n    RGCN=\"$CENTER\" \\\n    VALIDATION_STRINGENCY=SILENT\nrm temp.bam\nsamtools view -H \"ERR4868270.bam\"\n\n# emit numeric WDL outputs\necho $CENTER > OUT_CENTER\necho $PLATFORM > OUT_PLATFORM\necho $SAMPLE > OUT_BIOSAMPLE\necho $LIBRARY > OUT_LIBRARY\necho $RUNDATE > OUT_RUNDATE\nsamtools view -c \"ERR4868270.bam\" | tee OUT_NUM_READS\n\n# pull other metadata from SRA -- allow for silent failures here!\ntouch OUT_MODEL OUT_COLLECTION_DATE OUT_STRAIN OUT_COLLECTED_BY OUT_GEO_LOC\nset +e\njq -r \\\n    .EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.PLATFORM.\"$PLATFORM\".INSTRUMENT_MODEL \\\n    SRA.json | tee OUT_MODEL\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"collection_date\" or .TAG==\"collection date\")|.VALUE' \\\n    SRA.json | tee OUT_COLLECTION_DATE\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"strain\")|.VALUE' \\\n    SRA.json | tee OUT_STRAIN\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"collected_by\" or .TAG == \"collecting institution\")|.VALUE' \\\n    SRA.json | tee OUT_COLLECTED_BY\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.SAMPLE.SAMPLE_ATTRIBUTES.SAMPLE_ATTRIBUTE[]|select(.TAG == \"geo_loc_name\" or .TAG == \"geographic location (country and/or sea)\")|.VALUE' \\\n    SRA.json | tee OUT_GEO_LOC\njq -r \\\n    '.EXPERIMENT_PACKAGE_SET.EXPERIMENT_PACKAGE.EXPERIMENT.DESIGN.LIBRARY_DESCRIPTOR.LIBRARY_STRATEGY' \\\n    SRA.json | tee OUT_LIBRARY_STRATEGY\n\nset -e\npython3 << CODE\nimport json\nwith open('SRA.json', 'rt') as inf:\n    meta = json.load(inf)\n# reorganize to look more like a biosample attributes tsv\nbiosample = dict((x['TAG'],x['VALUE']) for x in meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['SAMPLE']['SAMPLE_ATTRIBUTES']['SAMPLE_ATTRIBUTE'])\nbiosample['accession'] = meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['SAMPLE']['IDENTIFIERS']['EXTERNAL_ID']['content']\nbiosample['message'] = 'Successfully loaded'\nbiosample['bioproject_accession'] = meta['EXPERIMENT_PACKAGE_SET']['EXPERIMENT_PACKAGE']['STUDY']['IDENTIFIERS']['EXTERNAL_ID']['content']\nbiosample['sample_name'] = biosample['isolate']\nfor k,v in biosample.items():\n    if v == 'not provided':\n        biosample[k] = ''\n\n# British to American conversions (NCBI vs ENA)\nus_to_uk = {\n    'sample_name': 'Sample Name',\n    'isolate': 'Sample Name',\n    'collected_by': 'collecting institution',\n    'collection_date': 'collection date',\n    'geo_loc_name': 'geographic location (country and/or sea)',\n    'host': 'host scientific name',\n}\nfor key_us, key_uk in us_to_uk.items():\n    if not biosample.get(key_us,''):\n        biosample[key_us] = biosample.get(key_uk,'')\n\n# write outputs\nwith open('ERR4868270-biosample_attributes.json', 'wt') as outf:\n    json.dump(biosample, outf)\nCODE",
        shardIndex: -1,
        outputs: {
          library_id: 'COG-UK/CAMB-1B8D87/CAMB:20201106_2020_X5_FAO13851_8f36dbb7',
          sample_collection_date: '2020-10-31',
          biosample_accession: 'SAMEA7612766',
          run_date: '2022-06-17',
          sra_metadata:
            'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/ERR4868270.json',
          library_strategy: 'AMPLICON',
          num_reads: 96323,
          sequencing_center: 'Department of Pathology, University of Cambridge',
          reads_ubam:
            'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/ERR4868270.bam',
          sample_strain: '',
          biosample_attributes_json:
            'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/ERR4868270-biosample_attributes.json',
          sample_geo_loc: 'United Kingdom',
          sequencing_platform: 'OXFORD_NANOPORE',
          sample_collected_by: 'Department of Pathology, University of Cambridge',
          sequencing_platform_model: 'GridION',
        },
        runtimeAttributes: {
          preemptible: 'true',
          disk: '750 GB',
          failOnStderr: 'false',
          disks: 'local-disk 750 LOCAL',
          continueOnReturnCode: '0',
          docker: 'quay.io/broadinstitute/ncbi-tools:2.10.7.10',
          maxRetries: '2',
          cpu: '2',
          memory: '6 GB',
        },
        callCaching: {
          allowResultReuse: false,
          effectiveCallCachingMode: 'CallCachingOff',
        },
        inputs: {
          docker: 'quay.io/broadinstitute/ncbi-tools:2.10.7.10',
          disk_size: 750,
          SRA_ID: 'ERR4868270',
          machine_mem_gb: null,
        },
        returnCode: 0,
        jobId: '0f25918d_de170193faa14a55a598253862d19ac3',
        backend: 'TES',
        start: '2024-01-11T19:49:32.441Z',
        backendStatus: 'Complete',
        compressedDockerSize: 1339143280,
        end: '2024-01-11T19:58:55.375Z',
        dockerImageUsed:
          'quay.io/broadinstitute/ncbi-tools@sha256:c6228528a9fa7d3abd78d40821231ec49c122f8c10bb27ae603540c46fc05797',
        stderr:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/stderr',
        callRoot:
          'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2',
        attempt: 2,
        executionEvents: [
          {
            startTime: '2024-01-11T19:58:55.139Z',
            description: 'UpdatingJobStore',
            endTime: '2024-01-11T19:58:55.375Z',
          },
          {
            startTime: '2024-01-11T19:49:33.340Z',
            description: 'RunningJob',
            endTime: '2024-01-11T19:58:55.139Z',
          },
          {
            startTime: '2024-01-11T19:49:32.441Z',
            description: 'RequestingExecutionToken',
            endTime: '2024-01-11T19:49:33.331Z',
          },
          {
            startTime: '2024-01-11T19:49:32.441Z',
            description: 'Pending',
            endTime: '2024-01-11T19:49:32.441Z',
          },
          {
            startTime: '2024-01-11T19:49:33.331Z',
            description: 'PreparingJob',
            endTime: '2024-01-11T19:49:33.340Z',
          },
          {
            startTime: '2024-01-11T19:49:33.331Z',
            description: 'WaitingForValueStore',
            endTime: '2024-01-11T19:49:33.331Z',
          },
        ],
      },
    ],
  },
  outputs: {
    'fetch_sra_to_bam.sra_metadata':
      'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/ERR4868270.json',
    'fetch_sra_to_bam.reads_ubam':
      'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993/call-Fetch_SRA_to_BAM/attempt-2/execution/ERR4868270.bam',
    'fetch_sra_to_bam.biosample_accession': 'SAMEA7612766',
    'fetch_sra_to_bam.sample_geo_loc': 'United Kingdom',
    'fetch_sra_to_bam.sample_collection_date': '2020-10-31',
    'fetch_sra_to_bam.sequencing_center': 'Department of Pathology, University of Cambridge',
    'fetch_sra_to_bam.sequencing_platform': 'OXFORD_NANOPORE',
    'fetch_sra_to_bam.library_id': 'COG-UK/CAMB-1B8D87/CAMB:20201106_2020_X5_FAO13851_8f36dbb7',
    'fetch_sra_to_bam.run_date': '2022-06-17',
    'fetch_sra_to_bam.sample_collected_by': 'Department of Pathology, University of Cambridge',
    'fetch_sra_to_bam.sample_strain': '',
    'fetch_sra_to_bam.sequencing_platform_model': 'GridION',
  },
  workflowRoot:
    'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-91afa8b5-b57e-4760-995f-67f7b5e782e3/fetch_sra_to_bam/0f25918d-f370-4e2d-8d65-0acaf0fe8993',
  actualWorkflowLanguage: 'WDL',
  status: 'Succeeded',
  workflowLog:
    'https://lz813a3d637adefec2c6e88f.blob.core.windows.net/sc-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/workspace-services/cbas/terra-app-a5150ece-9040-4ff2-8206-375c1e492be5/cromwell-workflow-logs/workflow.0f25918d-f370-4e2d-8d65-0acaf0fe8993.log',
  workflowCallback: {
    url: 'https://lz7388ada396994bb48ea5c87a02eed673689c82c2af423d03.servicebus.windows.net/terra-app-a5150ece-9040-4ff2-8206-375c1e492be5-1f1ba1ee-d357-4939-8f98-2d83f6b75f4c/cbas/api/batch/v1/runs/results',
    successful: true,
    timestamp: '2024-01-11T19:58:59.520950Z',
  },
  end: '2024-01-11T19:58:56.503Z',
  start: '2024-01-11T19:36:14.602Z',
  id: '0f25918d-f370-4e2d-8d65-0acaf0fe8993',
  inputs: {
    'fetch_sra_to_bam.Fetch_SRA_to_BAM.machine_mem_gb': null,
    'fetch_sra_to_bam.Fetch_SRA_to_BAM.SRA_ID': 'ERR4868270',
    'fetch_sra_to_bam.Fetch_SRA_to_BAM.docker': 'quay.io/broadinstitute/ncbi-tools:2.10.7.10',
  },
  labels: {
    'cromwell-workflow-id': 'cromwell-0f25918d-f370-4e2d-8d65-0acaf0fe8993',
  },
  submission: '2024-01-11T19:35:34.627Z',
};
