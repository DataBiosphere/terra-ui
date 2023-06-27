import _ from 'lodash/fp';
import {
  convertToPrimitiveType,
  getDuration,
  isPrimitiveTypeInputValid,
  isRunInTerminalState,
  isRunSetInTerminalState,
  resolveWdsUrl,
  validateInputs,
} from 'src/components/workflows-cbas/submission-common';
import { getConfig } from 'src/libs/config';

jest.mock('src/libs/config', () => ({
  ...jest.requireActual('src/libs/config'),
  getConfig: jest.fn().mockReturnValue({}),
}));

describe('getDuration', () => {
  const submissionTimestamp = '2023-02-15T20:46:06.242+00:00';
  const lastModifiedTimestamp = '2023-02-15T20:47:46.242+00:00';

  const terminalTestCases = [
    { type: 'Run Set', state: 'COMPLETE', stateCallback: isRunSetInTerminalState },
    { type: 'Run Set', state: 'ERROR', stateCallback: isRunSetInTerminalState },
    { type: 'Run', state: 'COMPLETE', stateCallback: isRunInTerminalState },
    { type: 'Run', state: 'CANCELED', stateCallback: isRunInTerminalState },
    { type: 'Run', state: 'SYSTEM_ERROR', stateCallback: isRunInTerminalState },
    { type: 'Run', state: 'ABORTED', stateCallback: isRunInTerminalState },
    { type: 'Run', state: 'EXECUTOR_ERROR', stateCallback: isRunInTerminalState },
  ];

  const nonTerminalTestCases = [
    { type: 'Run Set', state: 'UNKNOWN', stateCallback: isRunSetInTerminalState },
    { type: 'Run Set', state: 'RUNNING', stateCallback: isRunSetInTerminalState },
    { type: 'Run', state: 'INITIALIZING', stateCallback: isRunInTerminalState },
    { type: 'Run', state: 'QUEUED', stateCallback: isRunInTerminalState },
    { type: 'Run', state: 'RUNNING', stateCallback: isRunInTerminalState },
    { type: 'Run', state: 'PAUSED', stateCallback: isRunInTerminalState },
    { type: 'Run', state: 'CANCELING', stateCallback: isRunInTerminalState },
    { type: 'Run', state: 'UNKNOWN', stateCallback: isRunInTerminalState },
  ];

  test.each(terminalTestCases)('returns duration for $type in terminal state $state', ({ state, stateCallback }) => {
    expect(getDuration(state, submissionTimestamp, lastModifiedTimestamp, stateCallback)).toBe(100);
  });

  test.each(nonTerminalTestCases)('returns duration for $type in non-terminal state $state', ({ state, stateCallback }) => {
    // since run set is in non-terminal state, we get duration as difference in seconds between current time and submission_timestamp
    // so for testing purposes we deduct 20 seconds from current time and pass it as submission_timestamp
    const currentTime = new Date();
    expect(getDuration(state, currentTime.setTime(currentTime.getTime() - 20000), lastModifiedTimestamp, stateCallback)).toBe(20);
  });
});

