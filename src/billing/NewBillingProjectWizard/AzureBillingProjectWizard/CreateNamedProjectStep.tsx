import { useUniqueId } from '@terra-ui-packages/components';
import { ButtonPrimary, Icon } from '@terra-ui-packages/components';
import React, { CSSProperties, ReactNode } from 'react';
import {
  columnEntryStyle,
  hintStyle,
  rowStyle,
} from 'src/billing/NewBillingProjectWizard/AzureBillingProjectWizard/styles';
import { ExternalLink } from 'src/billing/NewBillingProjectWizard/StepWizard/ExternalLink';
import { Step } from 'src/billing/NewBillingProjectWizard/StepWizard/Step';
import { LabeledField, StepFieldLegend, StepFields } from 'src/billing/NewBillingProjectWizard/StepWizard/StepFields';
import { StepHeader } from 'src/billing/NewBillingProjectWizard/StepWizard/StepHeader';
import { ValidatedInput } from 'src/components/input';
import colors from 'src/libs/colors';
import { formHint } from 'src/libs/forms';

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

  return (
    <div style={flexRow}>
      <div style={rowEntry}>
        <Icon icon='warning-standard' size={16} style={{ marginRight: '0.5rem', color: colors.warning() }} />
        <div>
          {
            'A Terra on Azure Billing Project has a starting cost of $10-15/day, depending on the region you select, and increases with usage. '
          }
          <ExternalLink
            url='https://support.terra.bio/hc/en-us/articles/12029087819291'
            text='Learn more and follow changes'
          />
        </div>
      </div>
      <div style={rowEntry}>
        <Icon icon='clock' size={16} style={{ marginRight: '0.5rem' }} />
        <div>It may take up to 15 minutes for the billing project to be fully created and ready for use.</div>
      </div>
    </div>
  );
};

export const CreateNamedProjectStep = ({ isActive, ...props }: CreateProjectStepProps) => {
  const nameInputId = useUniqueId();

  return (
    <Step isActive={isActive}>
      <StepHeader title='STEP 4' />
      <StepFields style={{ flexDirection: 'column' }}>
        <StepFieldLegend style={{ width: '90%' }}>Name your Terra Billing Project</StepFieldLegend>
        <div style={rowStyle}>
          <div style={{ ...columnEntryStyle(true), marginBottom: '1.25rem' }}>
            <LabeledField label='Billing project name' formId={nameInputId} required>
              <ValidatedInput
                error={props.projectNameErrors}
                inputProps={{
                  id: nameInputId,
                  value: props.billingProjectName,
                  placeholder: 'Enter a name for the project',
                  onChange: props.onBillingProjectNameChanged,
                  onFocus: props.onBillingProjectInputFocused,
                }}
              />
            </LabeledField>
            {!props.projectNameErrors && (
              <div style={hintStyle}>{formHint('Name must be unique and cannot be changed')}</div>
            )}
          </div>
          <div style={columnEntryStyle(false)} /> {/* Empty div to match layout of other steps */}
        </div>
        <div style={rowStyle}>
          <AzureCostWarnings />
          <ButtonPrimary role='button' disabled={!props.createReady} onClick={props.createBillingProject}>
            Create Terra Billing Project
          </ButtonPrimary>
        </div>
      </StepFields>
    </Step>
  );
};
