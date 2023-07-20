import _ from 'lodash/fp';
import { div } from 'react-hyperscript-helpers';
import { icon } from 'src/components/icons';
import { statusType as jobStatusType } from 'src/components/job-common';
import { Ajax } from 'src/libs/ajax';
import colors from 'src/libs/colors';
import { notify } from 'src/libs/notifications';
import { differenceFromDatesInSeconds, differenceFromNowInSeconds } from 'src/libs/utils';
import * as Utils from 'src/libs/utils';

export const AutoRefreshInterval = 1000 * 60; // 1 minute
export const WdsPollInterval = 1000 * 30; // 30 seconds
export const CbasPollInterval = 1000 * 30; // 30 seconds

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

export const parseMethodString = (methodString) => {
  const methodNameParts = methodString.split('.');
  return {
    workflow: methodNameParts[0],
    call: methodNameParts.length === 3 ? methodNameParts[1] : '',
    variable: methodNameParts[methodNameParts.length - 1],
  };
};

export const parseAttributeName = (attributeName) => {
  const namespaceDelimiterIndex = _.lastIndexOf(':', attributeName);
  const columnName = attributeName.slice(namespaceDelimiterIndex + 1);
  const columnNamespace = attributeName.slice(0, namespaceDelimiterIndex + 1);
  return { columnNamespace, columnName };
};

export const inputSourceLabels = {
  literal: 'Type a Value',
  record_lookup: 'Fetch from Data Table',
  object_builder: 'Use Struct Builder',
  none: 'None',
};

export const inputSourceTypes = _.invert(inputSourceLabels);

export const inputTypeParamDefaults = {
  literal: { parameter_value: '' },
  record_lookup: { record_attribute: '' },
  object_builder: { fields: [] },
};

export const isInputOptional = (ioType) => _.get('type', ioType) === 'optional';

export const inputTypeStyle = (iotype) => {
  if (isInputOptional(iotype)) {
    return { fontStyle: 'italic' };
  }
  return {};
};

export const renderTypeText = (iotype) => {
  if (_.has('primitive_type', iotype)) {
    return iotype.primitive_type;
  }
  if (_.has('optional_type', iotype)) {
    return `${renderTypeText(_.get('optional_type', iotype))}`;
  }
  if (_.has('array_type', iotype)) {
    return `Array[${renderTypeText(_.get('array_type', iotype))}]`;
  }
  if (_.get('type', iotype) === 'map') {
    return `Map[${_.get('key_type', iotype)}, ${renderTypeText(_.get('value_type', iotype))}]`;
  }
  if (_.get('type', iotype) === 'struct') {
    return 'Struct';
  }
  return 'Unsupported Type';
};

export const unwrapOptional = (input) => (input.type === 'optional' ? input.optional_type : input);

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

export const typeMatch = (cbasType, wdsType) => {
  const unwrappedCbasType = unwrapOptional(cbasType);
  if (unwrappedCbasType.type === 'primitive') {
    return Utils.switchCase(
      unwrappedCbasType.primitive_type,
      ['Int', () => wdsType === 'NUMBER'],
      ['Float', () => wdsType === 'NUMBER'],
      ['Boolean', () => wdsType === 'BOOLEAN'],
      ['File', () => wdsType === 'FILE' || wdsType === 'STRING'],
      [Utils.DEFAULT, () => true]
    );
  }
  if (unwrappedCbasType.type === 'array') {
    return _.startsWith('ARRAY_OF_')(wdsType) && typeMatch(unwrappedCbasType.array_type, _.replace('ARRAY_OF_', '')(wdsType));
  }
  if (unwrappedCbasType.type === 'struct') {
    return wdsType === 'JSON';
  }
  return true;
};

const validateRecordLookup = (inputSource, inputType, recordAttributes) => {
  if (!inputSource) {
    return true;
  }
  if (inputSource.type === 'record_lookup') {
    if (!_.has(inputSource.record_attribute)(recordAttributes)) {
      return { type: 'error', message: "This attribute doesn't exist in the data table" };
    }
    if (!typeMatch(inputType, _.get(`${inputSource.record_attribute}.datatype`)(recordAttributes))) {
      return { type: 'error', message: 'Provided type does not match expected type' };
    }
    return true;
  }
  if (inputSource.type === 'object_builder') {
    if (inputSource.fields) {
      const fieldsValidated = _.map(
        (field) => field && validateRecordLookup(field.source, field.field_type, recordAttributes) === true,
        _.merge(inputType.fields, inputSource.fields)
      );
      return _.every(Boolean, fieldsValidated) || { type: 'error', message: "One of this struct's inputs has an invalid configuration" };
    }
    return { type: 'error', message: "One of this struct's inputs has an invalid configuration" };
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

const validatePrimitiveLiteral = (inputSource, inputType) => {
  if (inputSource.parameter_value === '' && inputType.primitive_type === 'String') {
    return { type: 'info', message: 'This will be sent as an empty string' };
  }
  if (inputSource.parameter_value === '') {
    return { type: 'error', message: 'Value is empty' };
  }
  return (
    isPrimitiveTypeInputValid(inputType.primitive_type, inputSource.parameter_value) || {
      type: 'error',
      message: "Value doesn't match expected input type",
    }
  );
};

const validateArrayLiteral = (inputSource, inputType) => {
  let value = inputSource.parameter_value;
  if (value === '') {
    return {
      type: 'error',
      message: 'Array inputs should follow JSON array literal syntax. This input is empty. To submit an empty array, enter []',
    };
  }
  const singletonValidation =
    validateLiteralInput(inputSource, inputType.array_type) === true
      ? {
          type: 'info',
          message: `Array inputs should follow JSON array literal syntax. This will be submitted as an array with one value: ${JSON.stringify(
            inputSource.parameter_value
          )}`,
        }
      : { type: 'error', message: 'Array inputs should follow JSON array literal syntax. This input cannot be parsed' };

  try {
    if (!Array.isArray(inputSource.parameter_value)) {
      value = JSON.parse(inputSource.parameter_value);
    }
  } catch (e) {
    return singletonValidation;
  }
  if (!Array.isArray(value)) {
    return {
      type: 'info',
      message: `Array inputs should follow JSON array literal syntax. This will be submitted as an array with one value: ${inputSource.parameter_value}`,
    };
  }
  if (value.length === 0 && inputType.non_empty) {
    return { type: 'error', message: 'This array cannot be empty' };
  }
  return _.every(
    (arrayElement) => validateLiteralInput({ ...inputSource, parameter_value: arrayElement }, unwrapOptional(inputType.array_type)) === true
  )(value)
    ? { type: 'success', message: `Successfully detected an array with ${value.length} element(s).` }
    : { type: 'error', message: 'One or more of the values in the array does not match the expected type' };
};

const validateLiteralInput = (inputSource, inputType) => {
  if (!inputSource) {
    return true;
  }

  const unwrappedInputType = unwrapOptional(inputType);

  // for user entered values and inputs that have primitive type, we validate that value matches expected type
  if (inputSource.type === 'literal' && unwrappedInputType.type === 'primitive') {
    return validatePrimitiveLiteral(inputSource, unwrappedInputType);
  }

  if (inputSource.type === 'literal' && unwrappedInputType.type === 'array') {
    return validateArrayLiteral(inputSource, unwrappedInputType);
  }

  if (inputSource.type === 'literal') {
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
  const validRecordLookup = validateRecordLookup(input.source, inputType, dataTableAttributes);
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
