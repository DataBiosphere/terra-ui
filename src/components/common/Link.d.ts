import type { ClickableProps } from './Clickable';

type LinkProps = {
  variant?: 'light';
  baseColor?: () => string;
} & ClickableProps;

export const Link: (props: LinkProps) => JSX.Element;
