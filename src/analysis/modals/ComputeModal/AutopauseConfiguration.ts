import { ExternalLink, useUniqueId } from '@terra-ui-packages/components';
import { cond } from '@terra-ui-packages/core-utils';
import { CSSProperties, ReactNode } from 'react';
import { div, h, label, p, span } from 'react-hyperscript-helpers';
import { computeStyles } from 'src/analysis/modals/modalStyles';
import { getAutopauseThreshold, isAutopauseEnabled } from 'src/analysis/utils/runtime-utils';
import { LabeledCheckbox } from 'src/components/common';
import { NumberInput } from 'src/components/input';

export interface AutopauseConfigurationProps {
  autopauseRequired?: boolean;
  autopauseThreshold: number;
  disabled?: boolean;
  maxThreshold?: number;
  minThreshold?: number;
  style?: CSSProperties;
  onChangeAutopauseThreshold: (autopauseThreshold: number) => void;
}

export const AutopauseConfiguration = (props: AutopauseConfigurationProps): ReactNode => {
  const {
    autopauseRequired = false,
    autopauseThreshold,
    disabled = false,
    maxThreshold = undefined,
    minThreshold = 10,
    style,
    onChangeAutopauseThreshold,
  } = props;

  const id = useUniqueId();

  return div({ style }, [
    h(
      LabeledCheckbox,
      {
        id: `${id}-enable`,
        checked: isAutopauseEnabled(autopauseThreshold),
        disabled: disabled || autopauseRequired,
        onChange: (v) => onChangeAutopauseThreshold(getAutopauseThreshold(v)),
      },
      [span({ style: { ...computeStyles.label } }, ['Enable autopause'])]
    ),
    h(
      ExternalLink,
      {
        style: { marginLeft: '1rem', verticalAlign: 'bottom' },
        href: 'https://support.terra.bio/hc/en-us/articles/360029761352-Preventing-runaway-costs-with-Cloud-Environment-autopause-#h_27c11f46-a6a7-4860-b5e7-fac17df2b2b5',
      },
      ['Learn more about autopause.']
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
        h(NumberInput, {
          id: `${id}-threshold`,
          min: minThreshold,
          max: maxThreshold || 999,
          isClearable: false,
          onlyInteger: true,
          disabled,
          value: autopauseThreshold,
          hidden: !isAutopauseEnabled(autopauseThreshold),
          tooltip: !isAutopauseEnabled(autopauseThreshold)
            ? 'Autopause must be enabled to configure pause time.'
            : undefined,
          onChange: (v) => onChangeAutopauseThreshold(Number(v)),
          'aria-describedby': `${id}-threshold-description`,
          'aria-label': 'Minutes of inactivity before autopausing',
        }),
        label(
          {
            htmlFor: `${id}-threshold`,
            hidden: !isAutopauseEnabled(autopauseThreshold),
          },
          ['minutes of inactivity']
        ),
      ]
    ),
    isAutopauseEnabled(autopauseThreshold) &&
      (minThreshold !== undefined || maxThreshold !== undefined) &&
      p(
        {
          id: `${id}-threshold-description`,
        },
        [
          'Choose a duration ',
          cond(
            [minThreshold !== undefined && maxThreshold === undefined, () => `of ${minThreshold} minutes or more.`],
            [minThreshold === undefined && maxThreshold !== undefined, () => `of ${maxThreshold} minutes or less.`],
            () => `between ${minThreshold} and ${maxThreshold} minutes.`
          ),
        ]
      ),
  ]);
};
