import {
  ButtonPrimary,
  CreatableSelect,
  Modal,
  SpinnerOverlay,
  Switch,
  useUniqueId,
} from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode, useEffect, useState } from 'react';
import { NumberInput } from 'src/components/input';
import { Ajax } from 'src/libs/ajax';
import { withErrorReporting } from 'src/libs/error';
import { FormLabel } from 'src/libs/forms';
import { useCancellation } from 'src/libs/react-utils';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

interface BucketLifecycleRule {
  action: {
    actionType: 'Delete';
  };
  conditions: {
    age: number;
    matchesPrefix: string[];
  };
}

interface BucketLifecycleSetting {
  settingType: 'GcpBucketLifecycle';
  config: { rules: BucketLifecycleRule[] };
}

interface SettingsModalProps {
  workspace: Workspace;
  onDismiss: () => void;
}

/**
 * This modal is assumed to only be displayed for Google workspaces.
 */
const SettingsModal = (props: SettingsModalProps): ReactNode => {
  const { onDismiss, workspace } = props;

  const allObjects = 'All Objects';
  const [lifecycleRulesEnabled, setLifecycleRulesEnabled] = useState(false);
  // In-progress lifecycle rules, will not be persisted (included in settings) unless lifecycleRulesEnabled is true
  const [lifecycleRules, setLifecycleRules] = useState<BucketLifecycleSetting | undefined>(undefined);

  const [workspaceSettings, setWorkspaceSettings] = useState<BucketLifecycleSetting[] | undefined>(undefined);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [lifecycleAge, setLifecycleAge] = useState<number>();

  const switchId = useUniqueId('switch');
  const daysId = useUniqueId('days');
  const signal = useCancellation();

  useEffect(() => {
    const { namespace, name } = workspace.workspace;
    const loadSettings = withErrorReporting('Error loading Workspace Settings')(async () => {
      const settings = await Ajax(signal).Workspaces.workspaceV2(namespace, name).getSettings();
      setWorkspaceSettings(settings);
      // TODO: change to filtering for GcpBucketLifecycle settings. We can assume that there will be at most 1.
      if (settings.length > 0 && settings[0].settingType === 'GcpBucketLifecycle') {
        const lifecycleSetting = settings[0] satisfies BucketLifecycleSetting;
        setLifecycleRules(lifecycleSetting);
        const rule = getBucketLifecycleRule(lifecycleSetting);
        if (rule) {
          setLifecycleRulesEnabled(true);
          const prefixes = rule.conditions.matchesPrefix;
          if (prefixes.length === 0) {
            setPrefixes([allObjects]);
          } else {
            setPrefixes(prefixes);
          }
          setLifecycleAge(rule.conditions.age);
        }
      }
    });

    loadSettings();
  }, [workspace, signal]);

  const getBucketLifecycleRule = (
    bucketLifecycleSetting: BucketLifecycleSetting | undefined
  ): BucketLifecycleRule | undefined => {
    const configRules = bucketLifecycleSetting?.config.rules;

    return !!configRules && configRules.length >= 1 ? configRules[0] : undefined;
  };

  // TODOs: will need to disable controls if the feature as a whole is off.
  // Although the API supports multiple rules, we only allow viewing and editing the first one.
  // The others will be retained if they exist, but not displayed.

  const prefixOptions = () => {
    // Append together suggested options, any options that were already get in GCP, plus anything the user
    // has added in the modal.
    const currentLifecycleRule = getBucketLifecycleRule(lifecycleRules);
    const gcpPrefixes = currentLifecycleRule ? currentLifecycleRule.conditions.matchesPrefix : [];
    const allOptions = _.uniq([allObjects, 'submissions/intermediates/', ...prefixes, ...gcpPrefixes]);
    return _.map((value) => ({ value, label: value }), allOptions);
  };

  const persistSettings = async () => {
    const { namespace, name } = workspace.workspace;
    // TODO: error handling, validing that the user entered values, and merge with existing settings.
    if (lifecycleRulesEnabled) {
      const newRules: BucketLifecycleRule = {
        action: { actionType: 'Delete' },
        conditions: { age: lifecycleAge!, matchesPrefix: prefixes },
      };
      const newSetting: BucketLifecycleSetting = {
        settingType: 'GcpBucketLifecycle',
        config: { rules: [newRules] },
      };
      await Ajax().Workspaces.workspaceV2(namespace, name).updateSettings([newSetting]);
    } else {
      // If we're disabling lifecycle rules, we should remove the setting.
      await Ajax()
        .Workspaces.workspaceV2(namespace, name)
        .updateSettings([
          {
            settingType: 'GcpBucketLifecycle',
            config: { rules: [] },
          },
        ]);
    }
    onDismiss();
  };

  const loading = workspaceSettings === undefined;
  return (
    <Modal
      title='Configure Workspace Settings'
      onDismiss={onDismiss}
      okButton={<ButtonPrimary onClick={persistSettings}>Ok</ButtonPrimary>}
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <FormLabel htmlFor={switchId} style={{ fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '5px' }}>
          Lifecycle Rules:
        </FormLabel>
        <Switch
          onLabel=''
          offLabel=''
          onChange={(checked: boolean) => {
            setLifecycleRulesEnabled(checked);
          }}
          id={switchId}
          checked={lifecycleRulesEnabled}
          width={40}
          height={20}
        />
      </div>
      <div style={{ marginTop: '5px', fontSize: '12px' }}>
        This setting allows you to automatically delete objects in the bucket a certain number of days after they are
        uploaded to the bucket. You can limit the deletion to objects that start with one or more prefixes.
      </div>
      <div style={{ marginTop: '10px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FormLabel style={{ marginRight: '5px' }} htmlFor={daysId}>
            Deletion age (in days):
          </FormLabel>
          <NumberInput
            style={{ maxWidth: '100px' }}
            id={daysId}
            min={0}
            isClearable={false}
            onlyInteger
            value={lifecycleAge}
            disabled={!lifecycleRulesEnabled}
            onChange={(value: number) => setLifecycleAge(value)}
          />
        </div>
        <div style={{ marginTop: '5px', marginBottom: '5px' }}>Prefix scoping rules:</div>
        <CreatableSelect
          isClearable
          isMulti
          isSearchable
          placeholder='Choose "All Objects" or specify prefixes'
          aria-label='Filter by access levels'
          value={_.map((value) => ({ value, label: value }), prefixes)}
          onChange={(data) => {
            const selectedPrefixes = _.map('value', data);
            // If added "All Objects", clear the others.
            if (_.contains(allObjects, selectedPrefixes) && !_.contains(allObjects, prefixes)) {
              setPrefixes([allObjects]);
            } else if (selectedPrefixes.length > 1) {
              setPrefixes(_.without([allObjects], selectedPrefixes));
            } else {
              setPrefixes(selectedPrefixes);
            }
          }}
          options={prefixOptions()}
          isDisabled={!lifecycleRulesEnabled}
        />
      </div>
      {loading && <SpinnerOverlay />}
    </Modal>
  );
};

export default SettingsModal;
