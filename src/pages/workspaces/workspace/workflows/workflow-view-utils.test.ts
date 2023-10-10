import { sanitizeAttributeUpdateString } from 'src/pages/workspaces/workspace/workflows/workflow-view-utils';

describe('sanitizeAttributeUpdateString', () => {
  it('handles update text without newlines', () => {
    // eslint-disable-next-line no-template-curly-in-string
    const input = '${"Hello World"}';
    const expected = '"Hello World"';
    const actual = sanitizeAttributeUpdateString(input);
    expect(actual).toEqual(expected);
  });

  it('handles update text with newlines', () => {
    // prettier-ignore
    // eslint-disable-next-line no-template-curly-in-string, no-useless-escape
    const input = '${[\"test1\",\n\"test2\"]}';
    const expected = '["test1",\n"test2"]';
    const actual = sanitizeAttributeUpdateString(input);
    expect(actual).toEqual(expected);
  });

  it('handles badly formatted JSON input without dollar sign not downloaded from Terra', () => {
    // prettier-ignore
    // eslint-disable-next-line no-useless-escape
    const input = '[\"test1\", \"test2\"]';
    const expected = '"[\\"test1\\", \\"test2\\"]"';
    const actual = sanitizeAttributeUpdateString(input);
    expect(actual).toEqual(expected);
  });
});
