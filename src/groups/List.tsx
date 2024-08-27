export const groupNameValidator = (existing) => ({
  presence: { allowEmpty: false },
  length: { maximum: 60 },
  format: {
    pattern: /[A-Za-z0-9_-]*$/,
    message: 'can only contain letters, numbers, underscores, and dashes',
  },
  exclusion: {
    within: existing,
    message: 'already exists',
  },
});

export const columnWidths = '1fr 30% 6rem 20px';
