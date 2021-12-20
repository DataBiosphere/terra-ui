import _ from 'lodash/fp'


describe('Generic Lodash Test', () => {
  it('returns rowindex as a string when using toPairs', () => {
    const result = _.toPairs(['a', 'b', 'c'])
    /* Result:
      [['0', 'a'], ['1', 'b'], ['2', ['c']]
    */

    expect(result[0][0]).toBe('0')
    expect(result[0][1]).toBe('a')

    expect(result[1][0]).toBe('1')
    expect(result[1][1]).toBe('b')

    expect(result[2][0]).toBe('2')
    expect(result[2][1]).toBe('c')
  })
})
