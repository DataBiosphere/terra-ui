import { ExternalLink, Select, useUniqueId } from '@terra-ui-packages/components';
import _ from 'lodash/fp';
import { CSSProperties, ReactNode, useState } from 'react';
import { div, h, p, span } from 'react-hyperscript-helpers';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { LabeledCheckbox } from 'src/components/common';

export const autodeleteThresholds = {
  Day_1: { days: '1', minutes: 60 * 24 * 1 },
  Day_3: { days: '3', minutes: 60 * 24 * 3 },
  Day_7: { days: '7', minutes: 60 * 24 * 7 },
  Day_15: { days: '15', minutes: 60 * 24 * 15 },
};

export const getautodeleteThresholdLabel = (key) =>
  _.has(key, autodeleteThresholds)
    ? `Idle for ${autodeleteThresholds[key].days} day(s)`
    : 'Unknown autodelete threshold';

export interface AutodeleteConfigurationProps {
  disabled?: boolean;
  autodeleteRequired: boolean;
  autodeleteThreshold: string;
  autodeleteThresholdOptions?: string[];
  style?: CSSProperties;
  onChangeAutodeleteThreshold: (autodeleteThreshold: string) => void;
}

export const AutodeleteConfiguration = (props: AutodeleteConfigurationProps): ReactNode => {
  const {
    disabled = false,
    autodeleteRequired = false,
    autodeleteThreshold,
    autodeleteThresholdOptions = Object.keys(autodeleteThresholds),
    style,
    onChangeAutodeleteThreshold,
  } = props;

  const [autodeleteEnabled, setautodeleteEnabled] = useState(true);

  const id = useUniqueId();

  return div({ style }, [
    p(['About Autodelete']),
    p([
      'Enabling autodelete minimizes cost. Your machine will be deleted after the specified time runs out. Please note: If you’ve enabled autodelete, your persistent disk will remain intact, allowing access to data stored on it. When deploying another machine, the persistent disk can be attached to the new machine, beginning where you left off.',
    ]),
    h(
      ExternalLink,
      {
        style: { marginLeft: '1rem', verticalAlign: 'bottom' },
        href: 'TBD Article',
      },
      ['Learn more about autodelete.']
    ),
    h(
      LabeledCheckbox,
      {
        id: `${id}-enable`,
        checked: autodeleteEnabled,
        disabled: disabled || autodeleteRequired,
        onChange: setautodeleteEnabled,
      },
      [span({ style: { ...computeStyles.label } }, ['Enable autodelete'])]
    ),
    div(
      {
        style: {
          display: 'grid',
          alignItems: 'center',
          gridGap: '0.7rem',
          gridTemplateColumns: '4.5rem 9.5rem',
          marginTop: '0.75rem',
        },
      },
      [
        h(Select<AutodeleteConfigurationProps['autodeleteThreshold']>, {
          id,
          isDisabled: disabled || autodeleteRequired || !autodeleteEnabled,
          isSearchable: false,
          isClearable: false,
          value: autodeleteThreshold,
          onChange: (selectedOption) => {
            if (selectedOption) {
              onChangeAutodeleteThreshold(selectedOption.value);
            }
          },
          options: autodeleteThresholdOptions,
          getOptionLabel: ({ value }) => getautodeleteThresholdLabel(value),
        }),
      ]
    ),
  ]);
};
