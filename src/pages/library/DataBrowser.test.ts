import {
  convertColsToSettings,
  convertSettingsToCols
} from 'src/pages/library/DataBrowser'


const settings = [{ name: 'Consortiums', key: 'consortiums', visible: true },
  { name: 'Species', key: 'species', visible: false }]
const cols = ['consortiums']

describe('DataBrowser', () => {
  it('converts selected columns to settings', () => {
    // Avoid copying entire list of columns into this test by checking for a subset of elements.
    expect(convertColsToSettings(cols)).toEqual(expect.arrayContaining(settings))
  })

  it('converts settings to selected columns', () => {
    expect(convertSettingsToCols(settings)).toMatchObject(cols)
  })
})
