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
import {
  BucketLifecycleSetting,
  DeleteBucketLifecycleRule,
  isBucketLifecycleSetting,
  isDeleteBucketLifecycleRule,
  modifyFirstBucketDeletionRule,
  removeFirstBucketDeletionRule,
  suggestedPrefixes,
  WorkspaceSetting,
} from 'src/workspaces/SettingsModal/utils';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

interface SettingsModalProps {
  workspace: Workspace;
  onDismiss: () => void;
}

/**
 * This modal is assumed to only be displayed for Google workspaces.
 */
const SettingsModal = (props: SettingsModalProps): ReactNode => {
  const { namespace, name } = props.workspace.workspace;

  const [lifecycleRulesEnabled, setLifecycleRulesEnabled] = useState(false);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [lifecycleAge, setLifecycleAge] = useState<number | null>(null);

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

  useEffect(() => {
    const loadSettings = withErrorReporting('Error loading workspace settings')(async () => {
      const settings = (await Ajax(signal)
        .Workspaces.workspaceV2(namespace, name)
        .getSettings()) satisfies WorkspaceSetting[];
      setWorkspaceSettings(settings);
      const bucketLifecycleSetting = getFirstBucketLifecycleSetting(settings);
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
    await Ajax().Workspaces.workspaceV2(namespace, name).updateSettings(newSettings);
    props.onDismiss();
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
        prefixes: prefixesChoice,
        age: lifecycleAge, // will be null if lifecycleRulesEnabled is false
        ...extractWorkspaceDetails(props.workspace),
      });
    }
  });

  return (
    <Modal
      title='Configure Workspace Settings'
      onDismiss={props.onDismiss}
      okButton={
        <ButtonPrimary
          disabled={lifecycleRulesEnabled && (prefixes.length === 0 || lifecycleAge === null)}
          onClick={persistSettings}
          tooltip={lifecycleRulesEnabled ? 'Please specify all lifecycle rule options' : ''}
        >
          Save
        </ButtonPrimary>
      }
    >
      {isFeaturePreviewEnabled(GCP_BUCKET_LIFECYCLE_RULES) && (
        <BucketLifecycleSettings
          lifecycleRulesEnabled={lifecycleRulesEnabled}
          setLifecycleRulesEnabled={setLifecycleRulesEnabled}
          lifecycleAge={lifecycleAge}
          setLifecycleAge={setLifecycleAge}
          prefixes={prefixes}
          setPrefixes={setPrefixes}
        />
      )}
      {workspaceSettings === undefined && <SpinnerOverlay />}
    </Modal>
  );
};

export default SettingsModal;
