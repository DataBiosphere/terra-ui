import { icon } from '../icon';
import { containsOnlyUnlabelledIcon } from './a11y-utils';

describe('containsOnlyUnlabelledIcon', () => {
  it('returns true if element has no label and only child is an icon without a label', () => {
    expect(
      containsOnlyUnlabelledIcon({
        children: icon('bell'),
      })
    ).toBe(true);

    expect(
      containsOnlyUnlabelledIcon({
        'aria-label': 'Label',
        children: icon('bell'),
      })
    ).toBe(false);

    expect(
      containsOnlyUnlabelledIcon({
        'aria-labelledby': 'label-id',
        children: icon('bell'),
      })
    ).toBe(false);

    expect(
      containsOnlyUnlabelledIcon({
        children: icon('bell', { 'aria-label': 'Label' }),
      })
    ).toBe(false);

    expect(
      containsOnlyUnlabelledIcon({
        children: icon('bell', { 'aria-labelledby': 'label-id' }),
      })
    ).toBe(false);
  });
});