describe('resolveWdsUrl', () => {
  const mockWdsProxyUrl = 'https://lzabc123.servicebus.windows.net/abc-proxy-url/wds';
  const firstWdsProxyUrl = 'https://lzabc123.servicebus.windows.net/first-wds-app-proxy-url/wds';

  const generateMockApp = (appType, status, wdsUrl, createdDate) => {
    return {
      appType,
      workspaceId: 'abc-123',
      appName: 'wds-abc-123',
      status,
      proxyUrls: { wds: wdsUrl },
      auditInfo: {
        createdDate,
      },
    };
  };

  const testCases = [
    { appStatus: 'RUNNING', expectedUrl: mockWdsProxyUrl },
    { appStatus: 'PROVISIONING', expectedUrl: '' },
    { appStatus: 'STOPPED', expectedUrl: '' },
    { appStatus: 'STOPPING', expectedUrl: '' },
    { appStatus: 'ERROR', expectedUrl: '' },
  ];

  beforeEach(() => {
    getConfig.mockReturnValue({ wdsAppTypeNames: ['WDS', 'CROMWELL'] });
  });

  test.each(testCases)(
    "properly extracts the correct value for a WDS app in '$appStatus' state from the Leo response ",
    ({ appStatus, expectedUrl }) => {
      const mockAppList = [generateMockApp('WDS', appStatus, mockWdsProxyUrl, '2022-01-24T14:27:28.740880Z')];
      expect(resolveWdsUrl(mockAppList)).toBe(expectedUrl);
    }
  );

  it('returns empty string if no CROMWELL app exists but other apps are present', () => {
    const mockAppList = [generateMockApp('GALAXY', 'RUNNING', mockWdsProxyUrl, '2022-01-24T14:27:28.740880Z')];
    expect(resolveWdsUrl(mockAppList)).toBe('');
  });

  it('returns the earliest created RUNNING app url if more than one exists', () => {
    const mockAppList = [
      generateMockApp('WDS', 'RUNNING', firstWdsProxyUrl, '2022-01-24T14:27:28.740880Z'),
      generateMockApp('WDS', 'RUNNING', mockWdsProxyUrl, '2023-01-24T15:27:28.740880Z'),
    ];
    expect(resolveWdsUrl(mockAppList)).toBe(firstWdsProxyUrl);
  });

  it.each([
    { appStatus: 'RUNNING', expectedUrl: mockWdsProxyUrl },
    { appStatus: 'PROVISIONING', expectedUrl: '' },
    { appStatus: 'STOPPED', expectedUrl: '' },
    { appStatus: 'STOPPING', expectedUrl: '' },
  ])('gives precedence to the WDS appType over the CROMWELL appType', ({ appStatus, expectedUrl }) => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    const testHealthyAppProxyUrlResponse = [
      { appType: 'CROMWELL', appName: `wds-${uuid}`, status: 'RUNNING', proxyUrls: { wds: 'should_not_return' }, workspaceId: uuid },
      { appType: 'WDS', appName: `wds-${uuid}`, status: appStatus, proxyUrls: { wds: mockWdsProxyUrl }, workspaceId: uuid },
    ];
    expect(resolveWdsUrl(testHealthyAppProxyUrlResponse)).toBe(expectedUrl);
  });
});

describe('convertToPrimitiveType', () => {
  const testCases = [
    { primitiveType: 'Int', value: '0', expectedTypeof: 'number', convertedValue: 0 },
    { primitiveType: 'Int', value: '123', expectedTypeof: 'number', convertedValue: 123 },
    { primitiveType: 'Float', value: '0', expectedTypeof: 'number', convertedValue: 0 },
    { primitiveType: 'Float', value: '23.32', expectedTypeof: 'number', convertedValue: 23.32 },
    { primitiveType: 'Boolean', value: 'false', expectedTypeof: 'boolean', convertedValue: false },
    { primitiveType: 'String', value: 'hello world!', expectedTypeof: 'string', convertedValue: 'hello world!' },
    { primitiveType: 'File', value: 'https://abc.wdl', expectedTypeof: 'string', convertedValue: 'https://abc.wdl' },
  ];

  test.each(testCases)('converts value to $primitiveType type as expected', ({ primitiveType, value, expectedTypeof, convertedValue }) => {
    const result = convertToPrimitiveType(primitiveType, value);
    expect(typeof result).toBe(expectedTypeof);
    expect(result).toBe(convertedValue);
  });
});

