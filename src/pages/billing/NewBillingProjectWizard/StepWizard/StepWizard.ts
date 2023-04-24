import { PropsWithChildren } from "react";
import { div, h2, section, ul } from "react-hyperscript-helpers";

export type StepWizardProps = PropsWithChildren<{
  title: string;
  intro: string;
}>;

export const StepWizard = ({ children, title, intro }: StepWizardProps) => {
  return section({ style: { padding: "1.5rem 3rem", width: "100%" } }, [
    h2({ style: { fontWeight: "bold", fontSize: 18 } }, [title]),
    div({ style: { marginTop: "0.5rem", fontSize: 14, padding: 0, listStyleType: "none", width: "100%" } }, [intro]),
    ul({ style: { padding: 0 } }, [children]),
  ]);
};
