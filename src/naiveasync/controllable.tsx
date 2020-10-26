import lodashDebounce from "lodash.debounce"
import lodashThrottle from "lodash.throttle"
import * as React from 'react'
// tslint:disable-next-line: no-duplicate-imports
import { useState } from "react"
// tslint:disable-next-line: no-implicit-dependencies
import { Provider, useDispatch, useStore } from 'react-redux'
import { Action, Dispatch, Middleware, Reducer } from 'redux'
import { empty, Observable, Subject } from "rxjs"
// tslint:disable-next-line: no-submodule-imports
import { filter, first, mergeMap } from "rxjs/operators"
import { AnyAction, AsyncAction, AsyncActionCreator, asyncActionCreatorFactory, asyncActionMatcher, AsyncMeta, AsyncPhase, AsyncState, isAsyncAction, naiveAsyncEmoji, NaiveAsyncFunction, naiveAsyncInitialMeta, naiveAsyncInitialState, NaiveAsyncSlice, NaiveAsyncState, OnData, OnError } from './actions'
import { KeyedCache } from './keyedcache'
import { $from, $toMiddleware } from './observables'
import { asyncStateReducer } from './reducer'

const cache = new KeyedCache<AsyncLifecycle<any, any>>()

const metaCache = new KeyedCache<AsyncMeta<any, any>>()

type ControllableChildren<State> = (
  state: State,
  dispatch: <A extends AnyAction>(action: A) => void,
) => React.ReactNode

interface ControllableProps<State> {
  children: ControllableChildren<State>
}

export type Controllerable<State> = React.ComponentType<ControllableProps<State>>


export interface AsyncLifecycle<Data, Params> {
  /** The identifier of the async state that owns this */
  readonly id: string
  /** The asynchronous operation */
  readonly operation: NaiveAsyncFunction<Data, Params>
  /** Returns the `AsyncState` instance owned by this manager. */
  readonly selector: (
    state: NaiveAsyncSlice,
  ) => NaiveAsyncState<Data, Params>
  /** Action creator that triggers the associated `AsyncOperation` when dispatched, passing any parameters directly through. Resets its state when called again */
  readonly call: AsyncActionCreator<Params>
  /** Action creator that triggers the associated `AsyncOperation` when dispatched, reusing the last remaining params. Does not reset data or error states, making it useful for polling data. */
  readonly sync: AsyncActionCreator<Params | undefined>
  /**
   * Removes the `AsyncState` instance owned by this `AsyncLifecycle` from the state tree.
   * `AsyncState` objects will remain in the state tree until they are destroyed, even if they are no longer being used by their components on the dom.
   * For React components, a good practice is to dispatch the `destroy` action in the component's `componentWillUnmount` method, or with
   * useEffect(() => {
   *   lifecycle.call({})
   *   return () => lifecycle.destroy({})
   * })
   */
  readonly destroy: AsyncActionCreator<undefined>
  /** Action dispatched internally when the associated `AsyncOperation` emits data. */
  readonly data: AsyncActionCreator<Data>
  /** Action dispatched internally when the associated `AsyncOperation` emits an error (rejects) or throws an exception. */
  readonly error: AsyncActionCreator<string>
  /** Action dispatched internally when the associated `AsyncOperation` completes (resolves, or emits all data in the case of an `Observable` or `AsyncIterable`). */
  readonly done: AsyncActionCreator<undefined>
  /** Action dispatched internally when the associated `AsyncOperation` is reset to it's initialState */
  readonly reset: AsyncActionCreator<undefined>
  /** Meta toggle to enable memoized responses on the lifecycle. Toggling will reset the memo. */
  readonly memoized: (enabled: boolean) => AsyncLifecycle<Data, Params>
  /** Meta toggle to debounce the promise for N milliseconds (execute this function at most once every N milliseconds.) */
  readonly throttle: (throttle: number) => AsyncLifecycle<Data, Params>
  /** Meta toggle to debounce the promise for N milliseconds (execute this function only if N milliseconds have passed without it being called.) */
  readonly debounce: (debounce: number) => AsyncLifecycle<Data, Params>
  /** Meta toggle to enable a millisecond timeout of the promise, dispatching 'error' timeout if the request takes too long. (0 will disable) */
  readonly timeout: (timeout: number) => AsyncLifecycle<Data, Params>
  /** (still in development) Meta toggle to enable a millisecond (sync) repeat of the promise (0 will disable) */
  readonly subscribe: (subscribe: number) => AsyncLifecycle<Data, Params>
  /** Assign a callback function to be called when the 'data' event is dispatched. */
  readonly onData: (onData: OnData<Data>) => AsyncLifecycle<Data, Params>
  /** Assign a callback function to be called when the 'error' event is dispatched. */
  readonly onError: (onError: OnError) => AsyncLifecycle<Data, Params>
  /** select the meta object */
  readonly meta: () => AsyncMeta<Data, Params>
  /** Utility action to assign the provided AsyncState to the redux store */
  readonly assign: AsyncActionCreator<AsyncState<Data,Params>>
}

