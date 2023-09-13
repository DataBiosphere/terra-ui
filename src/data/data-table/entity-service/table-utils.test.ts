import { getRootTypeForSetTable } from './table-utils';

describe('getRootTypeForSetTable', () => {
  it('gets member type for set tables', () => {
    expect(getRootTypeForSetTable('sample_set')).toBe('sample');
  });

  it('gets member type for nested set tables', () => {
    expect(getRootTypeForSetTable('sample_set_set')).toBe('sample');
  });
});
