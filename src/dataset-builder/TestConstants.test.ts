import { forEach } from 'lodash';
import { generateRandomNumbers, generateRandomNumbersThatAddUpTo } from 'src/dataset-builder/TestConstants';

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
});
