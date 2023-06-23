import { extractLeoTokenFromCookies } from 'src/libs/ajax/Cbas';

describe('Leo Tokens', () => {
  it('should get LeoToken from a one-cookie string', () => {
    const input = 'LeoToken=1234';
    const output = extractLeoTokenFromCookies(input);
    expect(output).toEqual('1234');
  });

  it('should get LeoToken from a multi-cookie string without spaces', () => {
    const input = '_ga=foo;_ga_bar=baz;LeoToken=1234';
    const output = extractLeoTokenFromCookies(input);
    expect(output).toEqual('1234');
  });

  it('should get LeoToken from a multi-cookie string with spaces', () => {
    const input = '_ga=foo; _ga_bar=baz; LeoToken=1234';
    const output = extractLeoTokenFromCookies(input);
    expect(output).toEqual('1234');
  });
});
