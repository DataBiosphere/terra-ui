import { extractBillingDetails } from 'src/libs/events'


describe('extractBillingDetails', () => {
  it('Extracts billing project name and cloudPlatform (as upper case)', () => {
    expect(extractBillingDetails({ projectName: 'projectName', cloudPlatform: 'cloudPlatform' })).toEqual(
      { billingProjectName: 'projectName', cloudPlatform: 'CLOUDPLATFORM' }
    )
  })
})
