import { ButtonPrimary, Modal, SpinnerOverlay } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useEffect, useState } from 'react';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
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

  useEffect(() => {
    const loadSettings = withErrorReporting('Error loading workspace settings')(async () => {
      const settings = (await Ajax(signal)
        .Workspaces.workspaceV2(namespace, name)
        .getSettings()) satisfies WorkspaceSetting[];
      setWorkspaceSettings(settings);
      const bucketLifecycleSettings: BucketLifecycleSetting[] = settings.filter((setting: WorkspaceSetting) =>
        isBucketLifecycleSetting(setting)
      );
      if (bucketLifecycleSettings.length > 0) {
        if (bucketLifecycleSettings.length > 1) {
          // eslint-disable-next-line no-console
          console.log('Multiple bucket lifecycle settings found, displaying only first');
        }
        const bucketLifecycleSetting = settings[0];
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

  const persistSettings = async () => {
    let newSettings: WorkspaceSetting[];
    if (lifecycleRulesEnabled) {
      const prefixesOrNone = _.without([suggestedPrefixes.allObjects], prefixes);
      newSettings = modifyFirstBucketDeletionRule(workspaceSettings || [], lifecycleAge!, prefixesOrNone);
    } else {
      newSettings = removeFirstBucketDeletionRule(workspaceSettings || []);
    }
    await Ajax().Workspaces.workspaceV2(namespace, name).updateSettings(newSettings);
    props.onDismiss();
    // TODO: add eventing and error wrapping
    // Test onDismiss being called.
  };

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
      <BucketLifecycleSettings
        lifecycleRulesEnabled={lifecycleRulesEnabled}
        setLifecycleRulesEnabled={setLifecycleRulesEnabled}
        lifecycleAge={lifecycleAge}
        setLifecycleAge={setLifecycleAge}
        prefixes={prefixes}
        setPrefixes={setPrefixes}
      />
      {workspaceSettings === undefined && <SpinnerOverlay />}
    </Modal>
  );
};

export default SettingsModal;
