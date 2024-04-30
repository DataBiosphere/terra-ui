import { BillingProject } from 'src/billing-core/models';

export const supportsPhiTracking = (project: BillingProject): boolean => {
  return project.cloudPlatform === 'AZURE' && project.protectedData && !!project.organization?.enterprise;
};
