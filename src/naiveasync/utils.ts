/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeEvent } from "react";
import { naiveAsyncInitialState, AsyncState } from "./actions";

/**
 * helper function to return the default initial AsyncableState
 * @param {P} params - params provided to function
 */
export const mockInitialAsyncState: () => AsyncState<any, any> = () => ({
  ...naiveAsyncInitialState,
});

/**
 * helper function to return a 'pending' status AsyncableState
 * @param {P} params - params provided to function
 */
export const mockPendingAsyncState: <P extends {}>(
  mockParams: P,
) => AsyncState<any, P> = (params) => ({
  ...naiveAsyncInitialState,
  status: "pending",
  params,
});

/**
 * helper function to return an 'error' status AsyncableState
 * @param {string} error - error string returned to the function
 */
export const mockErrorAsyncState: (error: string) => AsyncState<any, any> = (
  error,
) => ({
  ...naiveAsyncInitialState,
  status: "error",
  error,
});

/**
 * helper function to return a 'success' status AsyncableState
 * @param {D} data - data returned to the function
 * @param {P} params - params provided to function
 */
export const mockSuccessAsyncState: <D, P extends {}>(
  data: D,
  params: P,
) => AsyncState<D, P> = (data, params) => ({
  ...naiveAsyncInitialState,
  status: "success",
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
  error: string,
) => Array<AsyncState<D, P>> = (data, params, error) => [
  mockInitialAsyncState(),
  mockPendingAsyncState(params),
  mockErrorAsyncState(error),
  mockSuccessAsyncState(data, params),
];

export const handleChangeEvent =
  (handler: (s: string) => void) => (e: ChangeEvent) => {
    const element = e.currentTarget as HTMLInputElement;
    handler(element.value);
    return;
  };

export const handleChangeNumberEvent =
  (handler: (s: number) => void) => (e: ChangeEvent) => {
    const element = e.currentTarget as HTMLInputElement;
    const value = parseInt(element.value, 10);
    if (isNaN(value)) {
      return;
    }
    handler(value);
    return;
  };
