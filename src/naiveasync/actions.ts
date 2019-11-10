const AsyncableEmoji = '🔁'
export const AsyncableSymbol = Symbol(AsyncableEmoji)

export type AsyncPhase = 'call' | 'data' | 'error' | 'done' | 'destroy' | 'reset'

interface AsyncMeta {
  readonly name: string
  readonly phase: AsyncPhase
}

export type AsyncGenerator<Data, Params> = (params: Params) => Promise<Data>

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
  readonly [AsyncableSymbol]: AsyncMeta
}

/**
 * isAsyncAction typeGuards AsyncAction<any>
 * @param {AnyAction} action
 * @returns {action is AsyncAction<any>}
 */
export const isAsyncAction = (action: AnyAction): action is AsyncAction<any> =>
  AsyncableSymbol in action

const asyncActionMatchesPhase = (action: AsyncAction<any>, phase?: AsyncPhase) => {
  return !!(!phase || action[AsyncableSymbol].phase === phase)
}

const asyncActionMatchesOperation = (action: AsyncAction<any>, operation?: AsyncGenerator<any, any>) => {
  return (!operation || (operation.name && operation.name === action[AsyncableSymbol].name))
}

/**
 * an action matcher typeguard for a given operation and phase
 * @export
 * @template Data
 * @template Params
 * @param {(AsyncGenerator<Data, Params> | undefined)} operation
 * @param {AsyncPhase | undefined} phase
 * @returns {(action: AnyAction) => action is AsyncAction<any>}
 */
export function asyncActionMatcher<Data extends any, Params extends object>(
  operation: AsyncGenerator<Data, Params> | undefined,
  phase: 'call',
): (action: AnyAction) => action is AsyncAction<Params>

export function asyncActionMatcher<Data, Params extends object>(
  operation: AsyncGenerator<Data, Params> | undefined,
  phase: 'data',
): (action: AnyAction) => action is AsyncAction<Data>

export function asyncActionMatcher<Data, Params extends object>(
  operation: AsyncGenerator<Data, Params> | undefined,
  phase: 'error',
): (action: AnyAction) => action is AsyncAction<string>
export function asyncActionMatcher<Data, Params extends object>(
  operation: AsyncGenerator<Data, Params> | undefined,
  phase: 'reset',
): (action: AnyAction) => action is AsyncAction<{}>
export function asyncActionMatcher<Data, Params>(
  operation?: AsyncGenerator<Data, Params>,
  phase?: AsyncPhase,
): (action: AnyAction) => action is AsyncAction<Params>
export function asyncActionMatcher<Data, Params>(
  operation?: AsyncGenerator<Data, Params>,
  phase?: AsyncPhase,
) {
  return (action: AnyAction) =>
    isAsyncAction(action)
    && asyncActionMatchesPhase(action, phase)
    && asyncActionMatchesOperation(action, operation)
}

export type AsyncActionCreator<Payload> = (payload: Payload) => {
  /** Full type constant for actions created by this function, `eagle/myFunction/call`. */
  readonly type: string
  /** Metadata for the owning this. */
  readonly meta: AsyncMeta
  /**
   * Function that returns true iff the given action matches all properties of this action creator's meta.
   * In practice, this can be used to detect actions dispatched for this specific operation and lifecycle event.
   */
  readonly match: (action: Action<any>) => action is AsyncAction<Payload>
}

export const asyncActionCreatorFactory = <Data, Params>(
  name: string,
) => <Payload>(phase: AsyncPhase): AsyncActionCreator<Payload> => {
  const type = `${AsyncableEmoji}/${name}/${phase}`
  const meta = { name, phase }
  const guard = asyncActionMatcher(undefined, phase)
  const match = (action: Action<Payload>): action is AsyncAction<Payload> =>
    guard(action) && action[AsyncableSymbol].name === name
  const actionCreator: AsyncActionCreator<Payload> = (payload: Payload) => ({
    type,
    meta,
    match,
    payload,
    [AsyncableSymbol]: meta
  })
  return actionCreator
}

/**
 * Any redux store that implements usage of AsyncableState keyed to the AsyncableSymbol, use to typeguard implementations
 * @export
 * @interface AsyncableSlice
 */
export interface AsyncableSlice {
  [AsyncableSymbol]: { [key: string]: AsyncableState<any, any> }
}


export type AsyncableStateStatus = '' | 'inflight' | 'error' | 'done'

export interface InitialAsyncableState {
  status: ''
  error: ''
  params: {}
  data: null
}

interface InflightNAsyncState<Data, Params> {
  status: 'inflight'
  error: '' | string
  params: {} | Params
  data: null | Data
}

interface ErrorNAsyncState<Data, Params> {
  status: 'error'
  error: '' | string
  params: {} | Params
  data: null | Data
}

interface DoneNAsyncState<Data, Params> {
  status: 'done'
  error: ''
  params: {} | Params
  data: Data
}

export type AsyncableState<Data, Params> =
  | InitialAsyncableState
  | InflightNAsyncState<Data, Params>
  | ErrorNAsyncState<Data, Params>
  | DoneNAsyncState<Data, Params>



export const initialAsyncableState = Object.freeze({
  status: '',
  error: '',
  params: {},
  data: null,
}) as InitialAsyncableState
