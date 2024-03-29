import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Link } from 'src/components/common';
import { TextInput } from 'src/components/input';
import { HeaderCell, SimpleFlexTable, Sortable, TextCell } from 'src/components/table';
import { WorkflowTableColumnNames } from 'src/libs/workflow-utils';
import { WithWarnings } from 'src/workflows-app/components/inputs-common';
import { getOutputTableData } from 'src/workflows-app/utils/submission-utils';

const OutputsTable = (props) => {
  const { configuredOutputDefinition, setConfiguredOutputDefinition } = props;

  const [outputTableSort, setOutputTableSort] = useState({ field: '', direction: 'asc' });

  const outputTableData = getOutputTableData(configuredOutputDefinition, outputTableSort);

  const clearOutputs = () => {
    setConfiguredOutputDefinition(_.map((output) => _.set('destination', { type: 'none' })(output))(configuredOutputDefinition));
  };

  const nonDefaultOutputs = _.filter(
    (output) =>
      output.destination.type === 'none' ||
      (output.destination.type === 'record_update' && output.destination.record_attribute !== _.last(output.output_name.split('.')))
  )(configuredOutputDefinition);
  const setDefaultOutputs = () => {
    setConfiguredOutputDefinition(
      _.map((output) => _.set('destination', { type: 'record_update', record_attribute: _.last(output.output_name.split('.')) })(output))(
        configuredOutputDefinition
      )
    );
  };

  return div({ style: { flex: '1 0 auto' } }, [
    h(SimpleFlexTable, {
      'aria-label': 'output-table',
      rowCount: outputTableData.length,
      sort: outputTableSort,
      readOnly: false,
      columns: [
        {
          size: { basis: 250, grow: 0 },
          field: 'taskName',
          headerRenderer: () => h(Sortable, { sort: outputTableSort, field: 'taskName', onSort: setOutputTableSort }, [h(HeaderCell, ['Task name'])]),
          cellRenderer: ({ rowIndex }) => {
            return h(TextCell, { style: { fontWeight: 500 } }, [outputTableData[rowIndex].taskName]);
          },
        },
        {
          size: { basis: 360, grow: 0 },
          field: 'variable',
          headerRenderer: () => h(Sortable, { sort: outputTableSort, field: 'variable', onSort: setOutputTableSort }, [h(HeaderCell, ['Variable'])]),
          cellRenderer: ({ rowIndex }) => {
            return h(TextCell, {}, [outputTableData[rowIndex].variable]);
          },
        },
        {
          size: { basis: 160, grow: 0 },
          field: 'outputTypeStr',
          headerRenderer: () => h(HeaderCell, ['Type']),
          cellRenderer: ({ rowIndex }) => {
            return h(TextCell, {}, [outputTableData[rowIndex].outputTypeStr]);
          },
        },
        {
          headerRenderer: () =>
            div({ style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flex: '1 1 auto' } }, [
              h(HeaderCell, { style: { overflow: 'visible' } }, [WorkflowTableColumnNames.OUTPUT_NAME]),
              h(Fragment, [
                div({ style: { whiteSpace: 'pre' } }, ['  |  ']),
                h(Link, { style: { minWidth: 'fit-content' }, onClick: clearOutputs }, ['Clear outputs']),
                div({ style: { whiteSpace: 'pre' } }, ['  |  ']),
                WithWarnings({
                  baseComponent: h(Link, { onClick: setDefaultOutputs }, [`Autofill (${nonDefaultOutputs.length}) outputs`]),
                  message: _.some((output) => output.destination.type === 'record_update')(nonDefaultOutputs)
                    ? { type: 'error', message: 'This will overwrite existing output names' }
                    : { type: 'none' },
                }),
              ]),
            ]),
          cellRenderer: ({ rowIndex }) => {
            const outputValue = (configurationIndex) => {
              const destType = _.get('destination.type', configuredOutputDefinition[configurationIndex]);
              if (destType === 'record_update') {
                return _.get('destination.record_attribute', configuredOutputDefinition[configurationIndex]);
              }
              return '';
            };

            return h(TextInput, {
              id: `output-parameter-${rowIndex}`,
              style: { display: 'block', width: '100%' },
              value: outputValue(outputTableData[rowIndex].configurationIndex),
              placeholder: '[Enter an attribute name to save this output to your data table]',
              onChange: (value) => {
                const configurationIndex = outputTableData[rowIndex].configurationIndex;
                if (!!value && value !== '') {
                  setConfiguredOutputDefinition(
                    _.set(`${configurationIndex}.destination`, { type: 'record_update', record_attribute: value }, configuredOutputDefinition)
                  );
                } else {
                  setConfiguredOutputDefinition(_.set(`${configurationIndex}.destination`, { type: 'none' }, configuredOutputDefinition));
                }
              },
            });
          },
        },
      ],
    }),
  ]);
};

export default OutputsTable;
