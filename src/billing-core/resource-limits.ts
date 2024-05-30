import { BillingProject } from 'src/billing-core/models';

export interface BillingProjectResourceLimits {
  availableMachineTypes?: string[];
  maxAutopause?: number;
  maxPersistentDiskSize?: number;
}

/**
 * Parses a comma-separated string into an array of strings.
 * If the input is not a string or an empty string, returns undefined.
 */
const getCommaSeparatedValues = (value: unknown): string[] | undefined => {
  if (typeof value === 'string' && value.length !== 0) {
    return value.split(',');
  }
  return undefined;
};

/**
 * Parses a value into a number.
 */
const getNumberValue = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
};

/**
 * Parse a billing project's resource limits (if any).
 *
 * @param project - The billing project.
 * @returns The billing project's resource limits, or undefined if the project does not have any.
 */
export const getResourceLimits = (project: BillingProject): BillingProjectResourceLimits | undefined => {
  if (project.cloudPlatform !== 'AZURE' || !project.organization?.limits) {
    return undefined;
  }

  const limits = project.organization.limits;
  if (Object.keys(limits).length === 0) {
    return undefined;
  }

  // The BPM API returns all resource limits as strings. This parses them into more structured types.
  const resourceLimits: BillingProjectResourceLimits = {
    availableMachineTypes: getCommaSeparatedValues(limits.machinetypes),
    maxAutopause: getNumberValue(limits.autopause),
    maxPersistentDiskSize: getNumberValue(limits.persistentdisk),
  };

  return resourceLimits;
};
