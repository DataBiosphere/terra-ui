declare module '*.jpg' {
  const value: string;
  export = value;
}

declare module '*.png' {
  const value: string;
  export = value;
}

declare module '*.svg' {
  export const ReactComponent: JSX.IntrinsicElements<'svg'>;
  const value: string;
  export = value;
}