/** the initial slice state for use in a redux store */
export const naiveAsyncInitialSlice = { [naiveAsyncEmoji]: {} }

/** a reducer to plug into your redux combineReducers */
export const naiveAsyncReducer: Reducer<NaiveAsyncSlice> = (state = naiveAsyncInitialSlice, action: AnyAction) => {
  // only process managed actions
  if (isAsyncAction(action)) {
    const name = action[naiveAsyncEmoji].name
    const currentState = state[naiveAsyncEmoji] || {}
    const nextState = { ...state, [naiveAsyncEmoji]: { ...currentState } }
    // aside from the destroy action,
    if (action[naiveAsyncEmoji].phase === 'destroy') {
      delete nextState[naiveAsyncEmoji][name]
      cache.remove(name)
      metaCache.remove(name)
    } else {
      nextState[naiveAsyncEmoji][name] = asyncStateReducer(nextState[naiveAsyncEmoji][name], action)
    }
    return nextState
  }
  return state
}

export const combinedAsyncableReducer: Reducer<{ [index: string]: any }> = (state = {}, action: AnyAction) => {
  return naiveAsyncReducer(state as NaiveAsyncSlice, action)[naiveAsyncEmoji]
}

const matchCallOrSyncOrDestroy = (asyncLifeCycle: AsyncLifecycle<any, object>) => (action: AnyAction) => {
  const { payload } = action
  const {
    call,
    destroy,
    sync
  } = asyncLifeCycle
  const matchCall = call(payload).match
  const matchDestroy = destroy().match
  const matchSync = sync(payload).match
  const actionPayload = { ...action, payload }
  return (matchCall(actionPayload) || matchSync(actionPayload) || matchDestroy(actionPayload))
}

function resolveObservable(action$: Observable<Action<any>>, asyncLifeCycle: AsyncLifecycle<any, object>, value: any): Observable<Action<any>> {
  const {
    data,
    done
  } = asyncLifeCycle
  return new Observable(subscriber => {
    const subscription = $from(Promise.resolve(value)).subscribe(
      nextData => subscriber.next(data(nextData)),
      err => `noop ${err}`,
      () => subscriber.next(done()),
    )
    action$
      .pipe(filter(matchCallOrSyncOrDestroy(asyncLifeCycle)), first())
      .subscribe(() => subscription.unsubscribe())
  })
}

const operationWithTimeout = (operation: NaiveAsyncFunction<any, any>, payload: object, timeout: number) => {
  if (isNaN(timeout) || timeout < 1) {
    return operation(payload)
  }
  const timeoutRejectPromise = new Promise((_, reject) =>
    setTimeout(() => reject(`timeout`), timeout)
  );
  return Promise.race([operation(payload), timeoutRejectPromise]);
}

