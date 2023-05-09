import { CSSProperties, PropsWithChildren, ReactNode } from 'react';
import { div, fieldset, h, legend } from 'react-hyperscript-helpers';
import { FormLabel } from 'src/libs/forms';

type StepFieldsProps = PropsWithChildren<{
  style?: CSSProperties;
}>;

export const StepFields = ({ children, style, disabled = false }: StepFieldsProps & { disabled?: boolean }) =>
  fieldset(
    {
      disabled,
      style: {
        border: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignContent: 'center',
        width: '100%',
        ...style,
      },
    },
    [children]
  );

const primaryStepTextStyle = {
  fontSize: '1rem',
  lineHeight: '22px',
  whiteSpace: 'pre-wrap',
  marginTop: '0.25rem',
  marginRight: '1rem',
  float: 'left',
};

export const legendDetailsStyle = { fontSize: '.875rem', lineHeight: '22px' };

export const StepFieldLegend = ({ children, style }: StepFieldsProps) =>
  legend(
    {
      style: { ...(primaryStepTextStyle as CSSProperties), ...style },
    },
    [children]
  );

// An alternative to StepFieldLegend that will render in the same way, but is not expected to be inside
// a fieldset.
export const StepInfo = ({ children, style }: StepFieldsProps) =>
  div(
    {
      style: { ...(primaryStepTextStyle as CSSProperties), ...style },
    },
    [children]
  );

interface LabeledFieldProps extends StepFieldsProps {
  formId: string;
  label: ReactNode;
  required?: boolean;
}

export const LabeledField = ({ label, formId, required = false, children, style }: LabeledFieldProps) =>
  div({ style: { display: 'flex', flexDirection: 'column', ...style } }, [
    h(FormLabel, { htmlFor: formId, required }, [label]),
    children,
  ]);
