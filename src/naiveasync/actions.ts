import { Dispatch } from "redux"
import { KeyedCache } from "./keyedcache"

/** 🔁  */
export const naiveAsyncEmoji = '🔁'

/** the phase state of the naiveAsync lifecycle */
export type AsyncPhase = 'call' | 'data' | 'error' | 'done' | 'destroy' | 'reset' | 'sync' | 'assign' | 'subscribe'

interface AsyncPostmark {
  readonly name: string
  readonly phase: AsyncPhase
}

/** a function that takes a singular params object P, returning a Promise<D> */
export type NaiveAsyncFunction<Data, Params> = (params: Params) => Promise<Data>

/** a function that takes a singular params object P, returning a Promise<D> */
export type AsyncFunction<Params, Data> = (params: Params) => Promise<Data>

/**
 * A typical redux action, templating a payload
 * @export
 * @interface Action
 * @template Payload
 */
export interface Action<Payload> {
  type: string
  payload: Payload
}

/**
 * A type interchangeable with a typical redux action
 * @export
 * @interface AnyAction
 */
export interface AnyAction {
  type: string
  payload?: any
}

/**
 * AsyncAction<Payload> is an action tracking an asychronous process (one we manage)
 * @export
 * @interface AsyncAction
 * @extends {Action<Payload>}
 * @template Payload
 */
export interface AsyncAction<Payload> extends Action<Payload> {
  readonly type: string
  readonly payload: Payload
  readonly [naiveAsyncEmoji]: AsyncPostmark
}

/**
 * isAsyncAction typeGuards AsyncAction<any>
 * @param {AnyAction} action
 * @returns {action is AsyncAction<any>}
 */
export const isAsyncAction = (action: AnyAction): action is AsyncAction<any> =>
naiveAsyncEmoji in action

const asyncActionMatchesPhase = (action: AsyncAction<any>, phase?: AsyncPhase) => {
  return !!(!phase || action[naiveAsyncEmoji].phase === phase)
}

const asyncActionMatchesOperation = (action: AsyncAction<any>, operation?: NaiveAsyncFunction<any, any>) => {
  return (!operation || (operation.name && operation.name === action[naiveAsyncEmoji].name))
}

/**
 * an action matcher typeguard for a given operation and phase
 * @export
 * @template Data
 * @template Params
 * @param {(NaiveAsyncFunction<Data, Params> | undefined)} operation
 * @param {AsyncPhase | undefined} phase
 * @returns {(action: AnyAction) => action is AsyncAction<any>}
 */
export function asyncActionMatcher<Data extends any, Params extends object>(
  operation: NaiveAsyncFunction<Data, Params> | undefined,
  phase: 'call',
): (action: AnyAction) => action is AsyncAction<Params>

export function asyncActionMatcher<Data, Params extends object>(
  operation: NaiveAsyncFunction<Data, Params> | undefined,
  phase: 'sync',
): (action: AnyAction) => action is AsyncAction<Params>

export function asyncActionMatcher<Data, Params extends object>(
  operation: NaiveAsyncFunction<Data, Params> | undefined,
  phase: 'data',
): (action: AnyAction) => action is AsyncAction<Data>

export function asyncActionMatcher<Data, Params extends object>(
  operation: NaiveAsyncFunction<Data, Params> | undefined,
  phase: 'error',
): (action: AnyAction) => action is AsyncAction<string>
export function asyncActionMatcher<Data, Params extends object>(
  operation: NaiveAsyncFunction<Data, Params> | undefined,
  phase: 'reset',
): (action: AnyAction) => action is AsyncAction<{}>
export function asyncActionMatcher<Data, Params>(
  operation?: NaiveAsyncFunction<Data, Params>,
  phase?: AsyncPhase,
): (action: AnyAction) => action is AsyncAction<Params>
export function asyncActionMatcher<Data, Params>(
  operation?: NaiveAsyncFunction<Data, Params>,
  phase?: AsyncPhase,
) {
  return (action: AnyAction) =>
    isAsyncAction(action)
    && asyncActionMatchesPhase(action, phase)
    && asyncActionMatchesOperation(action, operation)
}

export type AsyncActionCreator<Payload> = (payload?: Payload) => {
  /** Full type constant for actions created by this function, `eagle/myFunction/call`. */
  readonly type: string
  /** Metadata for the owning this. */
  readonly postmark: AsyncPostmark
  /**
   * Function that returns true iff the given action matches all properties of this action creator's meta.
   * In practice, this can be used to detect actions dispatched for this specific operation and lifecycle event.
   */
  readonly match: (action: Action<any>) => action is AsyncAction<Payload>
}

