import { displayAttributeValue } from 'src/workspaces/dashboard/DatasetAttributes';

describe('displayAttributeValue', () => {
  it('should join array elements with comma', () => {
    const input = ['element1', 'element2', 'element3'];
    const output = displayAttributeValue(input);
    expect(output).toBe('element1, element2, element3');
  });

  it('should return "Yes" for true', () => {
    const input = true;
    const output = displayAttributeValue(input);
    expect(output).toBe('Yes');
  });

  it('should return "No" for false', () => {
    const input = false;
    const output = displayAttributeValue(input);
    expect(output).toBe('No');
  });

  it('should return the same string for string input', () => {
    const input = 'test string';
    const output = displayAttributeValue(input);
    expect(output).toBe('test string');
  });

  it('should join array elements of "items" property with comma for object input', () => {
    const input = { items: ['item1', 'item2', 'item3'] };
    const output = displayAttributeValue(input);
    expect(output).toBe('item1, item2, item3');
  });

  it('should return stringified object for object input', () => {
    const input = { key: 'value' };
    const output = displayAttributeValue(input);
    expect(output).toBe(JSON.stringify(input));
  });

  it('should return stringified input for non-object and non-array input', () => {
    const input = 123;
    const output = displayAttributeValue(input);
    expect(output).toBe(JSON.stringify(input));
  });
});
