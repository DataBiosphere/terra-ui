import type { ClickableProps } from "./Clickable";

type LinkProps<T extends keyof JSX.IntrinsicElements> = {
  variant?: "light";
  baseColor?: () => string;
} & ClickableProps<T>;

export const Link: <T extends keyof JSX.IntrinsicElements = "a">(props: LinkProps<T>) => JSX.Element;
