import * as _ from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { Samples } from 'src/libs/ajax/Catalog';
import { FormLabel } from 'src/libs/forms';
import { ListInput, StringInput } from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs';

export interface SamplesInputProps {
  title?: string;
  samples: Samples;
  onChange: (samples: Samples) => void;
}

export const SamplesInput = ({ title, samples, onChange }: SamplesInputProps) => {
  // This gets its own because the properties are lists
  const generateIndividualInputProps = (title, field) => ({
    title,
    list: samples[field] ? samples[field] : [],
    listItemTitles: false,
    blankValue: '',
    renderer: (listItem, onChange) =>
      h(StringInput, {
        onChange,
        value: listItem,
        wrapperProps: { style: { width: '80%' } },
        placeholder: `Enter ${field}`,
      }),
    onChange: (value, index) => onChange(_.set(`${field}.[${index}]`, value, samples)),
    onRemove: (value) => onChange(_.set(field, _.xor([value], samples[field]), samples) as Samples),
  });
  return div([
    title && h(FormLabel, [title]),
    div({ style: { display: 'flex', width: '100%' } }, [
      h(ListInput, generateIndividualInputProps('Diseases', 'disease')),
      h(ListInput, generateIndividualInputProps('Species', 'species')),
    ]),
  ]);
};
