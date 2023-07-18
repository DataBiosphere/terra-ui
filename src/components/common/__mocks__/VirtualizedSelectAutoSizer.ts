type MockAutoSizerProps = {
  children: (size: { width: number }) => JSX.Element;
};

export const AutoSizer = (props: MockAutoSizerProps) => {
  const { children } = props;
  return children({ width: 300 });
};
