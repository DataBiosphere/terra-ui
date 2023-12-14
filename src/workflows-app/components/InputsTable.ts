import _ from 'lodash/fp';
import { Dispatch, SetStateAction, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { HeaderCell, SimpleFlexTable, Sortable, TextCell } from 'src/components/table';
import { RecordTypeSchema } from 'src/libs/ajax/data-table-providers/WdsDataTableProvider';
import * as Utils from 'src/libs/utils';
import {
  InputsButtonRow,
  InputSourceSelect,
  ParameterValueTextInput,
  RecordLookupSelect,
  StructBuilderLink,
  WithWarnings,
} from 'src/workflows-app/components/inputs-common';
import { StructBuilderModal } from 'src/workflows-app/components/StructBuilder';
import { InputDefinition } from 'src/workflows-app/models/submission-models';
import {
  inputTypeStyle,
  InputValidationWithName,
  isInputOptional,
  parseMethodString,
  renderTypeText,
  typeMatch,
} from 'src/workflows-app/utils/submission-utils';

type InputsTableProps = {
  selectedDataTable: RecordTypeSchema;
  configuredInputDefinition: InputDefinition[];
  setConfiguredInputDefinition: Dispatch<SetStateAction<InputDefinition[]>>;
  inputValidations: InputValidationWithName[];
};

const InputsTable = ({
  selectedDataTable,
  configuredInputDefinition,
  setConfiguredInputDefinition,
  inputValidations,
}: InputsTableProps) => {
  const [inputTableSort, setInputTableSort] = useState<{
    field: 'taskName' | 'variable';
    direction: 'asc' | 'desc';
  }>({
    field: 'taskName',
    direction: 'asc',
  });
  const [structBuilderVisible, setStructBuilderVisible] = useState(false);
  const [structBuilderRow, setStructBuilderRow] = useState<number>();
  const [includeOptionalInputs, setIncludeOptionalInputs] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const dataTableAttributes = _.keyBy('name', selectedDataTable.attributes);

  const inputTableData = _.flow(
    (rows: InputDefinition[]) =>
      rows.map((row, index) => {
        const { workflow, call, variable } = parseMethodString(row.input_name);
        return {
          taskName: call || workflow || '',
          variable: variable || '',
          inputTypeStr: renderTypeText(row.input_type),
          configurationIndex: index,
          optional: isInputOptional(row.input_type),
          ...row,
        };
      }),
    (rows) =>
      _.orderBy<(typeof rows)[number]>(
        [
          _.get('optional'),
          ({ [inputTableSort.field]: field }) => _.lowerCase(field),
          ({ taskName }) => _.lowerCase(taskName),
          ({ variable }) => _.lowerCase(variable),
        ],
        ['asc', inputTableSort.direction, 'asc', 'asc'],
        rows
      ),
    _.filter(
      _.overEvery([
        ({ optional }) => includeOptionalInputs || !optional,
        ({ taskName, variable }) =>
          _.lowerCase(taskName).includes(_.lowerCase(searchFilter)) ||
          _.lowerCase(variable).includes(_.lowerCase(searchFilter)),
      ])
    )
  )(configuredInputDefinition);

  const inputRowsInDataTable = inputTableData.filter(
    (row) =>
      _.has(row.variable, dataTableAttributes) &&
      row.source.type === 'none' &&
      typeMatch(row.input_type, _.get(`${row.variable}.datatype`, dataTableAttributes))
  );

  const recordLookup = (rowIndex: number) => {
    const type = _.get(`${inputTableData[rowIndex].configurationIndex}.input_type`, configuredInputDefinition);
    const source = _.get(`${inputTableData[rowIndex].configurationIndex}.source`, configuredInputDefinition);
    const setSource = (source) => {
      setConfiguredInputDefinition(
        _.set(`${inputTableData[rowIndex].configurationIndex}.source`, source, configuredInputDefinition)
      );
    };

    return h(RecordLookupSelect, {
      source,
      setSource,
      dataTableAttributes: _.pickBy((wdsType) => typeMatch(type, wdsType.datatype), dataTableAttributes),
    });
  };

  const parameterValueSelect = (rowIndex: number) => {
    return h(ParameterValueTextInput, {
      id: `input-table-value-select-${rowIndex}`,
      inputType: _.get('input_type', inputTableData[rowIndex]),
      source: _.get(`${inputTableData[rowIndex].configurationIndex}.source`, configuredInputDefinition),
      setSource: (source) => {
        setConfiguredInputDefinition(
          _.set(`${inputTableData[rowIndex].configurationIndex}.source`, source, configuredInputDefinition)
        );
      },
    });
  };

  const structBuilderLink = (rowIndex: number) => {
    return h(StructBuilderLink, {
      structBuilderVisible,
      onClick: () => {
        setStructBuilderVisible(true);
        setStructBuilderRow(rowIndex);
      },
    });
  };

  const sourceNone = (rowIndex: number) => {
    return h(
      TextCell,
      { style: inputTypeStyle(inputTableData[rowIndex].input_type) },
      Utils.cond(
        [
          inputRowsInDataTable.some((input) => input.variable === inputTableData[rowIndex].variable),
          () => [
            'Autofill ',
            h(
              Link,
              {
                style: {
                  textDecoration: 'underline',
                },
                onClick: () => {
                  setConfiguredInputDefinition(
                    _.set(
                      `[${inputTableData[rowIndex].configurationIndex}].source`,
                      { type: 'record_lookup', record_attribute: inputTableData[rowIndex].variable },
                      configuredInputDefinition
                    )
                  );
                },
              },
              [inputTableData[rowIndex].variable]
            ),
            ' from data table',
          ],
        ],
        () => [inputTableData[rowIndex].optional ? 'Optional' : 'This input is required']
      )
    );
  };

  return div({ style: { flex: '1 0 auto' } }, [
    h(InputsButtonRow, {
      optionalButtonProps: {
        includeOptionalInputs,
        setIncludeOptionalInputs,
      },
      setFromDataTableButtonProps: {
        inputRowsInDataTable,
        setConfiguredInputDefinition,
      },
      searchProps: {
        searchFilter,
        setSearchFilter,
      },
    }),
    structBuilderVisible &&
      structBuilderRow !== undefined &&
      h(StructBuilderModal, {
        structName: _.get('variable', inputTableData[structBuilderRow]),
        structType: _.get('input_type', inputTableData[structBuilderRow]),
        structSource: _.get('source', inputTableData[structBuilderRow]),
        setStructSource: (source) =>
          setConfiguredInputDefinition(
            _.set(`${inputTableData[structBuilderRow].configurationIndex}.source`, source, configuredInputDefinition)
          ),
        dataTableAttributes,
        onDismiss: () => {
          setStructBuilderVisible(false);
        },
      }),
    h(SimpleFlexTable, {
      'aria-label': 'input-table',
      rowCount: inputTableData.length,
      // @ts-ignore
      sort: inputTableSort,
      readOnly: false,
      columns: [
        {
          size: { basis: 250, grow: 0 },
          field: 'taskName',
          headerRenderer: () =>
            h(Sortable, { sort: inputTableSort, field: 'taskName', onSort: setInputTableSort }, [
              h(HeaderCell, ['Task name']),
            ]),
          cellRenderer: ({ rowIndex }) => {
            return h(TextCell, { style: { fontWeight: 500 } }, [inputTableData[rowIndex].taskName]);
          },
        },
        {
          size: { basis: 360, grow: 0 },
          field: 'variable',
          headerRenderer: () =>
            h(Sortable, { sort: inputTableSort, field: 'variable', onSort: setInputTableSort }, [
              h(HeaderCell, ['Variable']),
            ]),
          cellRenderer: ({ rowIndex }) => {
            return h(TextCell, { style: inputTypeStyle(inputTableData[rowIndex].input_type) }, [
              inputTableData[rowIndex].variable,
            ]);
          },
        },
        {
          size: { basis: 160, grow: 0 },
          field: 'inputTypeStr',
          headerRenderer: () => h(HeaderCell, ['Type']),
          cellRenderer: ({ rowIndex }) => {
            return h(TextCell, { style: inputTypeStyle(inputTableData[rowIndex].input_type) }, [
              inputTableData[rowIndex].inputTypeStr,
            ]);
          },
        },
        {
          size: { basis: 300, grow: 0 },
          headerRenderer: () => h(HeaderCell, ['Input sources']),
          cellRenderer: ({ rowIndex }) => {
            return InputSourceSelect({
              source: _.get('source', inputTableData[rowIndex]),
              inputType: _.get('input_type', inputTableData[rowIndex]),
              setSource: (source) =>
                setConfiguredInputDefinition(
                  _.set(`[${inputTableData[rowIndex].configurationIndex}].source`, source, configuredInputDefinition)
                ),
            });
          },
        },
        {
          size: { basis: 300, grow: 1 },
          headerRenderer: () => h(HeaderCell, ['Attribute']),
          cellRenderer: ({ rowIndex }) => {
            const source = _.get(`${rowIndex}.source`, inputTableData);
            const inputName = _.get(`${rowIndex}.input_name`, inputTableData);
            return h(WithWarnings, {
              baseComponent: Utils.switchCase(
                source.type || 'none',
                ['record_lookup', () => recordLookup(rowIndex)],
                ['literal', () => parameterValueSelect(rowIndex)],
                ['object_builder', () => structBuilderLink(rowIndex)],
                ['none', () => sourceNone(rowIndex)]
              ),
              message: inputValidations.find((message) => message.name === inputName),
            });
          },
        },
      ],
    }),
  ]);
};

export default InputsTable;
