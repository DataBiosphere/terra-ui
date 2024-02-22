const dateFormat = new Intl.DateTimeFormat('default', { day: 'numeric', month: 'short', year: 'numeric' });

const datetimeFormat = new Intl.DateTimeFormat('default', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
});

type DateLike = number | string | Date;

/**
 * Format a date.
 *
 * @example
 * formatDate(new Date(2024, 0, 1, 9, 30, 0)); // 'Jan 1, 2024'
 */
export const formatDate = (date: DateLike): string => dateFormat.format(new Date(date));

/**
 * Format a date and time.
 *
 * @example
 * formatDatetime(new Date(2024, 0, 1, 9, 30)); // 'Jan 1, 2024, 9:30 AM'
 */
export const formatDatetime = (date: DateLike): string => datetimeFormat.format(new Date(date));