export const asyncActionCreatorFactory = <Data, Params>(
  name: string,
) => <Payload>(phase: AsyncPhase): AsyncActionCreator<Payload> => {
  const type = `${naiveAsyncEmoji}/${name}/${phase}`
  const postmark = { name, phase }
  const guard = asyncActionMatcher(undefined, phase)
  const match = (action: Action<Payload>): action is AsyncAction<Payload> =>
    guard(action) && action[naiveAsyncEmoji].name === name
  const actionCreator: AsyncActionCreator<Payload> = (payload?: Payload) => ({
    type,
    postmark,
    match,
    payload,
    [naiveAsyncEmoji]: postmark
  })
  return actionCreator
}

/**
 * Any redux store that implements usage of AsyncableState keyed to the AsyncableSymbol, use to typeguard implementations
 * @export
 * @interface AsyncableSlice
 */
export interface NaiveAsyncSlice {
  [naiveAsyncEmoji]: { [key: string]: NaiveAsyncState<any, any> }
}

export interface Gettable {
  get: (a: any) => any
}

export const isGettable = (x: any): x is Gettable  => {
  return "get" in x && typeof x.get === "function" ;
}

export type AsyncableStateStatus = '' | 'inflight' | 'error' | 'done'

/** the initial state of a naiveasync operation */
export interface InitialNAsyncState {
  status: ''
  error: ''
  params: {}
  data: null
}

/** the inflight state of a naiveasync operation */
interface InflightNAsyncState<Data, Params> {
  status: 'inflight'
  error: '' | string
  params: {} | Params
  data: null | Data
}

/** the error state of a naiveasync operation */
interface ErrorNAsyncState<Data, Params> {
  status: 'error'
  error: '' | string
  params: {} | Params
  data: null | Data
}

/** the done state of a naiveasync operation */
interface DoneNAsyncState<Data, Params> {
  status: 'done'
  error: ''
  params: {} | Params
  data: Data
}

/** The state of a NaiveAsyncFunction, encompassing status, params, error, data */
export type NaiveAsyncState<Data, Params> =
  | InitialNAsyncState
  | InflightNAsyncState<Data, Params>
  | ErrorNAsyncState<Data, Params>
  | DoneNAsyncState<Data, Params>

export type AsyncState<Data, Params> = NaiveAsyncState<Data, Params>

/**
 * isAsyncState typeGuards AsyncState<any>
 * @param {Object} state
 * @returns {state is AsyncState<any,any>}
 */
export const isAsyncState = <D,P>(state: object): state is AsyncState<D,P> =>
state !== null &&
"status" in state &&
"error" in state &&
"data" in state &&
"params" in state;

/** the initial state of a naiveasync operation */
export const naiveAsyncInitialState = Object.freeze({
  status: '',
  error: '',
  params: {},
  data: null,
}) as InitialNAsyncState

type OnCb = () => void
type OnData1<Data> = (data : Data) => void
type OnData2<Data> = (data : Data, dispatch: Dispatch<AnyAction>) => void
type OnError1 = (error : string) => void
type OnError2 = (error : string, dispatch: Dispatch<AnyAction>) => void
type ErrRetry1 = (error : any) => void
type ErrRetry2 = (error : any, retry : number) => void
export type OnError = OnCb | OnError1 | OnError2;
export type OnData<Data> = OnCb | OnData1<Data> | OnData2<Data>;
export type ErrRetryCb = OnCb | ErrRetry1 | ErrRetry2;

/**
 * Meta information representative of a lifecycle. useful for testing.
 *
 * @export
 * @interface AsyncMeta
 * @template Data
 * @template Params
 */
export interface AsyncMeta<Data,Params> {
  /** 'debounce' assignment */
  debounce: number,
  /** 'throttle' assignment */
  throttle: number,
  /** 'retries' assignment */
  retries: number,
  /** 'subscribe' assignment (experimental) */
  subscribe: number,
  /** 'subscribe' assignment (experimental) */
  subscribeInterval: any,
  /** 'timeout' assignment */
  timeout: number,
  /** time in ms the operation took to run */
  record: number,
  /** timestamp when the operation was last run */
  lastCalled: number,
  /** number of times data was returned */
  dataCount: number,
  /** number of times error was returned */
  errorCount: number,
  /** the memoize cache, if its enabled */
  memo?: KeyedCache<Data>,
  /** the last params used to call this operation */
  lastParams?: Params,
  /** 'onData' callback assignment */
  onData?: OnData<Data>,
  /** 'onError' callback assignment */
  onError?: OnError,
  /** retries 'errRetryCb' callback assignment */
  errRetryCb?: ErrRetryCb,
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
}) as AsyncMeta<any,any>
