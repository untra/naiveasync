/* eslint-disable @typescript-eslint/no-explicit-any */
import { Reducer } from "redux";
import {
  AnyAction,
  isAsyncAction,
  isAsyncState,
  asyncableEmoji,
  naiveAsyncInitialState,
  AsyncState,
} from "./actions";

const callReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction,
) =>
  isAsyncAction(action) && action[asyncableEmoji].phase === "call"
    ? {
        ...state,
        status: "pending",
        params: action.payload,
        data: null,
        error: "",
      }
    : state;

const syncReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction,
) => {
  if (isAsyncAction(action) && action[asyncableEmoji].phase === "sync") {
    const params = action.payload === undefined ? state.params : action.payload;
    return {
      ...state,
      status: "pending",
      params,
    };
  }
  return state;
};

const dataReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction,
) =>
  isAsyncAction(action) && action[asyncableEmoji].phase === "data"
    ? {
        ...state,
        data: action.payload,
        error: "",
      }
    : state;

const errorReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction,
) => {
  if (isAsyncAction(action) && action[asyncableEmoji].phase === "error") {
    const isError = (a: Error | any): a is Error => a instanceof Error;
    const error: string = isError(action.payload)
      ? action.payload.message
      : typeof action.payload === "object"
        ? JSON.stringify(action.payload)
        : action.payload;
    return {
      ...state,
      status: "error",
      error,
    };
  }
  return state;
};

const successReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction,
) =>
  isAsyncAction(action) && action[asyncableEmoji].phase === "success"
    ? {
        ...state,
        status: "success",
        error: "",
      }
    : state;

const resetReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction,
) =>
  isAsyncAction(action) && action[asyncableEmoji].phase === "reset"
    ? naiveAsyncInitialState
    : state;

export const chain =
  <S>(
    firstReducer: Reducer<S, AnyAction>,
    ...reducers: Array<Reducer<S, AnyAction>>
  ): Reducer<S, AnyAction> =>
  (state: any, action: any) =>
    reducers.reduce(
      (accumulatedState, nextReducer) => nextReducer(accumulatedState, action),
      firstReducer(state, action),
    );

const assignReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction,
) =>
  isAsyncAction(action) &&
  action[asyncableEmoji].phase === "assign" &&
  isAsyncState(action.payload)
    ? action.payload
    : state;

export const asyncStateReducer = chain(
  callReducer,
  syncReducer,
  dataReducer,
  errorReducer,
  successReducer,
  resetReducer,
  assignReducer,
);
