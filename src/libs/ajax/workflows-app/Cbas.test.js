import 'setimmediate';

import { MatchersV3, PactV3, SpecificationVersion } from '@pact-foundation/pact';
import path from 'path';
import { fetchFromProxy, fetchOk, jsonBody } from 'src/libs/ajax/ajax-common';
import { Cbas } from 'src/libs/ajax/workflows-app/Cbas';
import {
  runSetInputDef,
  runSetInputDefWithSourceNone,
  runSetInputDefWithStruct,
  runSetOutputDef,
} from 'src/libs/ajax/workflows-app/CbasMockResponses';

jest.mock('src/libs/ajax/ajax-common');

jest.mock('src/libs/auth', () => {
  return {
    reloadAuthToken: jest.fn(),
    signOutAfterSessionTimeout: jest.fn(),
  };
});

jest.mock('src/libs/state', () => {
  return {
    ...jest.requireActual('src/libs/state'),
    getUser: jest.fn(() => ({ token: 'testtoken' })),
  };
});

const { timestamp, string, regex, boolean, integer, fromProviderState } = MatchersV3;

const UUID_REGEX = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const RUN_STATE_REGEX = 'UNKNOWN|QUEUED|INITIALIZING|RUNNING|PAUSED|COMPLETE|EXECUTOR_ERROR|SYSTEM_ERROR|CANCELED|CANCELING';
const RUNSET_STATE_REGEX = 'UNKNOWN|QUEUED|RUNNING|COMPLETE|ERROR|CANCELED|CANCELING';

const cbasPact = new PactV3({
  consumer: 'terra-ui',
  provider: 'cbas',
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  logLevel: 'warn',
  dir: path.resolve(process.cwd(), 'pacts'),
  spec: SpecificationVersion.SPECIFICATION_VERSION_V3,
});

