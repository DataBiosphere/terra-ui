import { Component, PropsWithChildren } from 'react';

export type ErrorBoundaryProps = PropsWithChildren<{
  onError?: (error: unknown) => void;
}>;

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    const { onError } = this.props;
    onError?.(error);
  }

  render() {
    const { children } = this.props;
    const { hasError } = this.state;
    return hasError ? null : children;
  }
}
