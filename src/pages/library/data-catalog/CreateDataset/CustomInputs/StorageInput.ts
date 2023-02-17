import * as _ from 'lodash/fp'
import { div, h } from 'react-hyperscript-helpers'
import {
  azureCloudRegionTypes,
  azureCloudResourceTypes,
  googleCloudRegionTypes,
  googleCloudResourceTypes,
  StorageObject
} from 'src/libs/ajax/Catalog'
import { SelectInput, SelectInputProps } from 'src/pages/library/data-catalog/CreateDataset/CreateDatasetInputs'


interface StorageInputProps {
  wrapperProps?: any
  storageObject: StorageObject
  onChange: (storageObject: StorageObject) => void
}

export const StorageInput = ({ wrapperProps, storageObject, onChange }: StorageInputProps) => {
  const inputWrapperProps = {
    style: { width: `${100 / 3}%` }
  }

  // This gets its own method because it is select inputs
  const generateSelectInputProps = (title, key, azureTypes, gcpTypes): SelectInputProps => {
    return {
      title,
      wrapperProps: inputWrapperProps,
      value: storageObject[key],
      options: (() => {
        switch (storageObject.cloudPlatform) {
          case 'gcp': return _.values(gcpTypes)
          case 'azure': return _.values(azureTypes)
          default: return []
        }
      })(),
      onChange: option => onChange(_.set(key, option.value, storageObject) as StorageObject)
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
