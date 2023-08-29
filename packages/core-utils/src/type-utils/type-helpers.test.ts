import { enforceType } from './type-helpers';

describe('enforceType', () => {
  it('enforces an enum-like type', () => {
    // Arrange
    type MyTestEnum = 'A' | 'B';

    // Act
    const result = enforceType<MyTestEnum>('A');

    // Arrange
    expect(result).toBe('A');
  });
});
