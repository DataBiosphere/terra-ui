import _ from 'lodash/fp';

export const suggestedPrefixes = {
  allObjects: 'All Objects',
  submissions: 'submissions/',
  submissionIntermediaries: 'submissions/intermediates/',
};

interface BucketLifecycleRule {
  action: {
    actionType: string;
  };
  conditions?: any;
}

export interface DeleteBucketLifecycleRule extends BucketLifecycleRule {
  action: {
    actionType: 'Delete';
  };
  conditions: {
    age: number;
    matchesPrefix: string[];
  };
}

export interface WorkspaceSetting {
  settingType: string;
}

export interface BucketLifecycleSetting extends WorkspaceSetting {
  settingType: 'GcpBucketLifecycle';
  config: { rules: BucketLifecycleRule[] };
}

export const isBucketLifecycleSetting = (setting: WorkspaceSetting): setting is BucketLifecycleSetting =>
  setting.settingType === 'GcpBucketLifecycle';

export const isDeleteBucketLifecycleRule = (rule: BucketLifecycleRule): rule is DeleteBucketLifecycleRule =>
  rule.action.actionType === 'Delete';

/**
 * Removes the first delete rule from the first bucketLifecycleSetting in the workspace settings.
 * Pulled out for unit tests.
 */
export const removeFirstBucketDeletionRule = (originalSettings: WorkspaceSetting[]): WorkspaceSetting[] => {
  const workspaceSettings = _.cloneDeep(originalSettings); // cloning mostly for testing purposes

  const bucketLifecycleSettings: BucketLifecycleSetting[] = workspaceSettings.filter((setting: WorkspaceSetting) =>
    isBucketLifecycleSetting(setting)
  ) as BucketLifecycleSetting[];
  const otherSettings: WorkspaceSetting[] = workspaceSettings.filter((setting) => !isBucketLifecycleSetting(setting));

  // If no bucketLifecycleSettings existed, nothing to delete
  if (bucketLifecycleSettings.length === 0) {
    return otherSettings;
  }

  // If multiple bucketLifecycleSettings, we will modify only the first one.
  const existingSetting = bucketLifecycleSettings[0];
  // Remove the first delete rule in this setting and leave the rest.
  const deleteRules = existingSetting.config.rules.filter((rule) => rule.action.actionType === 'Delete');
  const otherRules = existingSetting.config.rules.filter((rule) => rule.action.actionType !== 'Delete');
  bucketLifecycleSettings[0].config.rules = _.concat(deleteRules.slice(1), otherRules);

  return _.concat(bucketLifecycleSettings, otherSettings);
};

export const modifyFirstBucketDeletionRule = (
  originalSettings: WorkspaceSetting[],
  days: number,
  prefixes: string[]
): WorkspaceSetting[] => {
  const workspaceSettings = _.cloneDeep(originalSettings); // cloning mostly for testing purposes

  const bucketLifecycleSettings: BucketLifecycleSetting[] = workspaceSettings.filter((setting: WorkspaceSetting) =>
    isBucketLifecycleSetting(setting)
  ) as BucketLifecycleSetting[];
  const otherSettings: WorkspaceSetting[] = workspaceSettings.filter((setting) => !isBucketLifecycleSetting(setting));

  // If no bucketLifecycleSettings existed, create a new one.
  if (bucketLifecycleSettings.length === 0) {
    // @ts-ignore
    return _.concat(
      [
        {
          settingType: 'GcpBucketLifecycle',
          config: {
            rules: [
              {
                action: { actionType: 'Delete' },
                conditions: { age: days, matchesPrefix: prefixes },
              },
            ],
          },
        } as BucketLifecycleSetting,
      ],
      otherSettings
    );
  }
  // If multiple bucketLifecycleSettings, we will modify only the first one.
  const existingSetting = bucketLifecycleSettings[0];
  // Modify the first delete rule in this setting and leave the rest.
  const deleteRules: DeleteBucketLifecycleRule[] = existingSetting.config.rules.filter((rule) =>
    isDeleteBucketLifecycleRule(rule)
  ) as DeleteBucketLifecycleRule[];
  const otherRules = existingSetting.config.rules.filter((rule) => !isDeleteBucketLifecycleRule(rule));

  if (deleteRules.length === 0) {
    deleteRules.push({
      action: { actionType: 'Delete' },
      conditions: { age: days, matchesPrefix: prefixes },
    });
  } else {
    deleteRules[0].conditions.age = days;
    deleteRules[0].conditions.matchesPrefix = prefixes;
  }
  bucketLifecycleSettings[0].config.rules = _.concat(deleteRules, otherRules);
  return _.concat(bucketLifecycleSettings, otherSettings);
};
