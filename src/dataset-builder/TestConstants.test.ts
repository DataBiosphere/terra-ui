import { forEach } from 'lodash';
import {
  addToSeriesData,
  generateDemographicSeries,
  generateRandomNumbers,
  generateRandomNumbersThatAddUpTo,
} from 'src/dataset-builder/TestConstants';

describe('TestConstants', () => {
  it('generateRandomNumbers', () => {
    const nums = generateRandomNumbers(3, 90);
    expect(nums.length).toBe(3);
    forEach(nums, (num) => {
      expect(num <= 90).toBe(true);
    });
  });

  it('generateRandomNumbersThatAddUpTo', () => {
    const nums = generateRandomNumbersThatAddUpTo(100, 3);
    expect(nums.length).toBe(3);
    expect(nums.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('addToSeriesData', () => {
    const series = [{ data: [1, 2, 3] }, { data: [5, 6, 7] }];
    const data = [4, 8];
    addToSeriesData(series, data);
    expect(series[0].data).toEqual([1, 2, 3, 4]);
    expect(series[1].data).toEqual([5, 6, 7, 8]);
  });

  it('addToSeriesData error case', () => {
    const series = [{ data: [1, 2, 3] }];
    const data = [4, 8];
    expect(() => {
      addToSeriesData(series, data);
    }).toThrowError('series and data must be the same length');
  });

  it('generateDemographicsSeries', () => {});
  const series = generateDemographicSeries();
  expect(series.length).toBe(5);
  forEach(series, (s) => {
    expect(s.data.length).toBe(12);
  });
  let female = 0;
  let female18 = 0;
  let female45 = 0;
  let female65 = 0;
  let male = 0;
  let male18 = 0;
  let male45 = 0;
  let male65 = 0;
  let nonbinary = 0;
  let nonbinary18 = 0;
  let nonbinary45 = 0;
  let nonbinary65 = 0;
  forEach(series, (s) => {
    female += s.data[0];
    female18 += s.data[1];
    female45 += s.data[2];
    female65 += s.data[3];
    male += s.data[4];
    male18 += s.data[5];
    male45 += s.data[6];
    male65 += s.data[7];
    nonbinary += s.data[8];
    nonbinary18 += s.data[9];
    nonbinary45 += s.data[10];
    nonbinary65 += s.data[11];
  });
  expect(female + male + nonbinary).toBe(100);
  expect(female18 + female45 + female65).toBe(female);
  expect(male18 + male45 + male65).toBe(male);
  expect(nonbinary18 + nonbinary45 + nonbinary65).toBe(nonbinary);
});
