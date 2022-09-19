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
  action: AnyAction
) =>
  isAsyncAction(action) && action[asyncableEmoji].phase === "call"
    ? {
        ...state,
        status: "inflight",
        params: action.payload,
        data: null,
        error: "",
      }
    : state;

const syncReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction
) => {
  if (isAsyncAction(action) && action[asyncableEmoji].phase === "sync") {
    const params = action.payload === undefined ? state.params : action.payload;
    return {
      ...state,
      status: "inflight",
      params,
    };
  }
  return state;
};

const dataReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction
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
  action: AnyAction
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

const doneReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction
) =>
  isAsyncAction(action) && action[asyncableEmoji].phase === "done"
    ? {
        ...state,
        status: "done",
        error: "",
      }
    : state;

const resetReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction
) =>
  isAsyncAction(action) && action[asyncableEmoji].phase === "reset"
    ? naiveAsyncInitialState
    : state;

export const chain =
  <S>(firstReducer: Reducer<S>, ...reducers: Array<Reducer<S>>): Reducer<S> =>
  (state: any, action: any) =>
    reducers.reduce(
      (accumulatedState, nextReducer) => nextReducer(accumulatedState, action),
      firstReducer(state, action)
    );

const assignReducer: Reducer<AsyncState<any, any>, AnyAction> = (
  state: AsyncState<any, any> = naiveAsyncInitialState,
  action: AnyAction
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
  doneReducer,
  resetReducer,
  assignReducer
);
