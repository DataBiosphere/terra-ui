import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { Link, Select } from 'src/components/common';
import { icon } from 'src/components/icons';
import { DelayedSearchInput, TextInput } from 'src/components/input';
import { InfoBox } from 'src/components/PopupTrigger';
import TooltipTrigger from 'src/components/TooltipTrigger';
import colors from 'src/libs/colors';
import * as Utils from 'src/libs/utils';
import {
  convertToPrimitiveType,
  inputSourceLabels,
  inputSourceTypes,
  inputTypeParamDefaults,
  isPrimitiveTypeInputValid,
  unwrapOptional,
} from 'src/workflows-app/utils/submission-utils';

const inputButtonRowStyle = {
  height: '2.5rem',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
};

export const InputsButtonRow = ({
  optionalButtonProps: { includeOptionalInputs, setIncludeOptionalInputs },
  setFromDataTableButtonProps: { inputRowsInDataTable, setConfiguredInputDefinition } = {},
  searchProps: { searchFilter, setSearchFilter },
  ...props
}) => {
  return h(div, { style: inputButtonRowStyle, ...props }, [
    h(
      Link,
      {
        style: { marginRight: 'auto' },
        onClick: () => setIncludeOptionalInputs((includeOptionalInputs) => !includeOptionalInputs),
      },
      [includeOptionalInputs ? 'Hide optional inputs' : 'Show optional inputs']
    ),
    inputRowsInDataTable &&
      div({}, [
        h(
          Link,
          {
            style: { marginLeft: 'auto', marginRight: '0.5rem' },
            onClick: () =>
              setConfiguredInputDefinition(
                _.reduce(
                  (defSoFar, row) => _.set(`[${row.configurationIndex}].source`, { type: 'record_lookup', record_attribute: row.variable }, defSoFar),
                  _,
                  inputRowsInDataTable
                )
              ),
          },
          [`Autofill (${inputRowsInDataTable.length}) from data table`]
        ),
        h(
          InfoBox,
          {
            side: 'top',
          },
          [
            div({ style: { maxHeight: 105, overflow: 'auto' } }, [
              `Inputs that can be auto-filled:\n${_.flow(
                _.map((row) => `${row.taskName}.${row.variable}`),
                _.join('\n')
              )(inputRowsInDataTable)}`,
            ]),
          ]
        ),
      ]),
    h(DelayedSearchInput, {
      style: { marginLeft: '1rem', width: 200 },
      value: searchFilter,
      onChange: setSearchFilter,
      'aria-label': 'Search inputs',
      placeholder: 'SEARCH INPUTS',
    }),
  ]);
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
