import { differenceFromDatesInSeconds, differenceFromNowInSeconds, kvArrayToObject, textMatch } from 'src/libs/utils';

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('differenceFromNowInSeconds', () => {
  it('returns the number of seconds between current time and server-formatted date', () => {
    const workspaceDate = '2022-04-01T20:17:04.324Z';

    // Month is 0-based, ms will create rounding.
    jest.setSystemTime(new Date(Date.UTC(2022, 3, 1, 20, 17, 5, 0)));
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(0);

    jest.advanceTimersByTime(3000);
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(3);

    jest.advanceTimersByTime(60000);
    expect(differenceFromNowInSeconds(workspaceDate)).toBe(63);
  });
});

describe('differenceFromDatesInSeconds', () => {
  it('returns the number of seconds between two server-formatted dates', () => {
    const startDate = '2022-04-01T20:17:04.324Z';
    const threeSecondsLater = '2022-04-01T20:17:07.324Z';
    const oneMinuteLater = '2022-04-01T20:18:04.324Z';
    const twoDaysLater = '2022-04-03T20:17:04.324Z';

    expect(differenceFromDatesInSeconds(startDate, startDate)).toBe(0);
    expect(differenceFromDatesInSeconds(startDate, threeSecondsLater)).toBe(3);
    expect(differenceFromDatesInSeconds(startDate, oneMinuteLater)).toBe(60);
    expect(differenceFromDatesInSeconds(startDate, twoDaysLater)).toBe(172800);
  });
});

describe('textMatch', () => {
  it.each([
    { needle: 'success', haystack: 'success', result: true },
    { needle: 'Succes', haystack: 'successss', result: true },
    { needle: 'nomatch', haystack: '404', result: false },
  ])('properly determines if the needle is in the haystack', ({ needle, haystack, result }) => {
    // Act
    const doesMatch = textMatch(needle, haystack);
    expect(doesMatch).toBe(result);
  });
});

describe('kvArrayToObject', () => {
  it('converts an array of key/value objects to an object', () => {
    // Act
    const result = kvArrayToObject([
      { key: 'foo', value: 1 },
      { key: 'bar', value: 2 },
      { key: 'baz', value: 3 },
    ]);

    // Assert
    expect(result).toEqual({
      foo: 1,
      bar: 2,
      baz: 3,
    });
  });

  it('handles empty arrays', () => {
    // Act
    const result = kvArrayToObject([]);

    // Assert
    expect(result).toEqual({});
  });

  it('handles undefined input', () => {
    // Act
    const result = kvArrayToObject(undefined);

    // Assert
    expect(result).toEqual({});
  });
});
