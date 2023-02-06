import * as _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import { FormLabel } from 'src/libs/forms'
import { ListInput, StringInput } from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs'


export const SamplesInput = ({ title, samples, onChange }) => {
  // This gets its own because the properties are lists
  const generateIndividualInputProps = (title, inputKey) => ({
    title,
    list: samples[inputKey] ? samples[inputKey] : [],
    listItemTitles: false,
    blankValue: '',
    renderer: (listItem, key, onChange) => h(StringInput, {
      onChange,
      value: listItem,
      wrapperProps: {
        style: { width: '80%' },
        key
      },
      placeholder: `Enter ${inputKey}`
    }),
    onChange: (value, index) => onChange(_.set(`${inputKey}.[${index}]`, value, samples)),
    onRemove: value => onChange(_.set(inputKey, _.xor([value], samples[inputKey]), samples))
  })
  return div([
    title && h(FormLabel, [title]),
    div({ style: { display: 'flex', width: '100%' } }, [
      h(ListInput, generateIndividualInputProps('Diseases', 'disease')),
      h(ListInput, generateIndividualInputProps('Species', 'species'))
    ])
  ])
}
