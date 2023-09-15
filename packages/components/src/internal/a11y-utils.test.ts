import { icon } from '../icon';
import { containsOnlyUnlabelledIcon, ContainsOnlyUnlabelledIconArgs } from './a11y-utils';

describe('containsOnlyUnlabelledIcon', () => {
  it.each([
    [{ children: icon('bell') }, true],
    // Element has label
    [{ 'aria-label': 'Button', children: icon('bell') }, false],
    [{ 'aria-labelledby': 'label-element', children: icon('bell') }, false],
    // Icon has label
    [{ children: icon('bell', { 'aria-label': 'Icon' }) }, false],
    [{ children: icon('bell', { 'aria-labelledby': 'label-element' }) }, false],
    // Multiple children
    [{ children: [icon('bell'), 'Label'] }, false],
    // Non-element child
    [{ children: 'Label' }, false],
  ] as [ContainsOnlyUnlabelledIconArgs, boolean][])(
    'returns true if element has no label and only child is an icon without a label',
    (props, expectedResult) => {
      const result = containsOnlyUnlabelledIcon(props);
      expect(result).toBe(expectedResult);
    }
  );
});