describe('Cbas tests', () => {
  it('should GET run_sets with method ID 00000000-0000-0000-0000-000000000009', async () => {
    const expectedResponse = {
      fully_updated: boolean(true),
      run_sets: [
        {
          run_set_id: regex(UUID_REGEX, '10000000-0000-0000-0000-000000000009'),
          method_id: regex(UUID_REGEX, '00000000-0000-0000-0000-000000000009'),
          method_version_id: regex(UUID_REGEX, '90000000-0000-0000-0000-000000000009'),
          is_template: boolean(true),
          run_set_name: string('struct_workflow_test template run set'),
          run_set_description: string('struct_workflow_test template submission'),
          state: regex(RUNSET_STATE_REGEX, 'COMPLETE'),
          record_type: string('sample'),
          submission_timestamp: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", '2023-03-28T13:05:02.690+00:00'),
          last_modified_timestamp: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSSXXX", '2023-03-28T13:05:02.690+00:00'),
          run_count: integer(0),
          error_count: integer(0),
          input_definition: string('[...]'),
          output_definition: string('[...]'),
        },
      ],
    };

    await cbasPact.addInteraction({
      states: [{ description: 'at least one run set exists with method_id 00000000-0000-0000-0000-000000000009' }],
      uponReceiving: 'get run set with method_id=00000000-0000-0000-0000-000000000009 and page_size=1',
      withRequest: { method: 'GET', path: '/api/batch/v1/run_sets', query: { method_id: '00000000-0000-0000-0000-000000000009', page_size: 1 } },
      willRespondWith: { status: 200, body: expectedResponse },
    });

    await cbasPact.executeTest(async (mockService) => {
      // ARRANGE
      fetchOk.mockImplementation(async (path) => await fetch(`${mockService.url}/${path}`));
      fetchFromProxy.mockImplementation(() => fetchOk);

      // ACT
      const response = await Cbas('fakeSignal').runSets.getForMethod(mockService.url, '00000000-0000-0000-0000-000000000009', 1);

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchOk).toBeCalledTimes(1);
      expect(fetchFromProxy).toBeCalledTimes(1);
      expect(fetchOk).toBeCalledWith('api/batch/v1/run_sets?method_id=00000000-0000-0000-0000-000000000009&page_size=1', {
        method: 'GET',
        signal: 'fakeSignal',
      });
      expect(response).toHaveProperty('run_sets');
      expect(response).toHaveProperty('fully_updated');
      expect(response.run_sets.length).toEqual(1);
    });
  });

  it('should successfully POST a simple run_set', async () => {
    const expectedResponse = {
      run_set_id: fromProviderState('${run_set_id}', '00000000-0000-0000-0000-000000000000'), // eslint-disable-line no-template-curly-in-string
      runs: [
        {
          run_id: fromProviderState('${run_id}', '00000000-0000-0000-0000-000000000000'), // eslint-disable-line no-template-curly-in-string
          state: regex(RUN_STATE_REGEX, 'RUNNING'),
          errors: regex('.*', 'some arbitrary string'),
        },
      ],
      state: regex(RUNSET_STATE_REGEX, 'RUNNING'),
    };

    const payload = {
      run_set_name: 'myRunSet',
      run_set_description: 'myRunSet description',
      method_version_id: '90000000-0000-0000-0000-000000000009',
      wds_records: { record_type: 'FOO', record_ids: ['FOO1'] },
      workflow_input_definitions: runSetInputDef,
      workflow_output_definitions: runSetOutputDef,
    };

    await cbasPact.addInteraction({
      states: [
        { description: 'ready to fetch recordId FOO1 from recordType FOO from wdsService' },
        { description: 'ready to fetch myMethodVersion with UUID 90000000-0000-0000-0000-000000000009' },
        { description: 'ready to receive exactly 1 call to POST run_sets' },
      ],
      uponReceiving: 'post a simple run set',
      withRequest: { path: '/api/batch/v1/run_sets', method: 'POST', ...jsonBody(payload) },
      willRespondWith: { status: 200, body: expectedResponse },
    });

    await cbasPact.executeTest(async (mockService) => {
      // ARRANGE
      const signal = 'fakeSignal';

      fetchOk.mockImplementation(async (path) => await fetch(`${mockService.url}/${path}`, { method: 'POST', ...jsonBody(payload) }));
      fetchFromProxy.mockImplementation(() => fetchOk);

      // ACT
      const response = await Cbas(signal).runSets.post(mockService.url, payload);

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchOk).toBeCalledTimes(1);
      expect(fetchFromProxy).toBeCalledTimes(1);
      expect(fetchOk).toBeCalledWith('api/batch/v1/run_sets', { method: 'POST', ...jsonBody(payload), signal });
      expect(response).toHaveProperty('run_set_id');
      expect(response.runs.length).toEqual(1);
    });
  });

  it('should successfully POST a run_set containing a "none" source', async () => {
    const expectedResponse = {
      run_set_id: fromProviderState('${run_set_id}', '00000000-0000-0000-0000-000000000000'), // eslint-disable-line no-template-curly-in-string
      runs: [
        {
          run_id: fromProviderState('${run_id}', '00000000-0000-0000-0000-000000000000'), // eslint-disable-line no-template-curly-in-string
          state: regex(RUN_STATE_REGEX, 'RUNNING'),
          errors: regex('.*', 'some arbitrary string'),
        },
      ],
      state: regex(RUNSET_STATE_REGEX, 'RUNNING'),
    };

    const payload = {
      run_set_name: 'myRunSet',
      run_set_description: 'myRunSet description',
      method_version_id: '90000000-0000-0000-0000-000000000009',
      wds_records: { record_type: 'FOO', record_ids: ['FOO1'] },
      workflow_input_definitions: runSetInputDefWithSourceNone,
      workflow_output_definitions: runSetOutputDef,
    };

    await cbasPact.addInteraction({
      states: [
        { description: 'ready to fetch recordId FOO1 from recordType FOO from wdsService' },
        { description: 'ready to fetch myMethodVersion with UUID 90000000-0000-0000-0000-000000000009' },
        { description: 'ready to receive exactly 1 call to POST run_sets' },
      ],
      uponReceiving: 'post a run set with a "none" source',
      withRequest: { path: '/api/batch/v1/run_sets', method: 'POST', ...jsonBody(payload) },
      willRespondWith: { status: 200, body: expectedResponse },
    });

    await cbasPact.executeTest(async (mockService) => {
      // ARRANGE
      const signal = 'fakeSignal';

      fetchOk.mockImplementation(async (path) => await fetch(`${mockService.url}/${path}`, { method: 'POST', ...jsonBody(payload) }));
      fetchFromProxy.mockImplementation(() => fetchOk);

      // ACT
      const response = await Cbas(signal).runSets.post(mockService.url, payload);

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchOk).toBeCalledTimes(1);
      expect(fetchFromProxy).toBeCalledTimes(1);
      expect(fetchOk).toBeCalledWith('api/batch/v1/run_sets', { method: 'POST', ...jsonBody(payload), signal });
      expect(response).toHaveProperty('run_set_id');
      expect(response.runs.length).toEqual(1);
    });
  });

  it('should successfully POST a run_set containing a struct input', async () => {
    const expectedResponse = {
      run_set_id: fromProviderState('${run_set_id}', '00000000-0000-0000-0000-000000000000'), // eslint-disable-line no-template-curly-in-string
      runs: [
        {
          run_id: fromProviderState('${run_id}', '00000000-0000-0000-0000-000000000000'), // eslint-disable-line no-template-curly-in-string
          state: regex(RUN_STATE_REGEX, 'RUNNING'),
          errors: regex('.*', 'some arbitrary string'),
        },
      ],
      state: regex(RUNSET_STATE_REGEX, 'RUNNING'),
    };

    const payload = {
      run_set_name: 'myRunSet',
      run_set_description: 'myRunSet description',
      method_version_id: '90000000-0000-0000-0000-000000000009',
      wds_records: { record_type: 'FOO', record_ids: ['FOO1'] },
      workflow_input_definitions: runSetInputDefWithStruct,
      workflow_output_definitions: runSetOutputDef,
    };

    await cbasPact.addInteraction({
      states: [
        { description: 'ready to fetch recordId FOO1 from recordType FOO from wdsService' },
        { description: 'ready to fetch myMethodVersion with UUID 90000000-0000-0000-0000-000000000009' },
        { description: 'ready to receive exactly 1 call to POST run_sets' },
      ],
      uponReceiving: 'post a run set with a struct source',
      withRequest: { path: '/api/batch/v1/run_sets', method: 'POST', ...jsonBody(payload) },
      willRespondWith: { status: 200, body: expectedResponse },
    });

    await cbasPact.executeTest(async (mockService) => {
      // ARRANGE
      const signal = 'fakeSignal';

      fetchOk.mockImplementation(async (path) => await fetch(`${mockService.url}/${path}`, { method: 'POST', ...jsonBody(payload) }));
      fetchFromProxy.mockImplementation(() => fetchOk);

      // ACT
      const response = await Cbas(signal).runSets.post(payload);

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchOk).toBeCalledTimes(1);
      expect(fetchFromProxy).toBeCalledTimes(1);
      expect(fetchOk).toBeCalledWith('api/batch/v1/run_sets', { method: 'POST', ...jsonBody(payload), signal });
      expect(response).toHaveProperty('run_set_id');
      expect(response.runs.length).toEqual(1);
    });
  });

  it('should successfully POST an abort request for a running submission', async () => {
    const expectedResponse = {
      run_set_id: fromProviderState('${run_set_id}', '20000000-0000-0000-0000-000000000002'), // eslint-disable-line no-template-curly-in-string
      runs: [
        fromProviderState('${run_id}', '30000000-0000-0000-0000-000000000003'), // eslint-disable-line no-template-curly-in-string
      ],
      state: regex(RUNSET_STATE_REGEX, 'CANCELING'),
    };

    const runSetId = '20000000-0000-0000-0000-000000000002';
    const headers = { 'Content-Type': 'application/json' };

    await cbasPact.addInteraction({
      states: [{ description: 'a run set with UUID 20000000-0000-0000-0000-000000000002 exists' }],
      uponReceiving: 'a POST request to abort a run set',
      withRequest: { method: 'POST', path: '/api/batch/v1/run_sets/abort', query: { run_set_id: runSetId } },
      willRespondWith: { status: 200, body: expectedResponse },
    });

    await cbasPact.executeTest(async (mockService) => {
      // ARRANGE
      const signal = 'fakeSignal';

      fetchOk.mockImplementation(async (path) => await fetch(`${mockService.url}/${path}`, { method: 'POST', headers }));
      fetchFromProxy.mockImplementation(() => fetchOk);

      // ACT
      const response = await Cbas(signal).runSets.cancel(mockService.url, runSetId);

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchOk).toBeCalledTimes(1);
      expect(fetchFromProxy).toBeCalledTimes(1);
      expect(fetchOk).toBeCalledWith(`api/batch/v1/run_sets/abort?run_set_id=${runSetId}`, { method: 'POST', signal });
      expect(response).toHaveProperty('run_set_id');
      expect(response).toHaveProperty('runs');
      expect(response).toHaveProperty('state');
      expect(response.runs.length).toEqual(1);
    });
  });

  it('should successfully POST a method', async () => {
    const expectedResponse = {
      run_set_id: regex(UUID_REGEX, '00000000-0000-0000-0000-000000000000'),
      method_id: regex(UUID_REGEX, '00000000-0000-0000-0000-000000000000'),
    };

    const payload = {
      method_name: 'scATAC-imported-4',
      method_source: 'GitHub',
      method_version: 'imported-version-4',
      method_url: 'https://github.com/broadinstitute/warp/blob/develop/pipelines/skylab/scATAC/scATAC.wdl',
    };

    await cbasPact.addInteraction({
      states: [
        { description: 'ready to fetch myMethodVersion with UUID 90000000-0000-0000-0000-000000000009' },
        { description: 'cromwell initialized' },
      ],
      uponReceiving: 'a POST request to import a method',
      withRequest: { method: 'POST', path: '/api/batch/v1/methods', ...jsonBody(payload) },
      willRespondWith: { status: 200, body: expectedResponse },
    });

    await cbasPact.executeTest(async (mockService) => {
      // ARRANGE
      const signal = 'fakeSignal';
      fetchOk.mockImplementation(async (path) => await fetch(`${mockService.url}/${path}`, { method: 'POST', ...jsonBody(payload) }));
      fetchFromProxy.mockImplementation(() => fetchOk);

      // ACT
      const response = await Cbas(signal).methods.post(mockService.url, payload);

      // ASSERT
      expect(response).toBeDefined();
      expect(fetchOk).toBeCalledTimes(1);
      expect(fetchFromProxy).toBeCalledTimes(1);
      expect(fetchOk).toBeCalledWith('api/batch/v1/methods', { method: 'POST', signal, ...jsonBody(payload) });
    });
  });
});
