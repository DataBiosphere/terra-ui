import { jsonBody } from './request-utils';

describe('jsonBody', () => {
  it('produces expected body', () => {
    // Act
    const testBody = { key: 'value' };
    const actual = jsonBody(testBody);
    const expectedBody = JSON.stringify(testBody);

    // Assert
    expect(actual).toStrictEqual({
      body: expectedBody,
      headers: { 'Content-Type': 'application/json' },
    });
  });
});
