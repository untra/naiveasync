/* eslint-disable @typescript-eslint/no-explicit-any */
import { naiveAsyncInitialState, NaiveAsyncState } from "./actions";

/**
 * helper function to return the default initial AsyncableState
 * @param {P} params - params provided to function
 */
export const mockInitialAsyncState: () => NaiveAsyncState<any, any> = () => ({
  ...naiveAsyncInitialState,
});

/**
 * helper function to return an 'inflight' status AsyncableState
 * @param {P} params - params provided to function
 */
export const mockInflightAsyncState: <P extends {}>(
  mockParams: P
) => NaiveAsyncState<any, P> = (params) => ({
  ...naiveAsyncInitialState,
  status: "inflight",
  params,
});

/**
 * helper function to return an 'error' status AsyncableState
 * @param {string} error - error string returned to the function
 */
export const mockErrorAsyncState: (error: string) => NaiveAsyncState<any, any> =
  (error) => ({
    ...naiveAsyncInitialState,
    status: "error",
    error,
  });

/**
 * helper function to return an 'done' status AsyncableState
 * @param {D} data - data returned to the function
 * @param {P} params - params provided to function
 */
export const mockDoneAsyncState: <D, P extends {}>(
  data: D,
  params: P
) => NaiveAsyncState<D, P> = (data, params) => ({
  ...naiveAsyncInitialState,
  status: "done",
  data,
  params,
});

/**
 * helper function to return all four mocked async states given the appropriate mocks
 * @param {D} data - data returned to the function
 * @param {P} params - params provided to function
 * @param {string} error - string error object returned by the function
 */
export const mockedAsyncStates: <D, P extends {}>(
  data: D,
  params: P,
  error: string
) => Array<NaiveAsyncState<D, P>> = (data, params, error) => [
  mockInitialAsyncState(),
  mockInflightAsyncState(params),
  mockErrorAsyncState(error),
  mockDoneAsyncState(data, params),
];
