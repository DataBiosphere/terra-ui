import { CSSProperties, ReactNode } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { ButtonPrimary, useUniqueId } from 'src/components/common';
import { icon } from 'src/components/icons';
import { ValidatedInput } from 'src/components/input';
import colors from 'src/libs/colors';
import { formHint } from 'src/libs/forms';
import {
  columnEntryStyle,
  hintStyle,
  rowStyle,
} from 'src/pages/billing/NewBillingProjectWizard/AzureBillingProjectWizard/styles';
import { ExternalLink } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/ExternalLink';
import { Step } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/Step';
import {
  LabeledField,
  StepFieldLegend,
  StepFields,
} from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepFields';
import { StepHeader } from 'src/pages/billing/NewBillingProjectWizard/StepWizard/StepHeader';

interface CreateProjectStepProps {
  isActive: boolean;
  billingProjectName: string;
  onBillingProjectNameChanged: (string) => void;
  onBillingProjectInputFocused: (boolean) => void;
  createBillingProject: () => void;
  projectNameErrors: ReactNode;
  createReady: boolean;
}

const AzureCostWarnings = () => {
  const flexRow: CSSProperties = { display: 'flex', flexDirection: 'row' };
  const rowEntry: CSSProperties = { ...flexRow, paddingRight: '20px' };

  return div({ style: flexRow }, [
    div({ style: rowEntry }, [
      icon('warning-standard', { size: 16, style: { marginRight: '0.5rem', color: colors.warning() } }),
      div([
        'Creating a Terra billing project currently costs about $5 per day. ',
        h(ExternalLink, {
          url: 'https://support.terra.bio/hc/en-us/articles/12029087819291',
          text: 'Learn more and follow changes',
        }),
      ]),
    ]),
    div({ style: rowEntry }, [
      icon('clock', { size: 16, style: { marginRight: '0.5rem' } }),
      div(['It may take up to 15 minutes for the billing project to be fully created and ready for use.']),
    ]),
  ]);
};

export const CreateNamedProjectStep = ({ isActive, ...props }: CreateProjectStepProps) => {
  const nameInputId = useUniqueId();

  return h(Step, { isActive }, [
    h(StepHeader, { title: 'STEP 3' }),
    h(StepFields, { style: { flexDirection: 'column' } }, [
      h(StepFieldLegend, { style: { width: '90%' } }, ['Name your Terra Billing Project']),
      div({ style: rowStyle }, [
        div({ style: { ...columnEntryStyle(true), marginBottom: '1.25rem' } }, [
          h(LabeledField, { label: 'Billing project name', formId: nameInputId, required: true }, [
            ValidatedInput({
              error: props.projectNameErrors,
              inputProps: {
                id: nameInputId,
                value: props.billingProjectName,
                placeholder: 'Enter a name for the project',
                onChange: props.onBillingProjectNameChanged,
                onFocus: props.onBillingProjectInputFocused,
              },
            }),
          ]),
          !props.projectNameErrors &&
            div({ style: hintStyle }, [formHint('Name must be unique and cannot be changed')]),
        ]),
        div({ style: columnEntryStyle(false) }, []), // Empty div to match layout of other steps
      ]),
      div({ style: rowStyle }, [
        h(AzureCostWarnings),
        h(ButtonPrimary, { role: 'button', disabled: !props.createReady, onClick: props.createBillingProject }, [
          'Create Terra Billing Project',
        ]),
      ]),
    ]),
  ]);
};
