export const workflowParams = [
  {
    input_name: 'wf_hello.hello.addressee',
    input_type: {
      type: 'primitive',
      primitive_type: 'String',
    },
    source: {
      type: 'record_lookup',
      record_attribute: 'foo_name',
    },
  },
];

export const runsData = {
  runs: [
    {
      run_id: 'b7234aae-6f43-405e-bb3a-71f924e09825',
      engine_id: 'b29e84b1-ad1b-4462-a9a0-7ec849bf30a8',
      run_set_id: '0cd15673-7342-4cfa-883d-819660184a16',
      record_id: 'FOO2',
      workflow_url: 'https://xyz.wdl',
      state: 'SYSTEM_ERROR',
      workflow_params: JSON.stringify(workflowParams),
      workflow_outputs: '[]',
      submission_date: '2022-07-14T22:22:15.591Z',
      last_modified_timestamp: '2022-07-14T23:14:25.791Z',
      error_messages: ['failed workflow'],
    },
    {
      run_id: '55b36a53-2ff3-41d0-adc4-abc08aea88ad',
      engine_id: 'd16721eb-8745-4aa2-b71e-9ade2d6575aa',
      run_set_id: '0cd15673-7342-4cfa-883d-819660184a16',
      record_id: 'FOO1',
      workflow_url:
        'https://raw.githubusercontent.com/broadinstitute/cromwell/a40de672c565c4bbd40f57ff96d4ee520dc2b4fc/centaur/src/main/resources/standardTestCases/hello/hello.wdl',
      state: 'COMPLETE',
      workflow_params: JSON.stringify(workflowParams),
      workflow_outputs: '[]',
      submission_date: '2022-12-08T23:29:18.675+00:00',
      last_modified_timestamp: '2022-12-08T23:29:55.695+00:00',
    },
  ],
};

export const runSetData = {
  run_sets: [
    {
      run_set_id: 'e8347247-4738-4ad1-a591-56c119f93f58',
      method_id: '00000000-0000-0000-0000-000000000004',
      method_version_id: '20000000-0000-0000-0000-000000000004',
      is_template: false,
      run_set_name: 'hello world',
      run_set_description: 'test',
      state: 'COMPLETE',
      record_type: 'FOO',
      submission_timestamp: '2022-12-08T23:28:50.280+00:00',
      last_modified_timestamp: '2022-12-09T16:30:50.280+00:00',
      run_count: 1,
      error_count: 0,
      input_definition: JSON.stringify(workflowParams),
      output_definition: '[]',
    },
  ],
};

export const methodData = {
  methods: [
    {
      method_id: '00000000-0000-0000-0000-000000000004',
      name: 'Hello world',
      description: 'Add description',
      source: 'Github',
      source_url:
        'https://raw.githubusercontent.com/broadinstitute/cromwell/a40de672c565c4bbd40f57ff96d4ee520dc2b4fc/centaur/src/main/resources/standardTestCases/hello/hello.wdl',
      created: '2022-12-08T23:28:50.280+00:00',
      last_run: {
        run_previously: false,
        timestamp: '2022-12-08T23:28:50.280+00:00',
        run_set_id: 'e8347247-4738-4ad1-a591-56c119f93f58',
        method_version_id: '20000000-0000-0000-0000-000000000004',
        method_version_name: '1.0',
      },
    },
  ],
};

export const simpleRunsData = {
  runs: [
    {
      run_id: 'b29e84b1-ad1b-4462-a9a0-7ec849bf30a8',
      engine_id: 'b29e84b1-ad1b-4462-a9a0-7ec849bf30a8',
      run_set_id: '0cd15673-7342-4cfa-883d-819660184a16',
      record_id: 'FOO2',
      workflow_url: 'https://xyz.wdl',
      state: 'RUNNING',
      workflow_params: JSON.stringify(workflowParams),
      workflow_outputs: '[]',
      submission_date: new Date().toISOString(),
      last_modified_timestamp: new Date().toISOString(),
      error_messages: [],
    },
  ],
  fully_updated: true,
};
