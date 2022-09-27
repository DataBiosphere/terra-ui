import { differenceFromNowInSeconds } from 'src/libs/utils'


beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

describe('differenceFromNowInSeconds', () => {
  it('returns the number of seconds between current time and server-formatted date', () => {
    const workspaceDate = '2022-04-01T20:17:04.324Z'

    // Month is 0-based, ms will create rounding.
    jest.setSystemTime(new Date(Date.UTC(2022, 3, 1, 20, 17, 5, 0)))
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(0)

    jest.advanceTimersByTime(3000)
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(3)

    jest.advanceTimersByTime(60000)
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(63)
  })
})
