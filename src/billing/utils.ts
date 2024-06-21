import { BillingProject } from 'src/billing-core/models';

export const billingRoles = {
  owner: 'Owner',
  user: 'User',
};

export const billingProjectNameValidator = (existing: string[]) => ({
  length: { minimum: 6, maximum: 30 },
  format: {
    pattern: /(\w|-)+/,
    message: 'can only contain letters, numbers, underscores and hyphens.',
  },
  exclusion: {
    within: existing,
    message: 'already exists',
  },
});

export const isCreating = (project: BillingProject) =>
  project.status === 'Creating' || project.status === 'CreatingLandingZone';
export const isDeleting = (project: BillingProject) => project.status === 'Deleting';
export const isErrored = (project: BillingProject) => project.status === 'Error' || project.status === 'DeletionFailed';
