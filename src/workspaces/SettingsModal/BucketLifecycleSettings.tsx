import { CreatableSelect, ExternalLink, Switch, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import React, { ReactNode } from 'react';
import { NumberInput } from 'src/components/input';
import { FormLabel } from 'src/libs/forms';
import { suggestedPrefixes } from 'src/workspaces/SettingsModal/utils';

interface BucketLifecycleSettingsProps {
  lifecycleRulesEnabled: boolean;
  setLifecycleRulesEnabled: (enabled: boolean) => void;
  lifecycleAge: number | null;
  setLifecycleAge: (age: number | null) => void;
  prefixes: string[];
  setPrefixes: (prefixes: string[]) => void;
  isOwner: boolean;
}

const BucketLifecycleSettings = (props: BucketLifecycleSettingsProps): ReactNode => {
  const {
    lifecycleRulesEnabled,
    setLifecycleRulesEnabled,
    lifecycleAge,
    setLifecycleAge,
    prefixes,
    setPrefixes,
    isOwner,
  } = props;

  const switchId = useUniqueId('switch');
  const daysId = useUniqueId('days');
  const descriptionId = useUniqueId('description');

  const prefixOptions = () => {
    // Append together suggested options and any options the user has already selected.
    const allOptions = _.uniq(_.concat(_.values(suggestedPrefixes), prefixes));
    return _.map((value) => ({ value, label: value }), allOptions);
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '.75rem' }}>
        <FormLabel
          htmlFor={switchId}
          style={{ fontWeight: 600, whiteSpace: 'nowrap', marginRight: '.5rem', marginTop: '.5rem' }}
        >
          Lifecycle Rules:
        </FormLabel>
        <Switch
          onLabel=''
          offLabel=''
          onChange={(checked: boolean) => {
            setLifecycleRulesEnabled(checked);
            if (!checked) {
              // Clear out the values being display to reduce confusion
              setLifecycleAge(null);
              setPrefixes([]);
            }
          }}
          id={switchId}
          checked={lifecycleRulesEnabled}
          width={40}
          height={20}
          aria-describedby={descriptionId}
          disabled={!isOwner}
        />
      </div>
      <div style={{ marginTop: '.5rem', marginBottom: '.5rem' }}>
        <div style={{ marginTop: '.75rem', marginBottom: '.5rem' }}>Delete objects in:</div>
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
        <label style={{ marginRight: '.25rem' }} htmlFor={daysId}>
          Days after creation:
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
      <div id={descriptionId} style={{ marginTop: '.5rem', fontSize: '12px' }}>
        This{' '}
        <ExternalLink href='https://cloud.google.com/storage/docs/lifecycle'>bucket lifecycle setting</ExternalLink>{' '}
        automatically deletes objects a certain number of days after they are uploaded.{' '}
        <span style={{ fontWeight: 'bold' }}>Changes can take up to 24 hours to take effect.</span>
      </div>
    </>
  );
};

export default BucketLifecycleSettings;
