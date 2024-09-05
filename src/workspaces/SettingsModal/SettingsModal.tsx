import { ButtonPrimary, Modal, SpinnerOverlay } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useEffect, useState } from 'react';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import Events, { extractWorkspaceDetails } from 'src/libs/events';
import { isFeaturePreviewEnabled } from 'src/libs/feature-previews';
import { GCP_BUCKET_LIFECYCLE_RULES } from 'src/libs/feature-previews-config';
import { useCancellation } from 'src/libs/react-utils';
import BucketLifecycleSettings from 'src/workspaces/SettingsModal/BucketLifecycleSettings';
import SoftDelete from 'src/workspaces/SettingsModal/SoftDelete';
import {
  BucketLifecycleSetting,
  DeleteBucketLifecycleRule,
  isBucketLifecycleSetting,
  isDeleteBucketLifecycleRule,
  isSoftDeleteSetting,
  modifyFirstBucketDeletionRule,
  modifyFirstSoftDeleteSetting,
  removeFirstBucketDeletionRule,
  secondsInADay,
  softDeleteDefaultRetention,
  SoftDeleteSetting,
  suggestedPrefixes,
  WorkspaceSetting,
} from 'src/workspaces/SettingsModal/utils';
import { isOwner as isWorkspaceOwner, WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

interface SettingsModalProps {
  workspace: Workspace;
  onDismiss: () => void;
}

/**
 * This modal is assumed to only be displayed for Google workspaces.
 */
const SettingsModal = (props: SettingsModalProps): ReactNode => {
  const { namespace, name } = props.workspace.workspace;
  const isOwner = isWorkspaceOwner(props.workspace.accessLevel);

  const [lifecycleRulesEnabled, setLifecycleRulesEnabled] = useState(false);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [lifecycleAge, setLifecycleAge] = useState<number | null>(null);

  const [softDeleteEnabled, setSoftDeleteEnabled] = useState(false);
  const [softDeleteRetention, setSoftDeleteRetention] = useState<number | null>(null);

  // Original settings from server, may contain multiple types
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSetting[] | undefined>(undefined);

  const signal = useCancellation();

  const getFirstBucketLifecycleSetting = (
    settings: WorkspaceSetting[],
    printMultipleWarning = false
  ): BucketLifecycleSetting | undefined => {
    const bucketLifecycleSettings: BucketLifecycleSetting[] = settings.filter((setting: WorkspaceSetting) =>
      isBucketLifecycleSetting(setting)
    ) as BucketLifecycleSetting[];
    if (bucketLifecycleSettings.length > 0) {
      if (printMultipleWarning && bucketLifecycleSettings.length > 1) {
        // eslint-disable-next-line no-console
        console.log('Multiple bucket lifecycle settings found, displaying only first');
      }
      return bucketLifecycleSettings[0];
    }
    return undefined;
  };

  const getDeleteLifecycleRule = (
    bucketLifecycleSetting: BucketLifecycleSetting | undefined,
    printMultipleWarning = false
  ): DeleteBucketLifecycleRule | undefined => {
    const configRules = bucketLifecycleSetting?.config.rules;
    const deleteRules: DeleteBucketLifecycleRule[] = configRules?.filter((rule) =>
      isDeleteBucketLifecycleRule(rule)
    ) as DeleteBucketLifecycleRule[];
    if (printMultipleWarning && !!deleteRules && deleteRules.length > 1) {
      // eslint-disable-next-line no-console
      console.log('Multiple delete bucket lifecycle rules found, displaying only first');
    }
    return !!deleteRules && deleteRules.length >= 1 ? deleteRules[0] : undefined;
  };

  const getFirstSoftDeleteSetting = (
    settings: WorkspaceSetting[],
    printMultipleWarning = false
  ): SoftDeleteSetting | undefined => {
    const softDeleteSettings: SoftDeleteSetting[] = settings.filter((setting: WorkspaceSetting) =>
      isSoftDeleteSetting(setting)
    ) as SoftDeleteSetting[];
    if (softDeleteSettings.length > 0) {
      if (printMultipleWarning && softDeleteSettings.length > 1) {
        // eslint-disable-next-line no-console
        console.log('Multiple soft delete settings found, using only first');
      }
      return softDeleteSettings[0];
    }
    return undefined;
  };

  useEffect(() => {
    const loadSettings = withErrorReporting('Error loading workspace settings')(async () => {
      const settings = (await Ajax(signal)
        .Workspaces.workspaceV2(namespace, name)
        .getSettings()) satisfies WorkspaceSetting[];
      setWorkspaceSettings(settings);
      const bucketLifecycleSetting = getFirstBucketLifecycleSetting(settings, true);
      if (bucketLifecycleSetting !== undefined) {
        const rule = getDeleteLifecycleRule(bucketLifecycleSetting, true);
        if (rule) {
          setLifecycleRulesEnabled(true);
          const prefixes = rule.conditions.matchesPrefix;
          if (prefixes.length === 0) {
            setPrefixes([suggestedPrefixes.allObjects]);
          } else {
            setPrefixes(prefixes);
          }
          setLifecycleAge(rule.conditions.age);
        }
      }
      const softDelete = getFirstSoftDeleteSetting(settings, true);
      const retentionSeconds =
        softDelete === undefined ? softDeleteDefaultRetention : softDelete.config.retentionDurationInSeconds;
      const settingEnabled = retentionSeconds !== 0;
      setSoftDeleteEnabled(settingEnabled);
      if (settingEnabled) {
        // If soft delete is not enabled, a retention of 0 is returned. However, the UI should not display the value
        // because it is confusing with the switch being disabled.
        setSoftDeleteRetention(retentionSeconds / secondsInADay);
      }
    });

    loadSettings();
  }, [namespace, name, signal]);

  const persistSettings = withErrorReporting('Error saving workspace settings')(async () => {
    let newSettings: WorkspaceSetting[];
    if (lifecycleRulesEnabled) {
      const prefixesOrNone = _.without([suggestedPrefixes.allObjects], prefixes);
      newSettings = modifyFirstBucketDeletionRule(workspaceSettings || [], lifecycleAge!, prefixesOrNone);
    } else {
      newSettings = removeFirstBucketDeletionRule(workspaceSettings || []);
    }
    const softDeleteInDays = softDeleteEnabled ? softDeleteRetention! : 0;
    newSettings = modifyFirstSoftDeleteSetting(newSettings, softDeleteInDays);
    await Ajax().Workspaces.workspaceV2(namespace, name).updateSettings(newSettings);
    props.onDismiss();

    // Event about bucket lifecycle setting only if something actually changed.
    const originalLifecycleSetting = getFirstBucketLifecycleSetting(workspaceSettings || []);
    const newLifecycleSetting = getFirstBucketLifecycleSetting(newSettings);
    if (!_.isEqual(originalLifecycleSetting, newLifecycleSetting)) {
      let prefixesChoice: string | null = null;
      if (lifecycleRulesEnabled) {
        if (_.without(_.values(suggestedPrefixes), prefixes).length > 0) {
          prefixesChoice = 'Custom';
        } else if (_.contains(suggestedPrefixes.allObjects, prefixes)) {
          prefixesChoice = 'AllObjects';
        } else {
          const submissions = _.contains(suggestedPrefixes.submissions, prefixes);
          const intermediaries = _.contains(suggestedPrefixes.submissionIntermediaries, prefixes);
          if (submissions && intermediaries) {
            prefixesChoice = 'AllSubmissionsAndSubmissionsIntermediaries';
          } else if (submissions) {
            prefixesChoice = 'AllSubmissions';
          } else if (intermediaries) {
            prefixesChoice = 'SubmissionsIntermediaries';
          }
        }
      }
      Ajax().Metrics.captureEvent(Events.workspaceSettingsBucketLifecycle, {
        enabled: lifecycleRulesEnabled,
        prefix: prefixesChoice,
        age: lifecycleAge, // will be null if lifecycleRulesEnabled is false
        ...extractWorkspaceDetails(props.workspace),
      });
    }

    // Event about soft delete setting only if something actually changed.
    const originalSoftDeleteSetting = getFirstSoftDeleteSetting(workspaceSettings || []);
    const newSoftDeleteSetting = getFirstSoftDeleteSetting(newSettings);
    if (
      originalSoftDeleteSetting === undefined &&
      newSoftDeleteSetting?.config.retentionDurationInSeconds === softDeleteDefaultRetention
    ) {
      // If the bucket had no soft delete setting before, and the current one is the default retention, don't event.
    } else if (!_.isEqual(originalSoftDeleteSetting, newSoftDeleteSetting)) {
      // Event if an explicit setting existed before and it changed.
      Ajax().Metrics.captureEvent(Events.workspaceSettingsSoftDelete, {
        enabled: softDeleteEnabled,
        retention: softDeleteRetention, // will be null if soft delete is disabled
        ...extractWorkspaceDetails(props.workspace),
      });
    }
  });

  const getSaveTooltip = () => {
    if (!isOwner) {
      return 'You do not have permissions to modify settings';
    }
    if (lifecycleRulesEnabled && (prefixes.length === 0 || lifecycleAge === null)) {
      return 'Please specify all lifecycle rule options';
    }
    if (softDeleteEnabled && softDeleteRetention === null) {
      return 'Please specify a soft delete retention value';
    }
  };

  return (
    <Modal
      title='Configure Workspace Settings'
      onDismiss={props.onDismiss}
      width={550}
      okButton={
        <ButtonPrimary disabled={!!getSaveTooltip()} onClick={persistSettings} tooltip={getSaveTooltip()}>
          Save
        </ButtonPrimary>
      }
    >
      {isFeaturePreviewEnabled(GCP_BUCKET_LIFECYCLE_RULES) && (
        <div style={{ marginBottom: '.75rem' }}>
          <BucketLifecycleSettings
            lifecycleRulesEnabled={lifecycleRulesEnabled}
            setLifecycleRulesEnabled={setLifecycleRulesEnabled}
            lifecycleAge={lifecycleAge}
            setLifecycleAge={setLifecycleAge}
            prefixes={prefixes}
            setPrefixes={setPrefixes}
            isOwner={isOwner}
          />
        </div>
      )}
      <SoftDelete
        softDeleteEnabled={softDeleteEnabled}
        setSoftDeleteEnabled={setSoftDeleteEnabled}
        softDeleteRetention={softDeleteRetention}
        setSoftDeleteRetention={setSoftDeleteRetention}
        isOwner={isOwner}
      />

      {workspaceSettings === undefined && <SpinnerOverlay />}
    </Modal>
  );
};

export default SettingsModal;
