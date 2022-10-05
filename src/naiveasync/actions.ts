/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch } from "redux";
import { KeyedCache } from "./keyedcache";

/** 🔁
 * @deprecated favor asyncableEmoji
 */
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
  trace?: string;
}

/** a function that takes a singular params object P, returning a Promise<D>. This is an async javascript function. */
export type AsyncFunction<Data, Params> = (params: Params) => Promise<Data>;

/**
 * a function that takes a singular params object P, returning a Promise<D>
 * @deprecated favor AsyncFunction instead
 */
export type NaiveAsyncFunction<Data, Params> = AsyncFunction<Data, Params>;

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
  readonly [asyncableEmoji]: AsyncPostmark;
}

/**
 * isAsyncAction typeGuards AsyncAction<any>
 * @param {AnyAction} action
 * @returns {action is AsyncAction<any>}
 */
export const isAsyncAction = (action: AnyAction): action is AsyncAction<any> =>
  asyncableEmoji in action;

const asyncActionMatchesPhase = (
  action: AsyncAction<any>,
  phase?: AsyncPhase
): boolean => !!(!phase || action[asyncableEmoji].phase === phase);

const asyncActionMatchesOperation = (
  action: AsyncAction<any>,
  operation?: AsyncFunction<any, any>
): boolean =>
  !operation ||
  !!(operation.name && operation.name === action[asyncableEmoji].name);

/**
 * an action matcher typeguard for a given operation and phase
 * @export
 * @template Data
 * @template Params
 * @param {(AsyncFunction<Data, Params> | undefined)} operation
 * @param {AsyncPhase | undefined} phase
 * @returns {(action: AnyAction) => action is AsyncAction<any>}
 */
export function asyncActionMatcher<Data extends any, Params extends {}>(
  operation: AsyncFunction<Data, Params> | undefined,
  phase: "call"
): (action: AnyAction) => action is AsyncAction<Params>;

export function asyncActionMatcher<Data, Params extends {}>(
  operation: AsyncFunction<Data, Params> | undefined,
  phase: "sync"
): (action: AnyAction) => action is AsyncAction<Params>;

export function asyncActionMatcher<Data, Params extends {}>(
  operation: AsyncFunction<Data, Params> | undefined,
  phase: "data"
): (action: AnyAction) => action is AsyncAction<Data>;

export function asyncActionMatcher<Data, Params extends {}>(
  operation: AsyncFunction<Data, Params> | undefined,
  phase: "error"
): (action: AnyAction) => action is AsyncAction<string>;
export function asyncActionMatcher<Data, Params extends {}>(
  operation: AsyncFunction<Data, Params> | undefined,
  phase: "reset"
): (action: AnyAction) => action is AsyncAction<{}>;
export function asyncActionMatcher<Data, Params>(
  operation?: AsyncFunction<Data, Params>,
  phase?: AsyncPhase
): (action: AnyAction) => action is AsyncAction<Params>;
export function asyncActionMatcher<Data, Params>(
  operation?: AsyncFunction<Data, Params>,
  phase?: AsyncPhase
) {
  return (action: AnyAction): boolean =>
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

/** removes undefined fields from an object. */
const definedObject = <T extends Record<string, any>>(obj: T): T => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
};

export type AsyncActionCreatorFactory = <Payload>(
  phase: AsyncPhase
) => AsyncActionCreator<Payload>;

/**
 *
 * @param name creates actions that take in a parameter. uses options passed at lifecycle creation
 * @param options
 */
export const asyncActionCreatorFactory =
  (name: string, options: AsyncableOptions): AsyncActionCreatorFactory =>
  <Payload>(phase: AsyncPhase): AsyncActionCreator<Payload> => {
    const type = `${asyncableEmoji}/${name}/${phase}`;
    const postmark = () =>
      definedObject({
        name,
        phase,
        trace: (options.traceDispatch && Error().stack) || undefined,
      });
    const guard = asyncActionMatcher(undefined, phase);
    const match = (action: Action<Payload>): action is AsyncAction<Payload> =>
      guard(action) && action[asyncableEmoji].name === name;
    const actionCreator: AsyncActionCreator<Payload> = (payload?: Payload) => ({
      type,
      postmark: postmark(),
      match,
      payload,
      [asyncableEmoji]: postmark(),
    });
    return actionCreator;
  };

/**
 * Any redux store that implements usage of AsyncableState keyed to the AsyncableSymbol, use to typeguard implementations
 * @export
 * @interface AsyncableSlice
 */
export interface AsyncableSlice {
  [asyncableEmoji]: { [key: string]: AsyncState<any, any> };
}

/**
 * @deprecated favor AsyncableSlice instead
 */
export type NaiveAsyncSlice = AsyncableSlice;

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
 * The state of a AsyncFunction, encompassing status, params, error, data
 */
export type AsyncState<Data, Params> =
  | InitialAsyncState
  | InflightAsyncState<Data, Params>
  | ErrorAsyncState<Data, Params>
  | DoneAsyncState<Data, Params>;

