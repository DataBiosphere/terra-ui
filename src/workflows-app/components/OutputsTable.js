import _ from 'lodash/fp';
import { Fragment, useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { AutoSizer } from 'react-virtualized';
import { Link } from 'src/components/common';
import { TextInput } from 'src/components/input';
import { FlexTable, HeaderCell, Sortable, TextCell } from 'src/components/table';
import { WithWarnings } from 'src/workflows-app/components/inputs-common';
import { parseMethodString, renderTypeText } from 'src/workflows-app/utils/submission-utils';

const OutputsTable = (props) => {
  const { configuredOutputDefinition, setConfiguredOutputDefinition } = props;

  const [outputTableSort, setOutputTableSort] = useState({ field: '', direction: 'asc' });

  const outputTableData = _.flow(
    _.entries,
    _.map(([index, row]) => {
      const { workflow, call, variable } = parseMethodString(row.output_name);
      return _.flow([
        _.set('taskName', call || workflow || ''),
        _.set('variable', variable || ''),
        _.set('outputTypeStr', renderTypeText(row.output_type)),
        _.set('configurationIndex', parseInt(index)),
      ])(row);
    }),
    _.orderBy([({ [outputTableSort.field]: field }) => _.lowerCase(field)], [outputTableSort.direction])
  )(configuredOutputDefinition);

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

  return h(AutoSizer, [
    ({ width, height }) => {
      return h(FlexTable, {
        'aria-label': 'output-table',
        rowCount: outputTableData.length,
        sort: outputTableSort,
        readOnly: false,
        height,
        width,
        columns: [
          {
            size: { basis: 250, grow: 0 },
            field: 'taskName',
            headerRenderer: () =>
              h(Sortable, { sort: outputTableSort, field: 'taskName', onSort: setOutputTableSort }, [h(HeaderCell, ['Task name'])]),
            cellRenderer: ({ rowIndex }) => {
              return h(TextCell, { style: { fontWeight: 500 } }, [outputTableData[rowIndex].taskName]);
            },
          },
          {
            size: { basis: 360, grow: 0 },
            field: 'variable',
            headerRenderer: () =>
              h(Sortable, { sort: outputTableSort, field: 'variable', onSort: setOutputTableSort }, [h(HeaderCell, ['Variable'])]),
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
              h(Fragment, [
                h(HeaderCell, { style: { overflow: 'visible' } }, ['Attribute']),
                h(Fragment, [
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
      });
    },
  ]);
};

export default OutputsTable;
