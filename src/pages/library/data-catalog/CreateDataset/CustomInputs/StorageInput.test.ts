import { render, screen } from '@testing-library/react'
import { h } from 'react-hyperscript-helpers'
import { StorageInput } from 'src/pages/library/data-catalog/CreateDataset/CustomInputs/StorageInput'


describe('StorageInput', () => {
  it('Renders a StorageInput with all fields', () => {
    render(h(StorageInput, {
      storageObject: {
        region: 'southamerica-west1',
        cloudPlatform: 'gcp',
        cloudResource: 'bigquery'
      },
      onChange: () => {}
    }))
    expect(screen.getByLabelText('Cloud Platform').closest('input')?.value).toBe('gcp')
    expect(screen.getByLabelText('Cloud Resource').closest('input')?.value).toBe('bigquery')
    expect(screen.getByLabelText('Region').closest('input')?.value).toBe('southamerica-west1')
  })
})
