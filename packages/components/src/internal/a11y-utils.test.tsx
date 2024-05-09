import { Icon } from '../Icon';
import { containsOnlyUnlabelledIcon, ContainsOnlyUnlabelledIconArgs } from './a11y-utils';

describe('containsOnlyUnlabelledIcon', () => {
  fit.each([
    // Component
    [{ children: <Icon icon='bell' /> }, true],
    // Element has label
    [{ 'aria-label': 'Button', children: <Icon icon='bell' /> }, false],
    [{ 'aria-labelledby': 'label-element', children: <Icon icon='bell' /> }, false],
    // Icon has label
    [{ children: <Icon icon='bell' aria-label='Icon' /> }, false],
    [{ children: <Icon icon='bell' aria-labelledby='label-element' /> }, false],
    // Multiple children
    [{ children: [<Icon icon='bell' />, 'Label'] }, false],
    // Non-element child
    [{ children: 'Label' }, false],
  ] as [ContainsOnlyUnlabelledIconArgs, boolean][])(
    'returns true if element has no label and only child is an icon without a label',
    (props, expectedResult) => {
      // Act
      const result = containsOnlyUnlabelledIcon(props);

      // Assert
      expect(result).toBe(expectedResult);
    }
  );
});
