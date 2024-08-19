import { IconProps } from '@terra-ui-packages/components';
import { BillingProject } from 'src/billing-core/models';
import colors from 'src/libs/colors';

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

export const billingAccountIconSize = 16;

export type BillingAccountStatus = 'updating' | 'done' | 'error';
const billingAccountIconProps: Record<BillingAccountStatus, IconProps> = {
  updating: {
    icon: 'sync',
    color: colors.warning(),
    size: billingAccountIconSize,
    'aria-label': 'billing account updating',
  },
  done: {
    icon: 'check',
    color: colors.accent(),
    size: billingAccountIconSize,
    'aria-label': 'billing account up-to-date',
  },
  error: {
    icon: 'warning-standard',
    color: colors.danger(),
    size: billingAccountIconSize,
    'aria-label': 'billing account in error state',
  },
};

export const getBillingAccountIconProps = (status: BillingAccountStatus): IconProps => {
  return billingAccountIconProps[status];
};

export const accountLinkStyle = {
  color: colors.dark(),
  fontSize: 14,
  display: 'flex',
  alignItems: 'center',
  marginTop: '0.5rem',
  marginLeft: '1rem',
};
