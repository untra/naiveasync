import * as React from 'react'
import { Action, Dispatch, Middleware, Reducer } from 'redux'
import { empty, Observable, Subject } from "rxjs"
// tslint:disable-next-line: no-submodule-imports
import { filter, first, mergeMap } from "rxjs/operators"
import uuid from 'uuid'
import { AnyAction, AsyncableSlice, AsyncableState, AsyncableSymbol, AsyncAction, AsyncActionCreator, asyncActionCreatorFactory, asyncActionMatcher, AsyncGenerator, initialAsyncableState, isAsyncAction } from './actions'
import { KeyedCache } from './keyedcache'
import { $from, $toMiddleware } from './observables'
import { asyncStateReducer } from './reducer'

const cache = new KeyedCache<AsyncLifecycle<any, any>>()

type ControllableChildren<State> = (
  state: State,
  dispatch: <A extends AnyAction>(action: A) => void,
) => React.ReactNode

interface ControllableProps<State> {
  children: ControllableChildren<State>
}

export type Controllable<State> = React.ComponentType<ControllableProps<State>>

export interface AsyncLifecycle<Data, Params extends object> {
  /** The identifier of the async state that owns this */
  readonly id: string
  /** The asynchronous operation */
  readonly operation: AsyncGenerator<Data, Params>
  /** Returns the `AsyncState` instance owned by this manager. */
  readonly selector: (
    state: AsyncableSlice,
  ) => AsyncableState<Data, Params>
  /** Action creator that triggers the associated `AsyncOperation` when dispatched, passing any parameters directly through. */
  readonly call: AsyncActionCreator<Params>
  /**
   * Removes the `AsyncState` instance owned by this `AsyncLifecycle` from the state tree.
   * Failure to dispatch `destroy` results in a memory leak, as `AsyncState` objects remain in the state tree until they are destroyed, even if they are no longer being used.
   * For React components, a good practice is to dispatch the `destroy` action in the component's `componentWillUnmount` hook.
   */
  readonly destroy: AsyncActionCreator<{}>
  /** Action dispatched internally when the associated `AsyncOperation` emits data. */
  readonly data: AsyncActionCreator<Data>
  /** Action dispatched internally when the associated `AsyncOperation` emits an error (rejects) or throws an exception. */
  readonly error: AsyncActionCreator<string>
  /** Action dispatched internally when the associated `AsyncOperation` completes (resolves, or emits all data in the case of an `Observable` or `AsyncIterable`). */
  readonly done: AsyncActionCreator<{}>
  /** Action dispatched internally when the associated `AsyncOperation` is reset to it's initialState */
  readonly reset: AsyncActionCreator<{}>
}

export const initialAsyncableSlice = { [AsyncableSymbol]: {} }
export const asyncableReducer: Reducer<AsyncableSlice> = (state = initialAsyncableSlice, action: AnyAction) => {
  // only process managed actions
  if (isAsyncAction(action)) {
    const name = action[AsyncableSymbol].name
    const currentState = state[AsyncableSymbol] || initialAsyncableSlice
    const nextState = { ...state, [AsyncableSymbol]: { ...currentState } }
    // aside from the destroy action,
    if (action[AsyncableSymbol].phase === 'destroy') {
      delete nextState[AsyncableSymbol][name]
      cache.remove(name)
    } else {
      nextState[AsyncableSymbol][name] = asyncStateReducer(nextState[AsyncableSymbol][name], action)
    }
    return nextState
  }
  return state
}

function observableFromAsyncLifeCycle(action$: Observable<Action<any>>, asyncLifeCycle: AsyncLifecycle<any, object>, payload: object): Observable<Action<any>> {
  return new Observable(subscriber => {
    const {
      operation,
      data,
      error,
      done,
      call,
      destroy
    } = asyncLifeCycle
    const matchCall = call(payload).match
    const matchDestroy = destroy(payload).match
    try {
      const subscription = $from(operation(payload)).subscribe(
        nextData => subscriber.next(data(nextData)),
        err => subscriber.next(error(err)),
        () => subscriber.next(done({})),
      )
      const matchCallOrDestroy = (action: AnyAction) => {
        if (action.payload === undefined) {
          return false
        } else {
          const { payload } = action
          const actionPayload = { ...action, payload }
          return (matchCall(actionPayload) || matchDestroy(actionPayload))
        }
      }
      action$
        .pipe(filter(matchCallOrDestroy), first())
        .subscribe(() => subscription.unsubscribe())
    } catch (err) {
      subscriber.next(error(err))
    }
  })
}

const AsyncableEpic = (action$: Observable<Action<any>>): Observable<Action> => {
  const asyncableMatcher = asyncActionMatcher(undefined, 'call')
  const mergeMapAction = (action: AsyncAction<any>) => {
    const actionAsyncLifecycle = cache.get(action[AsyncableSymbol].name)
    if (!actionAsyncLifecycle) {
      return empty()
    } else {
      return observableFromAsyncLifeCycle(action$, actionAsyncLifecycle, action.payload)
    }
  }
  return action$.pipe(
    filter(asyncableMatcher),
    mergeMap(mergeMapAction)
  ) as Observable<Action<any>>
}

/**
 * asyncableMiddleware is the higher order function for dispatching events to the store
 * @param {*} store
 * @returns
 */
export const asyncableMiddleware: Middleware = store => {
  const action$: Subject<Action> = new Subject()
  const middleware = $toMiddleware(action$)
  AsyncableEpic(action$).subscribe(store.dispatch)
  return middleware(store)
}


export const asyncableLifecycle = <Data, Params extends object>(
  operation: AsyncGenerator<Data, Params>
): AsyncLifecycle<Data, Params> => {
  const id = operation.name ? operation.name : uuid.v4()
  const existing = id && cache.get(id)
  if (existing) {
    return existing
  }
  const factory = asyncActionCreatorFactory(id)
  const lifecycle: AsyncLifecycle<Data, Params> = {
    id,
    operation,
    selector: (state: AsyncableSlice) => state[AsyncableSymbol][id] || initialAsyncableState,
    call: factory<Params>('call'),
    destroy: factory<{}>('destroy'),
    data: factory<Data>('data'),
    error: factory<string>('error'),
    done: factory<{}>('done'),
    reset: factory<{}>('reset'),
  }
  cache.set(id, lifecycle)
  return lifecycle
}

export function createControllableContext<State extends AsyncableSlice>(
  reducer: Reducer<State>,
  middleware: Middleware
): Controllable<State> {

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

    public dispatch: Dispatch<AnyAction> = <A extends Action>(action: A) => {
      this.setState(reducer(this.state, action))
      return action
    }

    public render() {
      return this.props.children(this.state, this.dispatch)
    }
  }

  return Controllable
}