function observableFromAsyncLifeCycle(action$: Observable<Action<any>>, asyncLifeCycle: AsyncLifecycle<any, object>, payload: object, meta: AsyncMeta<any, object>): Observable<Action<any>> {
  return new Observable(subscriber => {
    const {
      id,
      operation,
      data,
      error,
      done,
    } = asyncLifeCycle
    try {
      const subscription = $from(
        operationWithTimeout(operation, payload, meta.timeout || 0)
      ).subscribe(
        nextData => subscriber.next(data(nextData)),
        err => subscriber.next(error(err)),
        () => subscriber.next(done()),
      )
      action$
        .pipe(filter(matchCallOrSyncOrDestroy(asyncLifeCycle)), first())
        .subscribe(() => subscription.unsubscribe())
    } catch (err) {
      // tslint:disable-next-line: no-console
      console.warn(`unexpected error calling observable from lifecycle ${id}`, err)
      subscriber.next(error(err))
    }
  })
}

const AsyncableEpicOnPhase = (action$: Observable<Action<any>>, phase: AsyncPhase, reuseParams: boolean): Observable<Action> => {
  const phaseMatcher = asyncActionMatcher(undefined, phase)
  const mergeMapAction = (action: AsyncAction<any>) => {
    const name = action[naiveAsyncEmoji].name
    const meta = { ...naiveAsyncInitialMeta, ...metaCache.get(name) }
    const { memo, lastParams } = meta
    const now = Date.now()
    const payload = reuseParams && action.payload === undefined
      ? lastParams
      : action.payload
    const actionAsyncLifecycle = cache.get(name)
    // if the dispatched action doesn't have an assigned lifecycle
    if (!actionAsyncLifecycle) {
      return empty()
    }
    // if using a memoized record
    if (memo) {
      const memoized = memo.get(JSON.stringify(payload))
      if (memoized) {
        return resolveObservable(action$, actionAsyncLifecycle, memoized)
      }
    }
    metaCache.set(name, { ...meta, lastParams: payload, lastCalled: now })
    return observableFromAsyncLifeCycle(action$, actionAsyncLifecycle, payload, meta)
  }
  return action$.pipe(
    filter(phaseMatcher),
    mergeMap(mergeMapAction)
  ) as Observable<Action<any>>
}

const responseDispatchOnPhase = (action$: Observable<Action<any>>, phase: AsyncPhase, dispatch: Dispatch<AnyAction>): Observable<Action> => {
  const phaseMatcher = asyncActionMatcher(undefined, phase)
  const mergeMapDataAction = (action: AsyncAction<any>) => {
    const name = action[naiveAsyncEmoji].name;
    const meta: AsyncMeta<any, any> = { ...naiveAsyncInitialMeta, ...metaCache.get(name) };
    if (phase === 'data' && meta.onData) {
      meta.onData(action.payload, dispatch)
    }
    if (phase === 'error' && meta.onError) {
      meta.onError(action.payload, dispatch)
    }
    if (phase === 'data' && meta.memo) {
      meta.memo.set(JSON.stringify(meta.lastParams), action.payload)
    }

    const dataCount = phase === 'data' ? meta.dataCount + 1 : 0
    const errorCount = phase === 'error' ? meta.errorCount + 1 : 0
    const record = (Date.now() - meta.lastCalled)
    metaCache.set(name, { ...meta, dataCount, errorCount, record })
    return empty()
  }
  return action$.pipe(
    filter(phaseMatcher),
    mergeMap(mergeMapDataAction)
  ) as Observable<Action<any>>
}

/**
 * asyncableMiddleware is the higher order function for dispatching events to the store
 * @param {*} store
 * @returns
 */
export const naiveAsyncMiddleware: Middleware = store => {
  const action$: Subject<Action> = new Subject()
  const middleware = $toMiddleware(action$)
  AsyncableEpicOnPhase(action$, 'call', false).subscribe(store.dispatch)
  AsyncableEpicOnPhase(action$, 'sync', true).subscribe(store.dispatch)
  responseDispatchOnPhase(action$, 'data', store.dispatch).subscribe(store.dispatch)
  responseDispatchOnPhase(action$, 'error', store.dispatch).subscribe(store.dispatch)
  return middleware(store)
}

const selectFunction = (id: string) => (state: NaiveAsyncSlice) => {
  const substate: any = state[naiveAsyncEmoji]
  if (substate) {
    if (naiveAsyncEmoji in substate) {
      return (substate[naiveAsyncEmoji][id] || naiveAsyncInitialState)
    }
    return (substate[id] || naiveAsyncInitialState)
  }
  return naiveAsyncInitialState
}