describe('isPrimitiveTypeInputValid', () => {
  const testCases = [
    { primitiveType: 'Int', value: '0', expectedResult: true },
    { primitiveType: 'Int', value: '123', expectedResult: true },
    { primitiveType: 'Int', value: '123xHello', expectedResult: false },
    { primitiveType: 'Int', value: 'Hello', expectedResult: false },
    { primitiveType: 'Int', value: '1234.45', expectedResult: false },
    { primitiveType: 'Int', value: '    ', expectedResult: false },
    { primitiveType: 'Float', value: '0', expectedResult: true },
    { primitiveType: 'Float', value: '23.32', expectedResult: true },
    { primitiveType: 'Float', value: '23.0', expectedResult: true },
    { primitiveType: 'Float', value: '23', expectedResult: true },
    { primitiveType: 'Float', value: '23.0x', expectedResult: false },
    { primitiveType: 'Float', value: 'Hello', expectedResult: false },
    { primitiveType: 'Float', value: '     ', expectedResult: false },
    { primitiveType: 'Boolean', value: '   ', expectedResult: false },
    { primitiveType: 'Boolean', value: 'true', expectedResult: true },
    { primitiveType: 'Boolean', value: 'false', expectedResult: true },
    { primitiveType: 'Boolean', value: 'hello', expectedResult: false },
    { primitiveType: 'Boolean', value: '123', expectedResult: false },
    { primitiveType: 'String', value: 'hello world!', expectedResult: true },
    { primitiveType: 'String', value: '123.32', expectedResult: true },
    { primitiveType: 'File', value: 'https://abc.wdl', expectedResult: true },
  ];

  test.each(testCases)(
    "returns if value '$value' for type $primitiveType is valid or not type as expected",
    ({ primitiveType, value, expectedResult }) => {
      expect(isPrimitiveTypeInputValid(primitiveType, value)).toBe(expectedResult);
    }
  );
});

