import { sanitizeAttributeUpdateString } from 'src/pages/workspaces/workspace/workflows/workflow-view-utils';

describe('sanitizeAttributeUpdateString', () => {
  it('handles update text without newlines', () => {
    const input = ''; // COMPLETE ME
    const expected = ''; // COMPLETE ME
    const actual = sanitizeAttributeUpdateString(input);
    expect(actual).toEqual(expected);
  });

  it('handles update text with newlines', () => {
    const input = ''; // COMPLETE ME
    const expected = ''; // COMPLETE ME
    const actual = sanitizeAttributeUpdateString(input);
    expect(actual).toEqual(expected);
  });
});
