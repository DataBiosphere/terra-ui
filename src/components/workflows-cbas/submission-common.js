import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { Link, Select } from 'src/components/common';
import { icon } from 'src/components/icons';
import { TextInput } from 'src/components/input';
import { statusType as jobStatusType } from 'src/components/job-common';
import TooltipTrigger from 'src/components/TooltipTrigger';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { getConfig } from 'src/libs/config';
import { notify } from 'src/libs/notifications';
import { differenceFromDatesInSeconds, differenceFromNowInSeconds } from 'src/libs/utils';
import * as Utils from 'src/libs/utils';

export const AutoRefreshInterval = 1000 * 60; // 1 minute
export const WdsPollInterval = 1000 * 30; // 30 seconds

const iconSize = 24;
export const addCountSuffix = (label, count = undefined) => {
  return label + (count === undefined ? '' : `: ${count}`);
};

export const statusType = {
  ...jobStatusType,
  canceling: {
    id: 'canceling', // Must match variable name for collection unpacking.
    label: () => 'Canceling',
    icon: (style) => icon('sync', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
  canceled: {
    id: 'canceled', // Must match variable name for collection unpacking.
    label: () => 'Canceled',
    icon: (style) => icon('warning-standard', { size: iconSize, style: { color: colors.dark(), ...style } }),
  },
};

/**
 * Returns the rendered status line, based on icon function, label, and style.
 */
export const makeStatusLine = (iconFn, label, style) =>
  div({ style: { display: 'flex', alignItems: 'center', fontSize: 14, ...style } }, [iconFn({ marginRight: '0.5rem' }), label]);

const RunSetTerminalStates = ['ERROR', 'COMPLETE', 'CANCELED'];
export const isRunSetInTerminalState = (runSetStatus) => RunSetTerminalStates.includes(runSetStatus);

const RunTerminalStates = ['COMPLETE', 'CANCELED', 'SYSTEM_ERROR', 'ABORTED', 'EXECUTOR_ERROR'];
export const isRunInTerminalState = (runStatus) => RunTerminalStates.includes(runStatus);

const Covid19Methods = ['fetch_sra_to_bam', 'assemble_refbased', 'sarscov2_nextstrain'];
export const isCovid19Method = (methodName) => Covid19Methods.includes(methodName);

export const getDuration = (state, submissionDate, lastModifiedTimestamp, stateCheckCallback) => {
  return stateCheckCallback(state) ? differenceFromDatesInSeconds(submissionDate, lastModifiedTimestamp) : differenceFromNowInSeconds(submissionDate);
};

export const loadAllRunSets = async (signal) => {
  try {
    const getRunSets = await Ajax(signal).Cbas.runSets.get();
    const durationEnhancedRunSets = _.map(
      (r) => _.merge(r, { duration: getDuration(r.state, r.submission_timestamp, r.last_modified_timestamp, isRunSetInTerminalState) }),
      getRunSets.run_sets
    );
    return _.merge(getRunSets, { run_sets: durationEnhancedRunSets });
  } catch (error) {
    notify('error', 'Error getting run set data', { detail: error instanceof Response ? await error.text() : error });
  }
};

// Invokes logic to determine the appropriate app for WDS
// If WDS is not running, a URL will not be present, in this case we return empty string
// Note: This logic has been copied from how DataTable finds WDS app in Terra UI (https://github.com/DataBiosphere/terra-ui/blob/ac13bdf3954788ca7c8fd27b8fd4cfc755f150ff/src/libs/ajax/data-table-providers/WdsDataTableProvider.ts#L94-L147)
export const resolveApp = (apps, appTypeName, prefix) => {
  // WDS looks for Kubernetes deployment statuses (such as RUNNING or PROVISIONING), expressed by Leo
  // See here for specific enumerations -- https://github.com/DataBiosphere/leonardo/blob/develop/core/src/main/scala/org/broadinstitute/dsde/workbench/leonardo/kubernetesModels.scala
  // look explicitly for a RUNNING app named 'wds-${app.workspaceId}' -- if WDS is healthy and running, there should only be one app RUNNING
  // an app may be in the 'PROVISIONING', 'STOPPED', 'STOPPING', which can still be deemed as an OK state for WDS
  const healthyStates = ['RUNNING', 'PROVISIONING', 'STOPPED', 'STOPPING'];

  const namedApp = apps.filter(
    (app) => app.appType === appTypeName && app.appName === `${prefix}-${app.workspaceId}` && healthyStates.includes(app.status)
  );
  if (namedApp.length === 1) {
    return namedApp[0];
  }

  // Failed to find an app with the proper name, look for a RUNNING WDS app
  const runningAppsCorrectType = apps.filter((app) => app.appType === appTypeName && app.status === 'RUNNING');
  if (runningAppsCorrectType.length > 0) {
    // Evaluate the earliest-created app
    runningAppsCorrectType.sort((a, b) => new Date(a.auditInfo.createdDate).valueOf() - new Date(b.auditInfo.createdDate).valueOf());
    return runningAppsCorrectType[0];
  }

  // If we reach this logic, we have more than one Leo app with the associated workspace Id...
  const allAppsCorrectType = apps.filter((app) => app.appType === appTypeName && ['PROVISIONING', 'STOPPED', 'STOPPING'].includes(app.status));
  if (allAppsCorrectType.length > 0) {
    // Evaluate the earliest-created WDS app
    allAppsCorrectType.sort((a, b) => new Date(a.auditInfo.createdDate).valueOf() - new Date(b.auditInfo.createdDate).valueOf());
    return allAppsCorrectType[0];
  }

  return '';
};

// Extract WDS proxy URL from Leo response. Exported for testing
export const resolveWdsUrl = (apps) => {
  const foundApp = resolveApp(apps, 'WDS', 'wds');
  if (foundApp?.status === 'RUNNING') {
    return foundApp.proxyUrls.wds;
  }
  return '';
};
// Extract CBAS proxy URL from Leo response. Exported for testing
export const resolveCbasUrl = (apps) => {
  const foundApp = resolveApp(apps, 'CROMWELL', 'terra-app');
  if (foundApp?.status === 'RUNNING') {
    return foundApp.proxyUrls.cbas;
  }
  return '';
};

const getProxyUrl = async (root, workspaceId, resolver) => {
  if (root) {
    return { status: 'Ready', state: root };
  }
  try {
    const url = await Ajax().Apps.listAppsV2(workspaceId).then(resolver);
    if (url) {
      return { status: 'Ready', state: url };
    }
    return { status: 'None', state: '' };
  } catch (error) {
    if (error.status === 401) return { status: 'Unauthorized', state: error };
    return { status: 'Error', state: error };
  }
};

export const loadAppUrls = async (workspaceId) => {
  // for local testing - since we use local WDS setup, we don't need to call Leo to get proxy url
  // for CBAS UI deployed in app - we don't want to decouple CBAS and WDS yet. Until then we keep using WDS url passed in config.
  // When we are ready for that change to be released, we should remove `wdsUrlRoot` from cromwhelm configs
  // and then CBAS UI will talk to Leo to get WDS url root.
  const wdsUrlRoot = getConfig().wdsUrlRoot;
  const cbasUrlRoot = getConfig().cbasUrlRoot;
  const wdsProxyUrlResponse = getProxyUrl(wdsUrlRoot, workspaceId, resolveWdsUrl);
  const cbasProxyUrlResponse = getProxyUrl(cbasUrlRoot, workspaceId, resolveCbasUrl);
  return {
    wds: wdsProxyUrlResponse,
    cbas: cbasProxyUrlResponse,
  };
};

export const parseMethodString = (methodString) => {
  const methodNameParts = methodString.split('.');
  return {
    workflow: methodNameParts[0],
    call: methodNameParts.length === 3 ? methodNameParts[1] : '',
    variable: methodNameParts[methodNameParts.length - 1],
  };
};

export const inputSourceLabels = {
  literal: 'Type a Value',
  record_lookup: 'Fetch from Data Table',
  object_builder: 'Use Struct Builder',
  none: 'None',
};
const inputSourceTypes = _.invert(inputSourceLabels);

const inputTypeParamDefaults = {
  literal: { parameter_value: '' },
  record_lookup: { record_attribute: '' },
  object_builder: { fields: [] },
};

export const RecordLookupSelect = (props) => {
  const { source, setSource, dataTableAttributes } = props;

  return h(Select, {
    isDisabled: false,
    'aria-label': 'Select an Attribute',
    isClearable: false,
    value: source.record_attribute,
    onChange: ({ value }) => {
      const newAttribute = _.get(`${value}.name`, dataTableAttributes);
      const newSource = {
        type: source.type,
        record_attribute: newAttribute,
      };
      setSource(newSource);
    },
    placeholder: source.record_attribute || 'Select Attribute',
    options: _.keys(dataTableAttributes),
    // ** https://stackoverflow.com/questions/55830799/how-to-change-zindex-in-react-select-drowpdown
    styles: { container: (old) => ({ ...old, display: 'inline-block', width: '100%' }), menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
    menuPortalTarget: document.body,
    menuPlacement: 'top',
  });
};

export const WithWarnings = (props) => {
  const { baseComponent, message } = props;

  const [iconShape, iconColor] = Utils.switchCase(
    message.type,
    ['error', () => ['error-standard', colors.warning()]],
    ['info', () => ['info-circle', colors.accent()]],
    ['success', () => ['success-standard', colors.success()]],
    ['none', () => [undefined, undefined]]
  );

  return div({ style: { display: 'flex', alignItems: 'center', width: '100%', paddingTop: '0.5rem', paddingBottom: '0.5rem' } }, [
    baseComponent,
    message.type !== 'none' &&
      h(TooltipTrigger, { content: message.message }, [
        icon(iconShape, {
          size: 14,
          style: { marginLeft: '0.5rem', color: iconColor, cursor: 'help' },
        }),
      ]),
  ]);
};

export const unwrapOptional = (input) => (input.type === 'optional' ? input.optional_type : input);

export const ParameterValueTextInput = (props) => {
  const { id, inputType, source, setSource } = props;

  const updateSourceValueToExpectedType = (value) => {
    const unwrappedType = unwrapOptional(inputType);
    if (unwrappedType.type === 'primitive' && isPrimitiveTypeInputValid(unwrappedType.primitive_type, value)) {
      const updatedValue = convertToPrimitiveType(unwrappedType.primitive_type, value);

      const newSource = {
        type: source.type,
        parameter_value: updatedValue,
      };
      setSource(newSource);
      return true;
    }
  };

  const placeholder = Utils.cond(
    [unwrapOptional(inputType).type === 'primitive' && unwrapOptional(inputType).primitive_type === 'String', () => '(Empty string)'],
    [
      unwrapOptional(inputType).type === 'array',
      () =>
        Utils.switchCase(
          unwrapOptional(unwrapOptional(inputType).array_type).primitive_type,
          ['Int', () => '[1, 2, 3]'],
          ['Float', () => '[1.5, 2.0, 5]'],
          ['String', () => '["value1", "value2", "value3"]'],
          ['Boolean', () => '[true, false, true]'],
          ['File', () => '["file1", "file2", "file3"]']
        ),
    ],
    () => '' // no placeholder for other types
  );

  return h(TextInput, {
    id,
    'aria-label': 'Enter a value',
    style: { display: 'block', width: '100%' },
    value: Array.isArray(source.parameter_value) ? JSON.stringify(source.parameter_value) : source.parameter_value,
    onChange: (value) => {
      if (!updateSourceValueToExpectedType(value)) {
        const newSource = {
          type: source.type,
          parameter_value: value,
        };
        setSource(newSource);
      }
    },
    placeholder,
  });
};

export const InputSourceSelect = (props) => {
  const { source, setSource, inputType } = props;
  const isOptional = inputType.type === 'optional';
  const unwrappedType = unwrapOptional(inputType);
  const innerInputType = unwrappedType.type;
  const isArray = innerInputType === 'array';
  const unwrappedArrayType = isArray ? unwrapOptional(unwrappedType.array_type) : undefined;
  const simpleInnerArrayType = isArray && unwrappedArrayType.type === 'primitive';
  const editorType = innerInputType === 'struct' ? 'object_builder' : 'literal';

  return h(Select, {
    isDisabled: false,
    'aria-label': 'Select an Option',
    isClearable: false,
    value: (source && _.get(source.type, inputSourceLabels)) || null,
    onChange: ({ value }) => {
      const newType = _.get(value, inputSourceTypes);
      let newSource;

      if (newType === 'none') {
        newSource = {
          type: newType,
        };
      } else {
        const paramDefault = _.get(newType, inputTypeParamDefaults);
        newSource = {
          type: newType,
          ...paramDefault,
        };
      }
      setSource(newSource);
    },
    placeholder: 'Select Source',
    options: [
      ...(!isArray || simpleInnerArrayType ? [inputSourceLabels[editorType]] : []),
      inputSourceLabels.record_lookup,
      ...(isOptional ? [inputSourceLabels.none] : []),
    ],
    // ** https://stackoverflow.com/questions/55830799/how-to-change-zindex-in-react-select-drowpdown
    styles: { container: (old) => ({ ...old, display: 'inline-block', width: '100%' }), menuPortal: (base) => ({ ...base, zIndex: 9999 }) },
    menuPortalTarget: document.body,
    menuPlacement: 'top',
  });
};

export const StructBuilderLink = (props) => {
  const { onClick, structBuilderVisible } = props;
  return h(
    Link,
    {
      display: 'block',
      width: '100%',
      onClick,
    },
    structBuilderVisible ? 'Hide Struct' : 'View Struct'
  );
};

const validateRequiredHasSource = (inputSource, inputType) => {
  if (inputType.type === 'optional') {
    return true;
  }

  if (!inputSource) {
    return { type: 'error', message: 'This attribute is required' };
  }

  if (inputSource.type === 'none') {
    return { type: 'error', message: 'This attribute is required' };
  }
  if (inputSource.type === 'object_builder') {
    const sourceFieldsFilled = _.flow(
      _.toPairs,
      _.map(([idx, _field]) => inputSource.fields[idx] || { source: { type: 'none' } })
    )(inputType.fields);

    const fieldsValidated = _.map(
      (field) => validateRequiredHasSource(field.source, field.field_type) === true,
      _.merge(sourceFieldsFilled, inputType.fields)
    );
    return _.every(Boolean, fieldsValidated) || { type: 'error', message: 'This struct is missing a required input' };
  }
  if (inputSource.type === 'literal') {
    // this condition is specifically added to allow '' and '0' and 'false' as valid values because
    // '!!inputSource.parameter_value' considers '0' and 'false' as empty values
    // Note: '!=' null check also covers if value is undefined
    if (
      inputSource.parameter_value != null &&
      (inputSource.parameter_value === 0 || inputSource.parameter_value === false || inputSource.parameter_value === '')
    ) {
      return true;
    }

    return !!inputSource.parameter_value || { type: 'error', message: 'This attribute is required' };
  }
  if (inputSource.type === 'record_lookup' && inputSource.record_attribute === '') {
    return { type: 'error', message: 'This attribute is required' };
  }
  return true;
};

const validateRecordLookup = (source, recordAttributes) => {
  if (source) {
    if (source.type === 'record_lookup' && !recordAttributes.includes(source.record_attribute)) {
      return { type: 'error', message: "This attribute doesn't exist in the data table" };
    }
    if (source.type === 'object_builder') {
      if (source.fields) {
        const fieldsValidated = _.map((field) => field && validateRecordLookup(field.source, recordAttributes) === true, source.fields);
        return _.every(Boolean, fieldsValidated) || { type: 'error', message: "One of this struct's inputs has an invalid configuration" };
      }
      return { type: 'error', message: "One of this struct's inputs has an invalid configuration" };
    }
    return true;
  }
  return true;
};

// Note: this conversion function is called only after checking that values being converted are valid.
//       Hence we don't check the validity of inputs here
export const convertToPrimitiveType = (primitiveType, value) => {
  return Utils.cond(
    [primitiveType === 'Int', () => parseInt(value)],
    [primitiveType === 'Float', () => parseFloat(value)],
    [primitiveType === 'Boolean' && typeof value !== 'boolean', () => value === 'true'],
    () => value
  );
};

export const isPrimitiveTypeInputValid = (primitiveType, value) => {
  return Utils.cond(
    // last condition ensures empty strings are not accepted as valid Int because Number(value) in second condition converts empty strings to 0
    [primitiveType === 'Int', () => !Number.isNaN(value) && Number.isInteger(Number(value)) && !Number.isNaN(parseInt(value))],
    [primitiveType === 'Float', () => !Number.isNaN(value) && !Number.isNaN(Number(value)) && !Number.isNaN(parseFloat(value))],
    [primitiveType === 'Boolean', () => value.toString().toLowerCase() === 'true' || value.toString().toLowerCase() === 'false'],
    () => true
  );
};

export const convertArrayType = ({ input_type: inputType, source: inputSource, ...input }) => {
  if (unwrapOptional(inputType).type === 'array' && inputSource.type === 'literal') {
    let value = inputSource.parameter_value;
    if (!Array.isArray(value)) {
      try {
        value = JSON.parse(inputSource.parameter_value);
      } catch (e) {
        value = [value];
      }
    }
    value = _.map((element) => convertToPrimitiveType(unwrapOptional(unwrapOptional(inputType).array_type).primitive_type, element))(value);
    return { ...input, input_type: inputType, source: { ...inputSource, parameter_value: value } };
  }
  if (unwrapOptional(inputType).type === 'struct' && inputSource.type === 'object_builder') {
    return {
      ...input,
      input_type: inputType,
      source: {
        ...inputSource,
        fields: _.map((field) => ({
          name: field.name,
          source: convertArrayType({ input_type: field.field_type, source: field.source }).source,
        }))(_.merge(inputSource.fields, unwrapOptional(inputType).fields)),
      },
    };
  }
  return { ...input, input_type: inputType, source: inputSource };
};

const validateLiteralInput = (inputSource, inputType) => {
  if (!inputSource) {
    return true;
  }

  // for user entered values and inputs that have primitive type, we validate that value matches expected type
  if (inputSource.type === 'literal') {
    if (unwrapOptional(inputType).type === 'primitive') {
      if (inputSource.parameter_value === '') {
        return unwrapOptional(inputType).primitive_type === 'String'
          ? { type: 'info', message: 'This will be sent as an empty string' }
          : { type: 'error', message: 'Value is empty' };
      }
      return (
        isPrimitiveTypeInputValid(unwrapOptional(inputType).primitive_type, inputSource.parameter_value) || {
          type: 'error',
          message: "Value doesn't match expected input type",
        }
      );
    }

    if (unwrapOptional(inputType).type === 'array') {
      let value = inputSource.parameter_value;
      if (value === '') {
        return {
          type: 'error',
          message: 'Array inputs should follow JSON array literal syntax. This input is empty. To submit an empty array, enter []',
        };
      }
      if (!Array.isArray(inputSource.parameter_value)) {
        try {
          value = JSON.parse(inputSource.parameter_value);
        } catch (e) {
          return validateLiteralInput(inputSource, unwrapOptional(inputType).array_type) === true
            ? {
                type: 'info',
                message: `Array inputs should follow JSON array literal syntax. This will be submitted as an array with one value: ${JSON.stringify(
                  inputSource.parameter_value
                )}`,
              }
            : { type: 'error', message: 'Array inputs should follow JSON array literal syntax. This input cannot be parsed' };
        }
        if (!Array.isArray(value)) {
          return {
            type: 'info',
            message: `Array inputs should follow JSON array literal syntax. This will be submitted as an array with one value: ${inputSource.parameter_value}`,
          };
        }
      }
      if (value.length === 0 && unwrapOptional(inputType).non_empty) {
        return { type: 'error', message: 'This array cannot be empty' };
      }
      return _.every(
        (arrayElement) =>
          validateLiteralInput({ ...inputSource, parameter_value: arrayElement }, unwrapOptional(unwrapOptional(inputType).array_type)) === true
      )(value)
        ? { type: 'success', message: `Successfully detected an array with ${value.length} element(s).` }
        : { type: 'error', message: 'One or more of the values in the array does not match the expected type' };
    }

    return { type: 'error', message: 'Input type does not support literal input' };
  }

  // for object_builder source type, we check that each field with user entered values and inputs that have
  // primitive type have values that match the expected input type
  if (inputSource.type === 'object_builder' && inputSource.fields) {
    const fieldsValidated = _.map(
      (field) => field && validateLiteralInput(field.source, field.field_type),
      _.merge(inputSource.fields, inputType.fields)
    );
    return _.every(Boolean, fieldsValidated) || { type: 'error', message: "One of this struct's inputs has an invalid configuration" };
  }

  return true;
};

const validateInput = (input, dataTableAttributes) => {
  const inputType = input.input_type || input.field_type;
  // first validate that required inputs have a source
  const requiredHasSource = validateRequiredHasSource(input.source, inputType);
  if (requiredHasSource !== true) {
    return requiredHasSource;
  }
  // then validate that record lookups are good (exist in table)
  const validRecordLookup = validateRecordLookup(input.source, _.keys(dataTableAttributes));
  if (validRecordLookup !== true) {
    return validRecordLookup;
  }
  // then validate that literal inputs are good (have correct type)
  const validLiteralInput = validateLiteralInput(input.source, inputType);
  if (validLiteralInput !== true) {
    return validLiteralInput;
  }
  // otherwise no errors!
  return { type: 'none' };
};

export const validateInputs = (inputDefinition, dataTableAttributes) =>
  _.flow(
    _.map((input) => {
      const inputMessage = validateInput(input, dataTableAttributes);
      return { name: input.input_name || input.field_name, ...inputMessage };
    }),
    _.compact
  )(inputDefinition);