describe('validateInputs', () => {
  const emptyDataTableAttributes = {};

  const intInput = (value) => {
    return {
      input_name: 'test_workflow.foo_int',
      input_type: {
        type: 'primitive',
        primitive_type: 'Int',
      },
      source: {
        type: 'literal',
        parameter_value: value,
      },
    };
  };

  const floatInput = (value) => {
    return {
      input_name: 'test_workflow.bar_float',
      input_type: {
        type: 'optional',
        optional_type: {
          type: 'primitive',
          primitive_type: 'Float',
        },
      },
      source: {
        type: 'literal',
        parameter_value: value,
      },
    };
  };

  it('should return list of required inputs with source none', () => {
    const sourceNoneInt = _.set('source', { type: 'none' }, intInput('123'));
    const sourceNoneFloat = _.set('source', { type: 'none' }, floatInput('123'));

    const validatedInputs = validateInputs([sourceNoneInt, sourceNoneFloat], emptyDataTableAttributes);
    expect(validatedInputs.length).toBe(2);
    expect(validatedInputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: sourceNoneInt.input_name, type: 'error' }),
        { name: sourceNoneFloat.input_name, type: 'none' },
      ])
    );
  });

  it('should return list of inputs with incorrect values', () => {
    const invalidIntInput = intInput('123x');
    const invalidFloatInput = floatInput('wrong_value');
    const inputsWithIncorrectValuesDefinition = [
      invalidIntInput,
      invalidFloatInput,
      {
        input_name: 'test_workflow.foo_boolean',
        input_type: {
          type: 'optional',
          optional_type: {
            type: 'primitive',
            primitive_type: 'Boolean',
          },
        },
        source: {
          type: 'literal',
          parameter_value: false,
        },
      },
    ];

    const validatedInputs = validateInputs(inputsWithIncorrectValuesDefinition, emptyDataTableAttributes);
    expect(validatedInputs.length).toBe(3);
    expect(validatedInputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: invalidIntInput.input_name, type: 'error' }),
        expect.objectContaining({ name: invalidFloatInput.input_name, type: 'error' }),
        { name: 'test_workflow.foo_boolean', type: 'none' },
      ])
    );
  });

  it('should return empty list for input definition with correct input values', () => {
    const inputsWithCorrectValuesDefinition = [intInput(1234), floatInput(23.32)];

    const validatedInputs = validateInputs(inputsWithCorrectValuesDefinition, emptyDataTableAttributes);
    expect(validatedInputs.length).toBe(2);
    expect(validatedInputs).toEqual(
      expect.arrayContaining([
        { name: intInput().input_name, type: 'none' },
        { name: floatInput().input_name, type: 'none' },
      ])
    );
  });

  it('should consider 0 and false as valid value', () => {
    const validIntInput = {
      input_name: 'test_workflow.foo_int',
      input_type: {
        type: 'primitive',
        primitive_type: 'Int',
      },
      source: {
        type: 'literal',
        parameter_value: 0,
      },
    };
    const validFloatInput = {
      input_name: 'test_workflow.bar_float',
      input_type: {
        type: 'primitive',
        primitive_type: 'Float',
      },
      source: {
        type: 'literal',
        parameter_value: 0,
      },
    };
    const validBooleanInput = {
      input_name: 'test_workflow.foo_boolean',
      input_type: {
        type: 'primitive',
        primitive_type: 'Boolean',
      },
      source: {
        type: 'literal',
        parameter_value: false,
      },
    };
    const inputs = [validIntInput, validFloatInput, validBooleanInput];

    const validatedInputs = validateInputs(inputs, emptyDataTableAttributes);
    expect(validatedInputs.length).toBe(3);
    expect(validatedInputs).toEqual(expect.arrayContaining(_.map((input) => ({ name: input.input_name, type: 'none' }))(inputs)));
  });

  const arrayInput = (name, arrayType, value) => {
    return {
      input_name: name,
      input_type: {
        type: 'optional',
        optional_type: {
          type: 'array',
          array_type: {
            type: 'primitive',
            primitive_type: arrayType,
          },
        },
      },
      source: {
        type: 'literal',
        parameter_value: value,
      },
    };
  };

  it('should validate array literals', () => {
    const inputsWithArraysDefinition = [
      // int arrays (float similar enough that not worried about specifics)
      arrayInput('validInt', 'Int', [1, 2, 3]), // success
      arrayInput('validIntString', 'Int', ['1', 2, 3]), // success
      arrayInput('validIntStringArray', 'Int', '[1, 2, 3]'), // success
      arrayInput('validIntStringSingleton', 'Int', '1'), // info
      arrayInput('validIntSingleton', 'Int', 1), // info
      arrayInput('invalidIntEmpty', 'Int', ''), // error
      arrayInput('invalidIntFloat', 'Int', [1, 2.5, 3]), // error
      arrayInput('invalidIntString', 'Int', [1, 'a', 3]), // error

      // boolean arrays
      arrayInput('validBoolean', 'Boolean', [true, false, true]), // success
      arrayInput('validBooleanString', 'Boolean', ['true', false, true]), // success
      arrayInput('validBooleanStringArray', 'Boolean', '[true, false, true]'), // success
      arrayInput('validBooleanStringSingleton', 'Boolean', 'true'), // info
      arrayInput('validBooleanSingleton', 'Boolean', true), // info
      arrayInput('invalidBooleanEmpty', 'Boolean', ''), // error
      arrayInput('invalidBooleanInt', 'Boolean', [true, 2, false]), // error
      arrayInput('invalidBooleanString', 'Boolean', [true, 'a', false]), // error

      // string arrays
      arrayInput('validString', 'String', ['a', 'b', 'c']), // success
      arrayInput('validStringArray', 'String', '["a", "b", "c"]'), // success
      arrayInput('validStringSingleton', 'String', 'foo'), // info
      arrayInput('invalidStringEmpty', 'String', ''), // error
    ];

    const inputMessages = validateInputs(inputsWithArraysDefinition, emptyDataTableAttributes);
    const {
      error: errorInputs,
      info: infoInputs,
      success: successInputs,
    } = _.flow(_.groupBy('type'), _.mapValues(_.map((message) => message.name)))(inputMessages);

    expect(inputMessages.length).toBe(inputsWithArraysDefinition.length);
    expect(errorInputs.length).toBe(7);
    expect(infoInputs.length).toBe(5);
    expect(successInputs.length).toBe(8);

    expect(errorInputs).toEqual(
      expect.arrayContaining([
        'invalidIntEmpty',
        'invalidIntFloat',
        'invalidIntString',
        'invalidBooleanEmpty',
        'invalidBooleanInt',
        'invalidBooleanString',
        'invalidStringEmpty',
      ])
    );
    expect(infoInputs).toEqual(
      expect.arrayContaining([
        'validIntStringSingleton',
        'validIntSingleton',
        'validBooleanStringSingleton',
        'validBooleanSingleton',
        'validStringSingleton',
      ])
    );
    expect(successInputs).toEqual(
      expect.arrayContaining([
        'validInt',
        'validIntString',
        'validIntStringArray',
        'validBoolean',
        'validBooleanString',
        'validBooleanStringArray',
        'validString',
        'validStringArray',
      ])
    );
  });
});
