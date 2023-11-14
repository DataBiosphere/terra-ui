import _ from 'lodash/fp';
import React, { ReactNode } from 'react';
import { LabeledCheckbox } from 'src/components/common';

interface InterestInTerraCheckboxProps {
  title: string;
  interestInTerra: string;
  onChange: (value: string) => void;
}

export const InterestInTerraCheckbox = (props: InterestInTerraCheckboxProps): ReactNode => {
  const { title, interestInTerra, onChange } = props;
  return (
    <div style={{ marginTop: '.25rem' }}>
      <LabeledCheckbox
        checked={_.includes(title, interestInTerra)}
        onChange={(v: boolean) => {
          const interestsList = _.isEmpty(interestInTerra) ? [] : _.split(',', interestInTerra);
          const updatedInterestsList = v ? _.concat(interestsList, [title]) : _.without([title], interestsList);
          onChange(_.join(',', updatedInterestsList));
        }}
      >
        <span style={{ marginLeft: '0.5rem' }}>{title}</span>
      </LabeledCheckbox>
    </div>
  );
};
