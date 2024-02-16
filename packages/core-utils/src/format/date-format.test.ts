import { formatDate, formatDatetime } from './date-format';

describe('formatDate', () => {
  it.each([
    { type: 'date', value: new Date(2024, 0, 1, 9, 30) },
    { type: 'date string', value: '2024-01-01T09:30:00' },
    { type: 'timestamp', value: 1704101400000 },
  ])('formats a $type', ({ value }) => {
    expect(formatDate(value)).toBe('Jan 1, 2024');
  });
});

describe('formatDatetime', () => {
  it.each([
    { type: 'date', value: new Date(2024, 0, 1, 9, 30) },
    { type: 'date string', value: '2024-01-01T09:30:00' },
    { type: 'timestamp', value: 1704101400000 },
  ])('formats a $type', ({ value }) => {
    expect(formatDatetime(value)).toBe('Jan 1, 2024, 9:30 AM');
  });
});
