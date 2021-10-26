/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch } from "redux";
import { KeyedCache } from "./keyedcache";

/** 🔁  */
export const naiveAsyncEmoji = "🔁";

/** 🔁  */
export const asyncableEmoji = "🔁";

/** the phase state of the naiveAsync lifecycle */
export type AsyncPhase =
  | "call"
  | "data"
  | "error"
  | "done"
  | "destroy"
  | "reset"
  | "sync"
  | "assign"
  | "subscribe";

interface AsyncPostmark {
  name: string;
  phase: AsyncPhase;
}

/** a function that takes a singular params object P, returning a Promise<D> */
export type NaiveAsyncFunction<Data, Params> = (
  params: Params
) => Promise<Data>;

/** a function that takes a singular params object P, returning a Promise<D> */
export type AsyncFunction<Params, Data> = (params: Params) => Promise<Data>;

/**
 * A typical redux action, templating a payload
 * @export
 * @interface Action
 * @template Payload
 */
export interface Action<Payload> {
  type: string;
  payload: Payload;
}

/**
 * A type interchangeable with a typical redux action
 * @export
 * @interface AnyAction
 */
export interface AnyAction {
  type: string;
  payload?: any;
}

/**
 * AsyncAction<Payload> is an action tracking an asychronous process (one we manage)
 * @export
 * @interface AsyncAction
 * @extends {Action<Payload>}
 * @template Payload
 */
export interface AsyncAction<Payload> extends Action<Payload> {
  readonly type: string;
  readonly payload: Payload;
  readonly [naiveAsyncEmoji]: AsyncPostmark;
}

/**
 * isAsyncAction typeGuards AsyncAction<any>
 * @param {AnyAction} action
 * @returns {action is AsyncAction<any>}
 */
export const isAsyncAction = (action: AnyAction): action is AsyncAction<any> =>
  naiveAsyncEmoji in action;

const asyncActionMatchesPhase = (
  action: AsyncAction<any>,
  phase?: AsyncPhase
) => !!(!phase || action[naiveAsyncEmoji].phase === phase);

const asyncActionMatchesOperation = (
  action: AsyncAction<any>,
  operation?: NaiveAsyncFunction<any, any>
) =>
  !operation ||
  (operation.name && operation.name === action[naiveAsyncEmoji].name);

/**
 * an action matcher typeguard for a given operation and phase
 * @export
 * @template Data
 * @template Params
 * @param {(NaiveAsyncFunction<Data, Params> | undefined)} operation
 * @param {AsyncPhase | undefined} phase
 * @returns {(action: AnyAction) => action is AsyncAction<any>}
 */
export function asyncActionMatcher<Data extends any, Params extends {}>(
  operation: NaiveAsyncFunction<Data, Params> | undefined,
  phase: "call"
): (action: AnyAction) => action is AsyncAction<Params>;

export function asyncActionMatcher<Data, Params extends {}>(
  operation: NaiveAsyncFunction<Data, Params> | undefined,
  phase: "sync"
): (action: AnyAction) => action is AsyncAction<Params>;

export function asyncActionMatcher<Data, Params extends {}>(
  operation: NaiveAsyncFunction<Data, Params> | undefined,
  phase: "data"
): (action: AnyAction) => action is AsyncAction<Data>;

export function asyncActionMatcher<Data, Params extends {}>(
  operation: NaiveAsyncFunction<Data, Params> | undefined,
  phase: "error"
): (action: AnyAction) => action is AsyncAction<string>;
export function asyncActionMatcher<Data, Params extends {}>(
  operation: NaiveAsyncFunction<Data, Params> | undefined,
  phase: "reset"
): (action: AnyAction) => action is AsyncAction<{}>;
export function asyncActionMatcher<Data, Params>(
  operation?: NaiveAsyncFunction<Data, Params>,
  phase?: AsyncPhase
): (action: AnyAction) => action is AsyncAction<Params>;
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function asyncActionMatcher<Data, Params>(
  operation?: NaiveAsyncFunction<Data, Params>,
  phase?: AsyncPhase
) {
  return (action: AnyAction) =>
    isAsyncAction(action) &&
    asyncActionMatchesPhase(action, phase) &&
    asyncActionMatchesOperation(action, operation);
}

export type AsyncActionCreator<Payload> = (payload?: Payload) => {
  /** Full type constant for actions created by this function, `eagle/myFunction/call`. */
  readonly type: string;
  /** Metadata for the owning this. */
  readonly postmark: AsyncPostmark;
  /**
   * Function that returns true iff the given action matches all properties of this action creator's meta.
   * In practice, this can be used to detect actions dispatched for this specific operation and lifecycle event.
   */
  readonly match: (action: Action<any>) => action is AsyncAction<Payload>;
};

export const asyncActionCreatorFactory =
  (name: string) =>
  <Payload>(phase: AsyncPhase): AsyncActionCreator<Payload> => {
    const type = `${naiveAsyncEmoji}/${name}/${phase}`;
    const postmark = { name, phase };
    const guard = asyncActionMatcher(undefined, phase);
    const match = (action: Action<Payload>): action is AsyncAction<Payload> =>
      guard(action) && action[naiveAsyncEmoji].name === name;
    const actionCreator: AsyncActionCreator<Payload> = (payload?: Payload) => ({
      type,
      postmark,
      match,
      payload,
      [naiveAsyncEmoji]: postmark,
    });
    return actionCreator;
  };

