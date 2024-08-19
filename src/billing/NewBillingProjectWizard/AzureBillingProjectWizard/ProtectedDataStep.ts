import React from 'react';
import { div, h, p, span } from 'react-hyperscript-helpers';
import { columnStyle } from 'src/billing/NewBillingProjectWizard/AzureBillingProjectWizard/styles';
import { ExternalLink } from 'src/billing/NewBillingProjectWizard/StepWizard/ExternalLink';
import {
  LabeledRadioButton,
  LabeledRadioGroup,
} from 'src/billing/NewBillingProjectWizard/StepWizard/LabeledRadioButton';
import { Step } from 'src/billing/NewBillingProjectWizard/StepWizard/Step';
import {
  legendDetailsStyle,
  StepFieldLegend,
  StepFields,
} from 'src/billing/NewBillingProjectWizard/StepWizard/StepFields';
import { StepHeader } from 'src/billing/NewBillingProjectWizard/StepWizard/StepHeader';

interface ProtectedDataStepProps {
  isActive: boolean;
  protectedData?: boolean;
  onSetProtectedData: (boolean) => void;
}

export const ProtectedDataStep = (props: ProtectedDataStepProps) => {
  return h(Step, { isActive: props.isActive, style: { minHeight: '16.5rem', paddingBottom: '0.5rem' } }, [
    h(StepHeader, { title: 'STEP 2' }),
    h(StepFields, { style: { flexDirection: 'column' } }, [
      h(StepFieldLegend, { style: { width: '100%' } }, [
        'Will you be working with data that requires additional security monitoring?',
      ]),
      p({ style: { ...legendDetailsStyle, width: '95%' } }, [
        span([
          'Additional security monitoring is intended to fulfill requirements you may have for data governed by a compliance standard, such as federal controlled-access data or HIPAA protected data. ' +
            'Please note this will incur additional usage cost.',
        ]),
        span({ style: { display: 'block' } }, [
          ExternalLink({
            text: 'Read more about Terra security and policy',
            url: 'https://support.terra.bio/hc/en-us/articles/360030793091',
          }),
        ]),
      ]),
      div({ style: columnStyle }, [
        h(LabeledRadioGroup, { style: { marginTop: 0, marginBottom: 0 } }, [
          LabeledRadioButton({
            text: 'Yes, set up my environment with additional security monitoring',
            name: 'protected-data',
            checked: !!props.protectedData,
            onChange: (changed: React.ChangeEvent<HTMLInputElement>) => {
              props.onSetProtectedData(changed.target.checked);
            },
          }),
          LabeledRadioButton({
            text: 'No',
            name: 'protected-data',
            onChange: (changed: React.ChangeEvent<HTMLInputElement>) => {
              props.onSetProtectedData(!changed.target.checked);
            },
          }),
        ]),
      ]),
    ]),
  ]);
};