/**
 * wraps a NaiveAsyncFunction and a unique identifier to provide a redux store managed lifecycle
 * that manages the given async operation
 * @template Data
 * @template Params
 * @param {NaiveAsyncFunction<Data, Params>} operation
 * @param {string} id
 * @returns {AsyncLifecycle<Data, Params>}
 */
export const naiveAsyncLifecycle = <Data, Params extends object>(
  operation: NaiveAsyncFunction<Data, Params>,
  id: string
): AsyncLifecycle<Data, Params> => {
  const existing = id && cache.get(id)
  if (existing) {
    return existing
  }
  const factory = asyncActionCreatorFactory(id)
  const lifecycle: AsyncLifecycle<Data, Params> = {
    id,
    operation,
    selector: selectFunction(id),
    call: factory<Params>('call'),
    sync: factory<Params | undefined>('sync'),
    destroy: factory<undefined>('destroy'),
    data: factory<Data>('data'),
    error: factory<string>('error'),
    done: factory<undefined>('done'),
    reset: factory<undefined>('reset'),
    assign: factory<AsyncState<Data,Params>>('assign'),
    memoized: (enabled: boolean) => {
      const memo = (enabled ? new KeyedCache<any>() : undefined);
      const meta = { ...metaCache.get(id), memo }
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta })
      return lifecycle;
    },
    onData: (onData: OnData<Data>) => {
      const meta = { ...metaCache.get(id), ...{ onData } }
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta })
      return lifecycle;
    },
    onError: (onError: OnError) => {
      const meta = { ...metaCache.get(id), ...{ onError } }
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta })
      return lifecycle;
    },
    timeout: (timeout: number) => {
      const meta = { ...metaCache.get(id), ...{ timeout } }
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta })
      return lifecycle;
    },
    throttle: (throttle: number) => {
      const thisMeta = metaCache.get(id)
      const meta = { ...thisMeta, ...{ throttle } }
      const operation = lodashThrottle(lifecycle.operation, throttle)
      const updatedLifecycle = { ...lifecycle, operation };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta })
      cache.set(id, updatedLifecycle)
      return updatedLifecycle
    },
    debounce: (debounce: number) => {
      const thisMeta = metaCache.get(id)
      const meta = { ...thisMeta, ...{ debounce } }
      const operation = lodashDebounce(lifecycle.operation, debounce, { leading: true, trailing: true })
      const updatedLifecycle = { ...lifecycle, operation };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta })
      cache.set(id, updatedLifecycle)
      return updatedLifecycle;
    },
    subscribe: (subscribe: number) => {
      const meta = { ...metaCache.get(id), ...{ subscribe } }
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta })
      return lifecycle;
    },
    meta: () => ({ ...naiveAsyncInitialMeta, ...metaCache.get(id) })
  }
  cache.set(id, lifecycle)
  return lifecycle
}

/**
 * Creates a controllable context, wrapping the provided reducer and middleware around dispatched actions.
 *
 * @export
 * @template State
 * @param {Reducer<State>} reducer
 * @param {Middleware} middleware
 * @return {*}  {Controllerable<State>}
 */
export function createControllableContext<State extends NaiveAsyncSlice>(
  reducer: Reducer<State>,
  middleware: Middleware
): Controllerable<State> {
  const Controllable = <State extends NaiveAsyncSlice>(props: ControllableProps<State>) => {
    const store = useStore()
    const dp = useDispatch()
    const [state, setState] = useState<NaiveAsyncSlice>(reducer(undefined, { type: ''}),)
    const internalDispatch: Dispatch<AnyAction> = <A extends Action>(action: A) => {
      const dispatchedAction = dp(action)
      setState(reducer(store.getState(), dispatchedAction))
      return dp(dispatchedAction)
    }
    const dispatch = middleware({
      dispatch: internalDispatch, // dispatches loading states
      getState: () => state,
    })(internalDispatch) // dispatches done and error states
    return (<Provider store={store}>{props.children(state as State, dispatch)}</Provider>)
  }
  return Controllable
}



