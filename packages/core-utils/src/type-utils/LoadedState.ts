export interface NoneState {
  status: 'None';
}

export interface LoadingState<S> {
  status: 'Loading';
  state: S | null;
}

export interface ReadyState<S> {
  status: 'Ready';
  state: S;
}

export interface ErrorState<S, E = Error> {
  status: 'Error';
  state: S | null;
  error: E;
}

export type LoadedState<S, E = Error> = NoneState | LoadingState<S> | ReadyState<S> | ErrorState<S, E>;
