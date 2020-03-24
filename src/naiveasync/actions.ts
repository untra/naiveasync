import { asyncActionMatcher } from "./asyncActionMatcher"

// tslint:disable adjacent-overload-signatures

/** 🔁  */
export const naiveAsyncEmoji = '🔁'

/** the phase state of the naiveAsync lifecycle */
export type AsyncPhase = 'call' | 'data' | 'error' | 'done' | 'destroy' | 'reset' | 'sync' | 'syncInterval' | 'syncTimeout' | 'clear' | 'onData' | 'onError' | 'record'

interface AsyncPostmark {
  readonly name: string
  readonly phase: AsyncPhase
  readonly isMeta: boolean
}

export type OnData = <Data>(data: Data) => void
export type OnError = (error: string) => void

/** record of lifecycle meta */
export interface AsyncMeta<Data, Params> {
  // the time in ms the AsyncState was inflight
  lastcall?: number
  // the assigned interval in ms the call should be sync'd
  interval?: number
  // the duration of the last call
  duration?: number
  // callback to invoke when the lifecycle reaches its 'data' phase, and the data error
  onData?: (data: Data) => void
  // callback to invoke when the lifecycle reaches its 'error' phase, and the string error
  onError?: (err: string) => void
  // toggle whether Meta stats are recorded
  record?: boolean
}

export interface ConfigurableAsyncMeta<Data, Params> {
  interval?: number
}

/** a function that takes a singular params object P, returning a Promise<D> */
export type NaiveAsyncFunction<Data, Params> = (params: Params) => Promise<Data>

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

export type AsyncActionCreator<Payload> = (payload?: Payload) => {
  /** Full type constant for actions created by this function, `eagle/myFunction/call`. */
  readonly type: string
  /** Metadata for the owning this. */
  readonly meta: AsyncPostmark
  /**
   * Function that returns true iff the given action matches all properties of this action creator's meta.
   * In practice, this can be used to detect actions dispatched for this specific operation and lifecycle event.
   */
  readonly match: (action: Action<any>) => action is AsyncAction<Payload>
}

export const asyncActionCreatorFactory = <Data, Params>(
  name: string,
) => <Payload>(phase: AsyncPhase, isMetaOp?: boolean): AsyncActionCreator<Payload> => {
  const type = `${naiveAsyncEmoji}/${name}/${phase}`
  const isMeta = isMetaOp || false
  const meta = { name, phase, isMeta }
  const guard = asyncActionMatcher(undefined, phase)
  const match = (action: Action<Payload>): action is AsyncAction<Payload> =>
    guard(action) && action[naiveAsyncEmoji].name === name
  const actionCreator: AsyncActionCreator<Payload> = (payload?: Payload) => ({
    type,
    meta,
    match,
    payload,
    [naiveAsyncEmoji]: meta
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
  interval?: number
  timeout?: number
  duration?: number|boolean
}

/** the inflight state of a naiveasync operation */
interface InflightNAsyncState<Data, Params> {
  status: 'inflight'
  error: '' | string
  params: {} | Params
  data: null | Data
  interval?: number
  timeout?: number
  duration?: number|boolean
}

/** the error state of a naiveasync operation */
interface ErrorNAsyncState<Data, Params> {
  status: 'error'
  error: '' | string
  params: {} | Params
  data: null | Data
  interval?: number
  timeout?: number
  duration?: number|boolean
}

/** the done state of a naiveasync operation */
interface DoneNAsyncState<Data, Params> {
  status: 'done'
  error: ''
  params: {} | Params
  data: Data
  interval?: number
  timeout?: number
  duration?: number|boolean
}

/** The state of a NaiveAsyncFunction, encompassing status, params, error, data */
export type NaiveAsyncState<Data, Params> =
  | InitialNAsyncState
  | InflightNAsyncState<Data, Params>
  | ErrorNAsyncState<Data, Params>
  | DoneNAsyncState<Data, Params>

/** the initial state of a naiveasync operation */
export const naiveAsyncInitialState = Object.freeze({
  status: '',
  error: '',
  params: {},
  data: null,
}) as InitialNAsyncState

const noop = () => "noop"

/** the initial state of a naiveasync operation */
export const initialAsyncMeta = Object.freeze({
  lastcall: 0,
  interval: 0,
  duration: 0,
  onData: noop,
  onError: noop,
  record: false,
}) as AsyncMeta<any, any>
