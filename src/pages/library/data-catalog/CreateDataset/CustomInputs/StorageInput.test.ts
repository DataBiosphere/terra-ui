import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { h } from 'react-hyperscript-helpers'
import { StorageInput } from 'src/pages/library/data-catalog/CreateDataset/CustomInputs/StorageInput'

// For some reason this seemed to want to import files from
// this file. For some reason fetchBuckets errors here, but
// we are not doing any special testing here of that method
jest.mock('src/libs/ajax/GoogleStorage.ts')

const StorageInputWithState = ({ initialValue, props }) => {
  const [value, setValue] = useState(initialValue)

  return h(StorageInput, {
    ...props,
    storageObject: value,
    onChange: value => setValue(value)
  })
}

describe('StorageInput', () => {
  it('Renders a StorageInput with all fields', async () => {
    render(h(StorageInput, {
      storageObject: {
        region: 'southamerica-west1',
        cloudPlatform: 'gcp',
        cloudResource: 'bigquery'
      },
      onChange: () => {}
    }))
    expect(screen.getByText('Cloud Platform')).toBeTruthy()
    expect(await screen.findByText('gcp')).toBeTruthy()
    expect(screen.getByText('Cloud Resource')).toBeTruthy()
    expect(await screen.findByText('bigquery')).toBeTruthy()
    expect(screen.getByText('Region')).toBeTruthy()
    expect(await screen.findByText('southamerica-west1')).toBeTruthy()
  })
  it('Clears storage input on cloud platform change', async () => {
    const user = userEvent.setup()

    render(h(StorageInputWithState, {
      initialValue: {
        region: 'southamerica-west1',
        cloudPlatform: 'gcp',
        cloudResource: 'bigquery'
      },
      props: {}
    }))
    const select = screen.getByLabelText('Cloud Platform')
    await user.click(select)
    const azureValueOption = await screen.findAllByText('azure')
    await user.click(azureValueOption[0])
    expect(await screen.queryByText('bigquery')).toBeFalsy()
    expect(await screen.queryByText('southamerica-west1')).toBeFalsy()
  })
})
