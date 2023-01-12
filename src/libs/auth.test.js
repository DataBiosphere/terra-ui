import { parseToSDetails } from 'src/libs/auth'


const tosDetailsDefault = {
  currentVersion: '1',
  isEnabled: true,
  isGracePeriodEnabled: true,
  userAcceptedVersion: '1'
}

const parsedTosDetailsDefault = {
  isGracePeriodEnabled: true,
  currentVersion: '1',
  userAcceptedVersion: '1',
  userAcceptedTos: true,
  userNeedsToAcceptTos: false
}

describe('Terms of Service Detail Parser gives access', () => {
  it('gives access to users that have accepted the most recent ToS version', () => {
    expect(parseToSDetails(tosDetailsDefault)).toEqual(parsedTosDetailsDefault)
  })

  it('gives access to users who have accepted the prior version when the grace period is enabled', () => {
    const tosDetails = {
      ...tosDetailsDefault,
      currentVersion: '1',
      userAcceptedVersion: '0'
    }

    expect(parseToSDetails(tosDetails)).toEqual({
      isGracePeriodEnabled: true,
      currentVersion: '1',
      userAcceptedVersion: '0',
      userAcceptedTos: true,
      userNeedsToAcceptTos: true
    })
  })

  it('gives access to users who have accepted a much older version than the prior version when the grace period is enabled', () => {
    const tosDetails = {
      ...tosDetailsDefault,
      currentVersion: '9',
      userAcceptedVersion: '0'
    }

    expect(parseToSDetails(tosDetails)).toEqual({
      isGracePeriodEnabled: true,
      currentVersion: '9',
      userAcceptedVersion: '0',
      userAcceptedTos: true,
      userNeedsToAcceptTos: true
    })
  })

  it('does not give access when the user has not accepted the latest ToS version and the grace period is disabled', () => {
    const tosDetails = {
      ...tosDetailsDefault,
      currentVersion: '1',
      userAcceptedVersion: '0',
      isGracePeriodEnabled: false
    }

    expect(parseToSDetails(tosDetails)).toEqual({
      isGracePeriodEnabled: false,
      currentVersion: '1',
      userAcceptedVersion: '0',
      userAcceptedTos: false,
      userNeedsToAcceptTos: true
    })
  })

  it('does not give access when the user has never accepted any version of the ToS', () => {
    const tosDetails = {
      ...tosDetailsDefault,
      userAcceptedVersion: undefined
    }

    const expectedResult = {
      isGracePeriodEnabled: true,
      currentVersion: '1',
      userAcceptedVersion: undefined,
      userAcceptedTos: false,
      userNeedsToAcceptTos: true
    }

    // Assertion for when `userAcceptedVersion` is undefined
    expect(parseToSDetails(tosDetails)).toEqual(expectedResult)

    // Assertion for when key `userAcceptedVersion` is not present in object
    expect(parseToSDetails({
      currentVersion: '1',
      isEnabled: true,
      isGracePeriodEnabled: true
    })).toEqual(expectedResult)
  })
})

describe('Terms of Service Detail Parser sets ToS pop-up', () => {
  it('to show if the user has accepted a version of the ToS that is not the latest version and the grace period is enabled', () => {
    expect(parseToSDetails({
      isGracePeriodEnabled: true,
      isEnabled: true,
      currentVersion: '1',
      userAcceptedVersion: '0'
    })).toEqual({
      isGracePeriodEnabled: true,
      currentVersion: '1',
      userAcceptedVersion: '0',
      userAcceptedTos: true,
      userNeedsToAcceptTos: true // this is the field we care about for this test
    })
  })

  it('to show if the user has accepted a version of the ToS that is not the latest version and the grace period is disabled', () => {
    expect(parseToSDetails({
      isGracePeriodEnabled: false,
      isEnabled: true,
      currentVersion: '1',
      userAcceptedVersion: '0'
    })).toEqual({
      isGracePeriodEnabled: false,
      currentVersion: '1',
      userAcceptedVersion: '0',
      userAcceptedTos: false,
      userNeedsToAcceptTos: true // this is the field we care about for this test
    })
  })

  it('to show if the user has never accepted a version of the ToS', () => {
    expect(parseToSDetails({
      isGracePeriodEnabled: false,
      isEnabled: true,
      currentVersion: '1',
      userAcceptedVersion: undefined
    })).toEqual({
      isGracePeriodEnabled: false,
      currentVersion: '1',
      userAcceptedVersion: undefined,
      userAcceptedTos: false,
      userNeedsToAcceptTos: true // this is the field we care about for this test
    })
  })
})
