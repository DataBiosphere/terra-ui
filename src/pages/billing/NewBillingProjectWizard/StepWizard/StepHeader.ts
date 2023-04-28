import { PropsWithChildren } from "react";
import { h3, header } from "react-hyperscript-helpers";

type StepHeaderProps = PropsWithChildren<{
  title: React.ReactNode;
  style?: React.CSSProperties;
}>;

export const StepHeader = ({ title, style }: StepHeaderProps) =>
  header({ style: { width: "100%", display: "flex", flexDirection: "row", ...style } }, [
    h3({ style: { fontSize: 18, marginTop: 0, marginRight: "1rem" } }, [title]),
  ]);
