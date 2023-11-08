import _ from 'lodash/fp';
import React from 'react';
import { LabeledCheckbox } from 'src/components/common';

interface InterestInTerraCheckboxProps {
  title: string;
  interestInTerra: string;
  setFunc: (interest: string) => void;
}

export const InterestInTerraCheckbox = (props: InterestInTerraCheckboxProps) => (
  <div style={{ marginTop: '.25rem' }}>
    <LabeledCheckbox
      checked={_.includes(props.title, props.interestInTerra)}
      disabled={false}
      onChange={(v: string) => {
        const interestsList = _.isEmpty(props.interestInTerra) ? [] : _.split(',', props.interestInTerra);
        const updatedInterestsList = v
          ? _.concat(interestsList, [props.title])
          : _.without([props.title], interestsList);
        props.setFunc(_.join(',', updatedInterestsList));
      }}
    >
      <span style={{ marginLeft: '0.5rem' }}>{props.title}</span>
    </LabeledCheckbox>
  </div>
);
