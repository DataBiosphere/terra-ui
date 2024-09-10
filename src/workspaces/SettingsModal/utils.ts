import _ from 'lodash/fp';

export const suggestedPrefixes = {
  allObjects: 'All Objects',
  submissions: 'submissions/',
  submissionIntermediaries: 'submissions/intermediates/',
};

export const secondsInADay = 86400;
export const softDeleteDefaultRetention = 7 * secondsInADay;

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

export interface SoftDeleteSetting extends WorkspaceSetting {
  settingType: 'GcpBucketSoftDelete';
  config: { retentionDurationInSeconds: number };
}

export const isBucketLifecycleSetting = (setting: WorkspaceSetting): setting is BucketLifecycleSetting =>
  setting.settingType === 'GcpBucketLifecycle';

export const isDeleteBucketLifecycleRule = (rule: BucketLifecycleRule): rule is DeleteBucketLifecycleRule =>
  rule.action.actionType === 'Delete';

export const isSoftDeleteSetting = (setting: WorkspaceSetting): setting is BucketLifecycleSetting =>
  setting.settingType === 'GcpBucketSoftDelete';

/**
 * Removes the first delete rule from the first bucketLifecycleSetting in the workspace settings.
 *
 * Note that any other settings will be preserved but moved to the end of the array.
 */
export const removeFirstBucketDeletionRule = (originalSettings: WorkspaceSetting[]): WorkspaceSetting[] => {
  // Clone original for testing purposes and to allow eventing only if there was a change.
  const workspaceSettings = _.cloneDeep(originalSettings);

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
  const deleteRules = existingSetting.config.rules.filter((rule) => isDeleteBucketLifecycleRule(rule));
  const otherRules = existingSetting.config.rules.filter((rule) => !isDeleteBucketLifecycleRule(rule));
  bucketLifecycleSettings[0].config.rules = _.concat(deleteRules.slice(1), otherRules);

  return _.concat(bucketLifecycleSettings, otherSettings);
};

/**
 * Modifies the first delete rule from the first bucketLifecycleSetting in the workspace settings.
 * If no such rule/setting exists, it will be created.
 *
 * Note that any other settings will be preserved but moved to the end of the array.
 */
export const modifyFirstBucketDeletionRule = (
  originalSettings: WorkspaceSetting[],
  days: number,
  prefixes: string[]
): WorkspaceSetting[] => {
  // Clone original for testing purposes and to allow eventing only if there was a change.
  const workspaceSettings = _.cloneDeep(originalSettings);

  const bucketLifecycleSettings: BucketLifecycleSetting[] = workspaceSettings.filter((setting: WorkspaceSetting) =>
    isBucketLifecycleSetting(setting)
  ) as BucketLifecycleSetting[];
  const otherSettings: WorkspaceSetting[] = workspaceSettings.filter((setting) => !isBucketLifecycleSetting(setting));

  // If no bucketLifecycleSettings existed, create a new one.
  if (bucketLifecycleSettings.length === 0) {
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

/**
 * Modifies the first soft delete setting in the workspace settings.
 * If no such setting exists, it will be created.
 *
 * Note that any other settings will be preserved but moved to the end of the array.
 */
export const modifyFirstSoftDeleteSetting = (
  originalSettings: WorkspaceSetting[],
  days: number
): WorkspaceSetting[] => {
  // Clone original for testing purposes and to allow eventing only if there was a change.
  const workspaceSettings = _.cloneDeep(originalSettings);

  const softDeleteSettings: SoftDeleteSetting[] = workspaceSettings.filter((setting: WorkspaceSetting) =>
    isSoftDeleteSetting(setting)
  ) as SoftDeleteSetting[];
  const otherSettings: WorkspaceSetting[] = workspaceSettings.filter((setting) => !isSoftDeleteSetting(setting));

  // If no SoftDeleteSetting existed, create a new one.
  if (softDeleteSettings.length === 0) {
    return _.concat(
      [
        {
          settingType: 'GcpBucketSoftDelete',
          config: {
            retentionDurationInSeconds: secondsInADay * days,
          },
        } as SoftDeleteSetting,
      ],
      otherSettings
    );
  }
  // If multiple soft delete settings, we will modify only the first one.
  const existingSetting = softDeleteSettings[0];
  existingSetting.config.retentionDurationInSeconds = secondsInADay * days;

  return _.concat(softDeleteSettings, otherSettings);
};