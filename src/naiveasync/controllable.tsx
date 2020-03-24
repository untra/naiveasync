import * as React from 'react'
// tslint:disable-next-line: no-implicit-dependencies
import { Provider } from 'react-redux'
import { Action, applyMiddleware, createStore, Dispatch, Middleware, Reducer } from 'redux'
import { empty, Observable, Subject } from "rxjs"
// tslint:disable-next-line: no-submodule-imports
import { filter, first, mergeMap } from "rxjs/operators"
import { AnyAction, AsyncAction, AsyncActionCreator, asyncActionCreatorFactory, asyncActionMatcher, AsyncPhase, isAsyncAction, naiveAsyncEmoji, NaiveAsyncFunction, naiveAsyncInitialState, NaiveAsyncSlice, NaiveAsyncState } from './actions'
import { KeyedCache } from './keyedcache'
import { $from, $toMiddleware } from './observables'
import { asyncStateReducer } from './reducer'

const cache = new KeyedCache<AsyncLifecycle<any, any>>()

const lastParams = new KeyedCache<any>()

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
  readonly sync: AsyncActionCreator<Params|undefined>
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
      lastParams.remove(name)
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

function observableFromAsyncLifeCycle(action$: Observable<Action<any>>, asyncLifeCycle: AsyncLifecycle<any, object>, payload: object): Observable<Action<any>> {
  return new Observable(subscriber => {
    const {
      operation,
      data,
      error,
      done,
      call,
      destroy,
      sync
    } = asyncLifeCycle
    const matchCall = call(payload).match
    const matchDestroy = destroy().match
    const matchSync = sync(payload).match
    try {
      const subscription = $from(operation(payload)).subscribe(
        nextData => subscriber.next(data(nextData)),
        err => subscriber.next(error(err)),
        () => subscriber.next(done()),
      )
      const matchCallOrSyncOrDestroy = (action: AnyAction) => {
        const { payload } = action
        const actionPayload = { ...action, payload }
        return (matchCall(actionPayload) || matchSync(actionPayload) || matchDestroy(actionPayload))
      }
      action$
        .pipe(filter(matchCallOrSyncOrDestroy), first())
        .subscribe(() => subscription.unsubscribe())
    } catch (err) {
      subscriber.next(error(err))
    }
  })
}

const AsyncableEpicOnPhase = (action$: Observable<Action<any>>, phase : AsyncPhase, reuseParams : boolean): Observable<Action> => {
  const phaseMatcher = asyncActionMatcher(undefined, phase)
  const mergeMapAction = (action: AsyncAction<any>) => {
    const name = action[naiveAsyncEmoji].name
    const payload = reuseParams && action.payload === undefined
    ? lastParams.get(name)
    : action.payload
    const actionAsyncLifecycle = cache.get(name)
    if (!actionAsyncLifecycle) {
      return empty()
    } else {
      lastParams.set(name, payload)
      return observableFromAsyncLifeCycle(action$, actionAsyncLifecycle, payload)
    }
  }
  return action$.pipe(
    filter(phaseMatcher),
    mergeMap(mergeMapAction)
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
  return middleware(store)
}

const selectFunction = (id: string) => (state: NaiveAsyncSlice) => {
  const substate : any = state[naiveAsyncEmoji]
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
    sync: factory<Params|undefined>('sync'),
    destroy: factory<undefined>('destroy'),
    data: factory<Data>('data'),
    error: factory<string>('error'),
    done: factory<undefined>('done'),
    reset: factory<undefined>('reset'),
  }
  cache.set(id, lifecycle)
  return lifecycle
}

export function createControllableContext<State extends NaiveAsyncSlice>(
  reducer: Reducer<State>,
  middleware: Middleware
): Controllerable<State> {

  const store = createStore(reducer, applyMiddleware(middleware))

  class Controllable extends React.Component<ControllableProps<State>, State> {
    constructor(props: ControllableProps<State>) {
      super(props)
      const initialState = reducer(undefined, { type: '@@CONTROLLABLE' })
      this.state = initialState
      this.dispatch = middleware({
        dispatch: this.dispatch,
        getState: () => this.state,
      })(this.dispatch)
    }

    public componentWillUnmount = () => {
      // tslint:disable-next-line: no-empty
      this.setState = () => { }
    }

    public dispatch: Dispatch<AnyAction> = <A extends Action>(action: A) => {
      this.setState(reducer(this.state, action))
      return action
    }

    public render() {
      // 💥 TODO: this is so incorrect and inefficient, bad sam! bad code
      return <Provider store={store}>{this.props.children(this.state, this.dispatch)}</Provider>
    }
  }

  return Controllable
}
