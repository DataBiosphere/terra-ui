import * as _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import {
  azureCloudRegionTypes,
  azureCloudResourceTypes,
  googleCloudRegionTypes,
  googleCloudResourceTypes
} from 'src/libs/ajax/Catalog'
import * as Utils from 'src/libs/utils'
import { SelectInput } from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs'


export const StorageInput = ({ wrapperProps, storageObject, onChange }) => {
  const inputWrapperProps = {
    style: { width: `${100 / 3}%` }
  }
  // This gets its own method because it is select inputs
  const generateSelectInputProps = (title, key, azureTypes, gcpTypes) => {
    return {
      title,
      wrapperProps: inputWrapperProps,
      value: storageObject[key],
      options: Utils.switchCase(storageObject.cloudPlatform,
        ['gcp', () => _.values(gcpTypes)],
        ['azure', () => _.values(azureTypes)],
        [Utils.DEFAULT, () => []]
      ),
      onChange: option => onChange(_.set(key, option.value, storageObject))
    }
  }

  return div(wrapperProps, [
    div({ style: { display: 'flex', width: '100%' } }, [
      h(SelectInput, {
        title: 'Cloud Platform',
        wrapperProps: inputWrapperProps,
        value: storageObject.cloudPlatform,
        options: ['gcp', 'azure'],
        onChange: option => onChange({ cloudPlatform: option.value })
      }),
      h(SelectInput, generateSelectInputProps('Cloud Resource', 'cloudResource', azureCloudResourceTypes, googleCloudResourceTypes)),
      h(SelectInput, generateSelectInputProps('Region', 'region', azureCloudRegionTypes, googleCloudRegionTypes))
    ])
  ])
}
