import ReactJson from '@microlink/react-json-view';
import { Switch } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { NumberInput, TextInput } from 'src/components/input';
import * as Utils from 'src/libs/utils';

export const renderInputForAttributeType = _.curry((attributeType, props) => {
  return Utils.switchCase(
    attributeType,
    [
      'string',
      () => {
        const { value = '', ...otherProps } = props;
        return h(TextInput, {
          autoFocus: true,
          placeholder: 'Enter a value',
          value,
          ...otherProps,
        });
      },
    ],
    [
      'reference',
      () => {
        const { value, onChange, ...otherProps } = props;
        return h(TextInput, {
          autoFocus: true,
          placeholder: `Enter a ${value.entityType}_id`,
          value: value.entityName,
          onChange: (v) => onChange({ ...value, entityName: v }),
          ...otherProps,
        });
      },
    ],
    [
      'number',
      () => {
        const { value = 0, ...otherProps } = props;
        return h(NumberInput, { autoFocus: true, isClearable: false, value, ...otherProps });
      },
    ],
    [
      'boolean',
      () => {
        const { value = false, ...otherProps } = props;
        return div({ style: { flexGrow: 1, display: 'flex', alignItems: 'center', height: '2.25rem' } }, [
          h(Switch, { checked: value, ...otherProps }),
        ]);
      },
    ],
    [
      'json',
      () => {
        const { value, onChange, ...otherProps } = props;
        return h(ReactJson, {
          ...otherProps,
          style: { ...otherProps.style, whiteSpace: 'pre-wrap' },
          src: value,
          displayObjectSize: false,
          displayDataTypes: false,
          enableClipboard: false,
          name: false,
          onAdd: _.flow(_.get('updated_src'), onChange),
          onDelete: _.flow(_.get('updated_src'), onChange),
          onEdit: _.flow(_.get('updated_src'), onChange),
        });
      },
    ],
    [
      'array',
      () => {
        const { value, onChange, ...otherProps } = props;
        return h(ReactJson, {
          ...otherProps,
          style: { ...otherProps.style, whiteSpace: 'pre-wrap' },
          src: value,
          displayObjectSize: false,
          displayDataTypes: false,
          enableClipboard: false,
          displayArrayKey: false,
          name: false,
          onAdd: _.flow(_.get('updated_src'), onChange),
          onDelete: _.flow(_.get('updated_src'), onChange),
          onEdit: _.flow(_.get('updated_src'), onChange),
        });
      },
    ]
  );
});