/**
 * Any redux store that implements usage of AsyncableState keyed to the AsyncableSymbol, use to typeguard implementations
 * @export
 * @interface AsyncableSlice
 * @deprecated favor AsyncableSlice instead
 */
export interface NaiveAsyncSlice {
  [naiveAsyncEmoji]: { [key: string]: AsyncState<any, any> };
}

/**
 * Any redux store that implements usage of AsyncableState keyed to the AsyncableSymbol, use to typeguard implementations
 * @export
 * @interface AsyncableSlice
 */
export type AsyncableSlice = NaiveAsyncSlice;

export interface Gettable {
  get: (a: any) => any;
}

export const isGettable = (x: any): x is Gettable =>
  "get" in x && typeof x.get === "function";

export type AsyncableStateStatus = "" | "inflight" | "error" | "done";

/** the initial state of a naiveasync operation */
export interface InitialAsyncState {
  status: "";
  error: "";
  params: {};
  data: null;
}

/** the inflight state of a naiveasync operation */
interface InflightAsyncState<Data, Params> {
  status: "inflight";
  error: "" | string;
  params: {} | Params;
  data: null | Data;
}

/** the error state of a naiveasync operation */
interface ErrorAsyncState<Data, Params> {
  status: "error";
  error: "" | string;
  params: {} | Params;
  data: null | Data;
}

/** the done state of a naiveasync operation */
interface DoneAsyncState<Data, Params> {
  status: "done";
  error: "";
  params: {} | Params;
  data: Data;
}

/**
 * The state of a NaiveAsyncFunction, encompassing status, params, error, data
 */
export type AsyncState<Data, Params> =
  | InitialAsyncState
  | InflightAsyncState<Data, Params>
  | ErrorAsyncState<Data, Params>
  | DoneAsyncState<Data, Params>;

/**
 * The state of a NaiveAsyncFunction, encompassing status, params, error, data
 * @deprecated favor AsyncState instead
 */
export type NaiveAsyncState<Data, Params> = AsyncState<Data, Params>;

/**
 * isAsyncState typeGuards AsyncState<any>
 * @param {Object} state
 * @returns {state is AsyncState<any,any>}
 */
export const isAsyncState = <D, P>(state: {}): state is AsyncState<D, P> =>
  state !== null &&
  "status" in state &&
  "error" in state &&
  "data" in state &&
  "params" in state;

/** the initial state of a naiveasync operation */
export const naiveAsyncInitialState = Object.freeze({
  status: "",
  error: "",
  params: {},
  data: null,
}) as InitialAsyncState;

type OnCb = () => void;
type OnData1<Data> = (data: Data) => void;
type OnData2<Data> = (data: Data, dispatch: Dispatch<AnyAction>) => void;
type OnError1 = (error: string) => void;
type OnError2 = (error: string, dispatch: Dispatch<AnyAction>) => void;
type ErrRetry1 = (error: any) => void;
type ErrRetry2 = (error: any, retry: number) => void;
export type OnError = OnCb | OnError1 | OnError2;
export type OnData<Data> = OnCb | OnData1<Data> | OnData2<Data>;
export type ErrRetryCb = OnCb | ErrRetry1 | ErrRetry2;

/**
 * Meta information representative of a lifecycle, useful for testing.
 *
 * Async lifecycles manage a number of aspects of the operation and is configured execution.
 * Some of these aspects are recorded in the meta cache, which are not associated with the redux store but used internally to control naiveasync operations.
 * This selection is contextual from the instance when .meta() is called on the lifecycle.
 * @export
 * @interface AsyncMeta
 * @template Data
 * @template Params
 */
export interface AsyncMeta<Data, Params> {
  /** 'debounce' assignment */
  readonly debounce: number;
  /** 'throttle' assignment */
  readonly throttle: number;
  /** 'retries' assignment */
  readonly retries: number;
  /** 'subscribe' assignment (experimental) */
  readonly subscribe: number;
  /** 'subscribe' assignment (experimental) */
  readonly subscribeInterval: any;
  /** 'timeout' assignment. starts at NaN if not yet assigned. */
  readonly timeout: number;
  /** time in ms the operation took to run. starts as NaN if not yet called. */
  readonly record: number;
  /** timestamp when the operation was last run */
  readonly lastCalled: number;
  /** number of times data was returned */
  readonly dataCount: number;
  /** number of times error was returned */
  readonly errorCount: number;
  /** the memoize cache, if its enabled */
  readonly memo?: KeyedCache<Data>;
  /** the last params used to call this operation */
  readonly lastParams?: Params;
  /** 'onData' callback assignment */
  readonly onData?: OnData<Data>;
  /** 'onError' callback assignment */
  readonly onError?: OnError;
  /** retries 'errRetryCb' callback assignment */
  readonly errRetryCb?: ErrRetryCb;
  /** awaiting resolve callback, if the lifecycle is being awaited on */
  readonly awaitResolve?: (value: Data) => void;
  /** awaiting reject callback, if the lifecycle is being awaited on */
  readonly awaitReject?: (reason?: string) => void;
}

export const naiveAsyncInitialMeta = Object.freeze({
  timeout: NaN,
  record: NaN,
  dataCount: 0,
  errorCount: 0,
  lastCalled: 0,
  memo: undefined,
  onData: () => "noop",
  onError: () => "noop",
  errRetryCb: () => "noop",
  lastParams: undefined,
  debounce: 0,
  throttle: 0,
  retries: 0,
  subscribe: 0,
  subscribeInterval: undefined,
}) as AsyncMeta<any, any>;
