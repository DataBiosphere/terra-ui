import {
  ButtonPrimary,
  CreatableSelect,
  ExternalLink,
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
import {
  BucketLifecycleSetting,
  DeleteBucketLifecycleRule,
  isBucketLifecycleSetting,
  isDeleteBucketLifecycleRule,
  modifyFirstBucketDeletionRule,
  removeFirstBucketDeletionRule,
  WorkspaceSetting,
} from 'src/workspaces/SettingsModal/utils';
import { WorkspaceWrapper as Workspace } from 'src/workspaces/utils';

export const suggestedPrefixes = {
  allObjects: 'All Objects',
  submissions: 'submissions/',
  submissionIntermediaries: 'submissions/intermediates/',
};

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

  const switchId = useUniqueId('switch');
  const daysId = useUniqueId('days');

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

  const prefixOptions = () => {
    // Append together suggested options any options the user has added or are already selected.
    const allOptions = _.uniq(_.concat(_.values(suggestedPrefixes), prefixes));
    return _.map((value) => ({ value, label: value }), allOptions);
  };

  const persistSettings = async () => {
    let newSettings;
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
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '6px' }}>
        <FormLabel
          htmlFor={switchId}
          style={{ fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '5px', marginTop: '5px' }}
        >
          Lifecycle Rules:
        </FormLabel>
        <Switch
          onLabel=''
          offLabel=''
          onChange={(checked: boolean) => {
            setLifecycleRulesEnabled(checked);
            if (!checked) {
              // Clear out the values being display to reduce
              setLifecycleAge(null);
              setPrefixes([]);
            }
          }}
          id={switchId}
          checked={lifecycleRulesEnabled}
          width={40}
          height={20}
        />
      </div>

      <div style={{ marginTop: '20px', marginBottom: '10px' }}>
        <div style={{ marginTop: '5px', marginBottom: '5px' }}>Delete objects in:</div>
        <CreatableSelect
          isClearable
          isMulti
          isSearchable
          placeholder='Choose "All Objects" or specify prefixes'
          aria-label='Specify if all objects should be deleted, or objects with specific prefixes'
          value={_.map((value) => ({ value, label: value }), prefixes)}
          onChange={(data) => {
            const selectedPrefixes = _.map('value', data);
            // If added "All Objects", clear the others.
            if (
              _.contains(suggestedPrefixes.allObjects, selectedPrefixes) &&
              !_.contains(suggestedPrefixes.allObjects, prefixes)
            ) {
              setPrefixes([suggestedPrefixes.allObjects]);
            } else if (selectedPrefixes.length > 1) {
              setPrefixes(_.without([suggestedPrefixes.allObjects], selectedPrefixes));
            } else {
              setPrefixes(selectedPrefixes);
            }
          }}
          options={prefixOptions()}
          isDisabled={!lifecycleRulesEnabled}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* eslint-disable jsx-a11y/label-has-associated-control */}
        <label style={{ marginRight: '5px' }} htmlFor={daysId}>
          Days after upload:
        </label>
        <NumberInput
          style={{ maxWidth: '100px' }}
          id={daysId}
          min={0}
          isClearable
          onlyInteger
          value={lifecycleAge}
          disabled={!lifecycleRulesEnabled}
          onChange={(value: number) => {
            setLifecycleAge(value);
          }}
        />
      </div>
      {/* TODO: add aria-described by to link to the setting. */}
      <div style={{ marginTop: '10px', fontSize: '12px' }}>
        This{' '}
        <ExternalLink href='https://cloud.google.com/storage/docs/lifecycle'>bucket lifecycle setting</ExternalLink>{' '}
        automatically deletes objects a certain number of days after they are uploaded.{' '}
        <span style={{ fontWeight: 'bold' }}>Changes can take up to 24 hours to take effect.</span>
      </div>
      {workspaceSettings === undefined && <SpinnerOverlay />}
    </Modal>
  );
};

export default SettingsModal;