/**
 * The state of a AsyncFunction, encompassing status, params, error, data
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
  state !== undefined &&
  "status" in state &&
  "error" in state &&
  "data" in state &&
  "params" in state;

/** the initial state of a naiveasync operation */
export const asyncInitialState = Object.freeze({
  status: "",
  error: "",
  params: {},
  data: null,
}) as InitialAsyncState;

export const naiveAsyncInitialState = asyncInitialState;

type OnCb = () => void;
export type OnData1<Data> = (data: Data) => void;
type OnData2<Data, Params> = (data: Data, params: Params) => void;
type OnData3<Data, Params> = (
  data: Data,
  params: Params,
  dispatch: Dispatch<AnyAction>
) => void;
type OnError1 = (error: string) => void;
type OnError2<Params> = (error: string, params: Params) => void;
type OnError3<Params> = (
  error: string,
  params: Params,
  dispatch: Dispatch<AnyAction>
) => void;
type ErrRetry1 = (error: any) => void;
type ErrRetry2 = (error: any, retry: number) => void;
export type OnError<_, Params> =
  | OnCb
  | OnError1
  | OnError2<Params>
  | OnError3<Params>;
export type OnData<Data, Params> =
  | OnCb
  | OnData1<Data>
  | OnData2<Data, Params>
  | OnData3<Data, Params>;
export type ErrRetryCb = OnCb | ErrRetry1 | ErrRetry2;

/**
 * Meta information representative of a lifecycle, useful for testing.
 *
 * AsyncLifecycle's manage a number of aspects of the operation and is configured execution.
 * Some of these aspects are recorded in the meta cache, which are not associated with the redux store but used internally to control naiveasync operations.
 * This selection is contextual from the instance when .meta() is called on the lifecycle.
 * @export
 * @interface AsyncMeta
 * @template Data
 * @template Params
 */
export type AsyncMeta<Data, Params> = Required<AsyncableOptions> & {
  /** 'retries' assignment */
  readonly retries: number;
  /** 'subscribe' assignment (experimental) */
  readonly subscribe: number;
  /** 'subscribe' interval assignment (experimental) */
  readonly subscribeInterval: any;
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
  /** the last result when this operation resolved.*/
  readonly lastData?: Data;
  /** the last error when this operation rejected.*/
  readonly lastError?: string;
  /** 'onData' callback assignment */
  readonly onData?: OnData<Data, Params>;
  /** 'onError' callback assignment */
  readonly onError?: OnError<Data, Params>;
  /** retries 'errRetryCb' callback assignment */
  readonly errRetryCb?: ErrRetryCb;
  /** awaiting resolve callback, if the lifecycle is being awaited on */
  readonly awaitResolve?: OnData1<Data>;
  /** awaiting reject callback, if the lifecycle is being awaited on */
  readonly awaitReject?: OnError1;
  /** inverse of 'dataDepends'; callback functions awaiting data */
  readonly expectingData: Array<OnData1<Data>>;
  /** 'resolveData' callback for when data has been received. (synchronous) */
  readonly resolveData?: (data: Data) => void;
  /** 'rejectError' callback for when error has been occurred. (synchronous) */
  readonly rejectError?: (error: Error) => void;
  /** a copy of the original operation, used for recreating the lifecycle after cache invalidation */
  readonly operationCopy?: AsyncFunction<Data, Params>;
};

/**
 * lifecycle options. These are stored in the .meta cache. Some options can only be set at lifecycle creation time.
 *
 * Async lifecycles manage a number of aspects of the operation and is configured execution.
 * Some of these aspects are recorded in the meta cache, which are not associated with the redux store but used internally to control naiveasync operations.
 * This selection is contextual from the instance when .meta() is called on the lifecycle.
 * @export
 * @interface AsyncMeta
 * @template Data
 * @template Params
 */
export interface AsyncableOptions {
  /** 'debounce' assignment. Meta toggle to debounce the promise for N milliseconds (execute this function only if N milliseconds have passed without it being called.) (good for search) */
  readonly debounce?: number;
  /** 'throttle' assignment. Meta toggle to throttle the promise for N milliseconds (execute this function at most once every N milliseconds.) (a small throttle is good if the lifecycle is widely used) */
  readonly throttle?: number;
  /** 'timeout' assignment. Meta toggle to enable an N millisecond timeout of the promise, dispatching 'error' timeout if the request takes too long. (0 will disable) */
  readonly timeout?: number;
  /** modifies dispatched actions to invoke console.trace when dispatched. (experimental) */
  readonly traceDispatch?: boolean;
  /** modifies dispatched actions to pause Invocations of the Asyncfunction until the lifecycle with the given id. (experimental)  */
  readonly dataDepends?: string[];
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
  lastData: null,
  lastError: "",
  debounce: 0,
  throttle: 0,
  retries: 0,
  subscribe: 0,
  subscribeInterval: undefined,
  traceDispatch: false,
  dataDepends: [],
  expectingData: [],
  awaitResolve: undefined,
  awaitReject: undefined,
  resolveData: undefined,
  rejectError: undefined,
}) as AsyncMeta<any, any>;
