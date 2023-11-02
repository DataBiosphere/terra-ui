import { div, h, p } from 'react-hyperscript-helpers';
import { columnStyle } from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/styles';
import { ExternalLink } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/ExternalLink';
import {
  LabeledRadioButton,
  LabeledRadioGroup,
} from 'src/pages/billing/NewBillingProjectWizard/StepWizard/LabeledRadioButton';
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step';
import {
  legendDetailsStyle,
  StepFieldLegend,
  StepFields,
} from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields';
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader';

interface ProtectedDataStepProps {
  isActive: boolean;
  protectedData?: boolean;
  onSetProtectedData: (boolean) => void;
}

export const ProtectedDataStep = (props: ProtectedDataStepProps) => {
  return h(Step, { isActive: props.isActive, style: { minHeight: '14.0rem', paddingBottom: '0.5rem' } }, [
    h(StepHeader, { title: 'STEP 2' }),
    h(StepFields, { style: { flexDirection: 'column' } }, [
      h(StepFieldLegend, { style: { width: '100%' } }, [
        'Will you be working with protected data? ',
        ExternalLink({ text: 'Read more about Terra security and policy', url: 'TODO' }),
      ]),
      p({ style: { ...legendDetailsStyle, width: '95%' } }, [
        'Clicking Yes will set up your environment with additional security monitoring. Please note this will incur additional usage cost. ',
      ]),
      div({ style: columnStyle }, [
        h(LabeledRadioGroup, { style: { marginTop: 0, marginBottom: 0 } }, [
          LabeledRadioButton({
            text: 'Yes, set up my environment with additional security',
            name: 'protected-data',
            checked: props.protectedData,
            onChange: (changed) => {
              props.onSetProtectedData(changed.target.checked);
            },
          }),
          LabeledRadioButton({
            text: 'No',
            name: 'protected-data',
            onChange: (changed) => {
              props.onSetProtectedData(!changed.target.checked);
            },
          }),
        ]),
      ]),
    ]),
  ]);
};
