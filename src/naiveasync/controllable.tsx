/* eslint-disable @typescript-eslint/no-explicit-any */
import lodashDebounce from "lodash.debounce";
import lodashThrottle from "lodash.throttle";
import { Action, Dispatch, Middleware, Reducer } from "redux";
import { Observable, Subject, Subscription } from "rxjs";
// tslint:disable-next-line: no-submodule-imports
import { filter, first, mergeMap } from "rxjs/operators";
import {
  AnyAction,
  AsyncAction,
  AsyncActionCreator,
  asyncActionCreatorFactory,
  asyncActionMatcher,
  AsyncFunction,
  AsyncMeta,
  AsyncPhase,
  AsyncState,
  ErrRetryCb,
  isAsyncAction,
  asyncableEmoji,
  naiveAsyncInitialMeta,
  naiveAsyncInitialState,
  AsyncableSlice,
  OnData,
  OnError,
  AsyncableOptions,
  OnData1,
  AsyncActionCreatorFactory,
} from "./actions";
import { KeyedCache } from "./keyedcache";
import { $from, $toMiddleware } from "./observables";
import { asyncStateReducer } from "./reducer";

const cache = new KeyedCache<AsyncLifecycle<any, any>>();

const metaCache = new KeyedCache<AsyncMeta<any, any>>();

export const timeoutRejection = "timeout";

/**
 * A managed async function () => Promise and identifier, with factory-made selectors, dispatch actions, and other goodies
 * @interface AsyncLifecycle
 * @template Data - the 'response' type
 * @template Params - the 'request' type
 */
export interface AsyncLifecycle<Data, Params> {
  /** The identifier of the async state that owns this */
  readonly id: string;
  /** The asynchronous operation */
  readonly operation: AsyncFunction<Data, Params>;
  /** Returns the `AsyncState` instance owned by this manager. */
  readonly selector: (state: AsyncableSlice) => AsyncState<Data, Params>;
  /** Action creator that resets the state for this asyncOperation, triggers the associated `AsyncOperation` when dispatched, passing any parameters directly through. */
  readonly call: AsyncActionCreator<Params>;
  /** Action creator that triggers the associated `AsyncOperation` when dispatched, reusing the last remaining params. Does not reset data or error states, making it useful for polling data. */
  readonly sync: AsyncActionCreator<Params | undefined>;
  /**
   * Removes the `AsyncState` instance owned by this `AsyncLifecycle` from the state tree, and removes its registry from the internal cache.
   * `AsyncState` objects will remain in the state tree until they are destroyed, even if they are no longer being used by their components on the dom.
   * For React components, a good practice is to dispatch the `destroy` action in the component's `componentWillUnmount` method, or with
   * useEffect(() => {
   *   lifecycle.call({})
   *   return () => lifecycle.destroy({})
   * })
   */
  readonly destroy: AsyncActionCreator<undefined>;
  /** Action dispatched internally when the associated `AsyncOperation` emits data. */
  readonly data: AsyncActionCreator<Data>;
  /** Action dispatched internally when the associated `AsyncOperation` emits an error (rejects) or throws an exception. */
  readonly error: AsyncActionCreator<string>;
  /** Action dispatched internally when the associated `AsyncOperation` completes (resolves, or emits all data in the case of an `Observable` or `AsyncIterable`). */
  readonly done: AsyncActionCreator<undefined>;
  /** Action dispatched internally when the associated `AsyncOperation` is reset to it's initialState. */
  readonly reset: AsyncActionCreator<undefined>;
  /**
   * Meta toggle to enable memoized responses on the lifecycle.
   * Memoized responses means that responses will be cached and subsequent requests with similar params will return the cached data.
   * The memoize cache is not invincible, and might be prone to memory leaks with exceptional usage.
   * Toggling will reset the memo.
   */
  readonly memoized: (enabled: boolean) => AsyncLifecycle<Data, Params>;
  /** Meta toggle to throttle the promise for N milliseconds (execute this function at most once every N milliseconds.) (a small throttle is good if the lifecycle is widely used) */
  readonly throttle: (throttle: number) => AsyncLifecycle<Data, Params>;
  /** Meta toggle to debounce the promise for N milliseconds (execute this function only if N milliseconds have passed without it being called.) (good for search) */
  readonly debounce: (debounce: number) => AsyncLifecycle<Data, Params>;
  /** Meta toggle to enable an N millisecond timeout of the promise, dispatching 'error' timeout if the request takes too long. (0 will disable) */
  readonly timeout: (timeout: number) => AsyncLifecycle<Data, Params>;
  /** Meta toggle to reattempt the promise N times, dispatching the last error on the final retry (0 will disable) */
  readonly retries: (
    retries: number,
    errRetryCb?: ErrRetryCb
  ) => AsyncLifecycle<Data, Params>;
  /** Meta toggle to enable a millisecond (sync) repeat of the operation with its previously supplied params. (0 will disable) */
  readonly subscribe: AsyncActionCreator<number>;
  /** Assign a callback function to be called when the 'data' event is dispatched. */
  readonly onData: (
    onData: OnData<Data, Params>
  ) => AsyncLifecycle<Data, Params>;
  /** Assign a callback function to be called when the 'error' event is dispatched. */
  readonly onError: (
    onError: OnError<Data, Params>
  ) => AsyncLifecycle<Data, Params>;
  /** Selects the meta object, a snapshot of this lifecycles metaCache for debugging analysis. */
  readonly meta: () => AsyncMeta<Data, Params>;
  /** Utility action to assign the provided AsyncState to the redux store. Its use in testing is encouraged, its use in prod is not. */
  readonly assign: AsyncActionCreator<AsyncState<Data, Params>>;
  /** Returns a promise that awaits for the next operation resolve (resolves to data or rejects with errors). Useful for testing. */
  readonly awaitResolve: () => Promise<Data>;
  /** Returns a promise that awaits the next operation rejection (resolves to data or rejects with errors). Useful for testing. */
  readonly awaitReject: () => Promise<Data>;
  /** Pauses execution of the operation until the lifecycle with the given id has returned data. Only looks if data was returned once, not necesarilly that the lifecycle has data in it's state (experimental) */
  readonly dataDepends: (dataDepends: string[]) => AsyncLifecycle<Data, Params>;
  /** A callback for when an data resolves. Will wait until data state occurs. */
  readonly resolveData: () => Promise<Data>;
  /** A callback for when an error rejects. Will wait until an error state occurs. */
  readonly rejectError: () => Promise<string>;
  /** Applies options to the lifecycle, calling the operations automatically. */
  readonly options: (options: AsyncableOptions) => AsyncLifecycle<Data, Params>;
  /** Invalidates the cache; re-creates the lifecycle in cache and resets it's meta. Applies new options or keeps previous settings if not supplied. Good for testing after mocking / spied function mutation, but likely poison for calling at runtime. */
  readonly invalidate: (
    options?: AsyncableOptions
  ) => AsyncLifecycle<Data, Params>;
  /**
   * Supply an AbortController to potentially cancel the next invocation of the async operation.
   * A cancelled operation will not set any state when AbortError is reported
   * See the MDN documentation
   */
  readonly abortController: (
    abortController: AbortController
  ) => AsyncLifecycle<Data, Params>;
}

/** Do not export this. Function is big and expensive. */
const newLifecycleFromFactory = <Data, Params>(
  id: string,
  operation: AsyncFunction<Data, Params>,
  factory: AsyncActionCreatorFactory
): AsyncLifecycle<Data, Params> => {
  const lifecycle: AsyncLifecycle<Data, Params> = {
    id,
    operation,
    selector: selectFunction(id),
    call: factory<Params>("call"),
    sync: factory<Params | undefined>("sync"),
    destroy: factory<undefined>("destroy"),
    data: factory<Data>("data"),
    error: factory<string>("error"),
    done: factory<undefined>("done"),
    reset: factory<undefined>("reset"),
    assign: factory<AsyncState<Data, Params>>("assign"),
    subscribe: factory<number>("subscribe"),
    memoized: (enabled: boolean) => {
      const memo = enabled ? new KeyedCache<any>() : undefined;
      const meta = { ...metaCache.get(id), memo };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
      return lifecycle;
    },
    onData: (onData: OnData<Data, Params>) => {
      const meta = { ...metaCache.get(id), ...{ onData } };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
      return lifecycle;
    },
    onError: (onError: OnError<Data, Params>) => {
      const meta = { ...metaCache.get(id), ...{ onError } };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
      return lifecycle;
    },
    timeout: (timeout: number) => {
      const meta = { ...metaCache.get(id), ...{ timeout } };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
      return lifecycle;
    },
    throttle: (throttle: number) => {
      const thisMeta = metaCache.get(id);
      const meta = { ...thisMeta, ...{ throttle } };
      const operation = lodashThrottle(
        lifecycle.operation,
        throttle
      ) as AsyncFunction<any, any>;
      const updatedLifecycle = { ...lifecycle, operation };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
      cache.set(id, updatedLifecycle);
      return updatedLifecycle;
    },
    debounce: (debounce: number) => {
      const thisMeta = metaCache.get(id);
      const meta = { ...thisMeta, ...{ debounce } };
      const operation = lodashDebounce(lifecycle.operation, debounce, {
        leading: true,
        trailing: true,
      }) as AsyncFunction<any, any>;
      const updatedLifecycle = { ...lifecycle, operation };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
      cache.set(id, updatedLifecycle);
      return updatedLifecycle;
    },
    retries: (retries: number, errRetryCb: ErrRetryCb = () => "noop") => {
      const thisMeta = metaCache.get(id);
      const meta = { ...thisMeta, ...{ retries, errRetryCb } };
      const operation = retryOperation(
        lifecycle.operation,
        errRetryCb,
        retries
      );
      const updatedLifecycle = { ...lifecycle, operation };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
      cache.set(id, updatedLifecycle);
      return updatedLifecycle;
    },
    meta: () => ({ ...naiveAsyncInitialMeta, ...metaCache.get(id) }),
    awaitResolve: async () => {
      const thisMeta = metaCache.get(id);
      let awaitResolve: (value: Data) => void = () => null;
      const awaitedPromise = new Promise<Data>((resolve) => {
        awaitResolve = resolve;
      });
      const meta = {
        ...thisMeta,
        awaitResolve,
      };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
      return awaitedPromise;
    },
    awaitReject: async () => {
      const thisMeta = metaCache.get(id);
      let awaitReject: (err?: any) => void = () => null;
      const awaitedPromise = new Promise<Data>((resolve) => {
        awaitReject = resolve;
      });
      const meta = {
        ...thisMeta,
        awaitReject,
      };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
      return awaitedPromise;
    },
    dataDepends: (dataDepends: string[]) => {
      const thisMeta = metaCache.get(id);
      const meta = {
        ...thisMeta,
        dataDepends,
      };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
      return lifecycle;
    },
    resolveData: async () => {
      const thisMeta = metaCache.get(id);
      const lastData = thisMeta?.lastData;

      if (lastData) {
        return Promise.resolve(lastData);
      } else {
        let resolveData: (value: Data) => void = () => null;
        const awaitedPromise = new Promise<Data>((resolve) => {
          resolveData = resolve;
        });
        const meta = { ...thisMeta, ...{ resolveData } };
        metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
        return awaitedPromise;
      }
    },
    rejectError: async () => {
      const thisMeta = metaCache.get(id);
      const lastError = thisMeta?.lastError;

      if (lastError) {
        return Promise.reject(lastError);
      } else {
        let rejectError: (value: Error) => void = () => null;
        const awaitedRejection = new Promise<string>((_resolve, reject) => {
          rejectError = reject;
        });
        const meta = { ...thisMeta, ...{ rejectError } };
        metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
        return awaitedRejection;
      }
    },
    options: (options: AsyncableOptions) => {
      const thisMeta = metaCache.get(id) || naiveAsyncInitialMeta;
      if (options?.debounce) {
        lifecycle.debounce(options.debounce);
      }
      if (options?.throttle) {
        lifecycle.throttle(options.throttle);
      }
      if (options?.timeout) {
        lifecycle.timeout(options.timeout);
      }
      if (options?.dataDepends) {
        lifecycle.dataDepends(options.dataDepends);
      }
      metaCache.set(id, { ...thisMeta, ...options });
      return lifecycle;
    },
    abortController: (abortController: AbortController) => {
      const thisMeta = metaCache.get(id);
      const meta = {
        ...thisMeta,
        abortController,
      };
      metaCache.set(id, { ...naiveAsyncInitialMeta, ...meta });
      return lifecycle;
    },
    invalidate: (options?: AsyncableOptions) => {
      const thisMeta = metaCache.get(id);
      const newOptions: AsyncableOptions = options || {
        traceDispatch: thisMeta?.traceDispatch,
        timeout: thisMeta?.timeout,
        debounce: thisMeta?.debounce,
        throttle: thisMeta?.throttle,
        dataDepends: thisMeta?.dataDepends,
      };
      const factory = asyncActionCreatorFactory(id, newOptions);
      const operation = thisMeta?.operationCopy || lifecycle.operation;
      const newLifecycle = {
        ...lifecycle,
        operation,
        call: factory<Params>("call"),
        sync: factory<Params | undefined>("sync"),
        destroy: factory<undefined>("destroy"),
        data: factory<Data>("data"),
        error: factory<string>("error"),
        done: factory<undefined>("done"),
        reset: factory<undefined>("reset"),
        assign: factory<AsyncState<Data, Params>>("assign"),
        subscribe: factory<number>("subscribe"),
      };
      cache.set(id, newLifecycle);
      metaCache.set(id, {
        ...naiveAsyncInitialMeta,
        ...newOptions,
        operationCopy: operation,
      });
      return newLifecycle;
    },
  };
  return lifecycle;
};

/** the initial slice state for use in a redux store */
export const naiveAsyncInitialSlice = { [asyncableEmoji]: {} };

/** a reducer to plug into your redux combineReducers */
export const naiveAsyncReducer: Reducer<AsyncableSlice> = (
  state = naiveAsyncInitialSlice,
  action: AnyAction
) => {
  // only process managed actions
  if (isAsyncAction(action)) {
    const name = action[asyncableEmoji].name;
    const currentState = state[asyncableEmoji] || {};
    const nextState = { ...state, [asyncableEmoji]: { ...currentState } };
    // aside from the destroy action,
    if (action[asyncableEmoji].phase === "destroy") {
      delete nextState[asyncableEmoji][name];
      cache.remove(name);
      metaCache.remove(name);
    } else {
      nextState[asyncableEmoji][name] = asyncStateReducer(
        nextState[asyncableEmoji][name],
        action
      );
    }
    return nextState;
  }
  return state;
};

export const combinedAsyncableReducer: Reducer<{ [index: string]: any }> = (
  state = {},
  action: AnyAction
) => naiveAsyncReducer(state as AsyncableSlice, action)[asyncableEmoji];

const matchCallOrSyncOrDestroy =
  (asyncLifeCycle: AsyncLifecycle<any, any>) => (action: AnyAction) => {
    const { payload } = action;
    const { call, destroy, sync } = asyncLifeCycle;
    const matchCall = call(payload).match;
    const matchDestroy = destroy().match;
    const matchSync = sync(payload).match;
    const actionPayload = { ...action, payload };
    return (
      matchCall(actionPayload) ||
      matchSync(actionPayload) ||
      matchDestroy(actionPayload)
    );
  };

const resolveObservableAs = (
  action$: Observable<Action<any>>,
  asyncLifeCycle: AsyncLifecycle<any, any>,
  value: any
): Observable<Action<any>> => {
  const { data, done } = asyncLifeCycle;
  return new Observable((subscriber) => {
    const subscription = $from(Promise.resolve(value)).subscribe(
      (nextData: any) => subscriber.next(data(nextData)),
      (err: any) => `noop ${err}`,
      () => subscriber.next(done())
    );
    action$
      .pipe(filter(matchCallOrSyncOrDestroy(asyncLifeCycle)), first())
      .subscribe(() => subscription.unsubscribe());
  });
};

const operationWithMeta = (
  operation: AsyncFunction<any, any>,
  id: string,
  payload: any,
  meta: AsyncMeta<any, any>
) => {
  const { timeout } = meta;
  if (!isNaN(timeout) && timeout > 0) {
    const timeoutRejectPromise = new Promise((_, reject) =>
      // eslint-disable-next-line prefer-promise-reject-errors
      setTimeout(() => reject(timeoutRejection), timeout)
    );
    return Promise.race([
      decoratedOperation(payload, id, meta, operation),
      timeoutRejectPromise,
    ]);
  }
  // if other lifecycles first depend on data, await those first
  return decoratedOperation(payload, id, meta, operation);
};

// if anything first depends on this data, do not resolve until callbacks invoked
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
const decoratedOperation = <T extends any>(
  value: T,
  id: string,
  meta: AsyncMeta<any, any>,
  operation: AsyncFunction<any, any>
): Promise<T> => {
  // wait for the first lifecycle still missing data to continue
  for (const depends of meta.dataDepends) {
    const dependsMeta = {
      ...naiveAsyncInitialMeta,
      ...metaCache.get(depends),
    };
    if (dependsMeta.lastData) {
      continue;
    } else {
      let awaitData: (value: T) => void = (t: T) => t;
      const awaitedPromise = new Promise<T>((resolve) => {
        awaitData = resolve;
      }).then(() => value);
      const expectingData = [...dependsMeta.expectingData, awaitData];
      metaCache.set(depends, { ...dependsMeta, expectingData });
      return awaitedPromise.then((value) => operation(value));
    }
  }
  // cancel the current promise and reset the abortController if that's possible
  if (meta.abortController && !meta.abortController.signal.aborted) {
    meta.abortController.abort();
    metaCache.set(id, { ...meta, abortController: undefined });
  }
  return operation(value);
};

/** from a dispatched action$ observable for a given lifecycle, call the operation and dispatch the redux actions */
const observableFromAsyncLifeCycle = (
  action$: Observable<Action<any>>,
  asyncLifeCycle: AsyncLifecycle<any, any>,
  payload: any,
  meta: AsyncMeta<any, any>
): Observable<Action<any>> =>
  new Observable((subscriber) => {
    const { id, operation, data, error, done } = asyncLifeCycle;
    try {
      const subscription: Subscription = $from(
        operationWithMeta(operation, id, payload, meta)
      ).subscribe(
        (nextData: any) => subscriber.next(data(nextData)),
        (err: string | undefined) => subscriber.next(error(err)),
        () => subscriber.next(done())
      );
      action$
        .pipe(filter(matchCallOrSyncOrDestroy(asyncLifeCycle)), first())
        .subscribe(() => subscription.unsubscribe());
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        `unexpected error calling observable from lifecycle ${id}`,
        err
      );
      subscriber.next(error(err as any));
    }
  });

/**  */
const asyncableEpicOnPhase = (
  action$: Observable<Action<any>>,
  phase: AsyncPhase,
  reuseParams: boolean
): Observable<Action> => {
  const phaseMatcher = asyncActionMatcher(undefined, phase);
  const mergeMapAction = (action: AsyncAction<any>) => {
    const name = action[asyncableEmoji].name;
    const meta = { ...naiveAsyncInitialMeta, ...metaCache.get(name) };
    const { memo, lastParams, traceDispatch } = meta;
    const now = Date.now();
    const payload =
      reuseParams && action.payload === undefined ? lastParams : action.payload;
    const actionAsyncLifecycle = cache.get(name);
    // if the dispatched action doesn't have an assigned lifecycle
    if (!actionAsyncLifecycle) {
      // eslint-disable-next-line no-console
      console.warn(
        `No lifecycle found for dispatched action ${action.type} ${name}`
      );
      return new Observable<never>();
    }
    // if the dispatched action should trace, log a trace (experimental)
    if (traceDispatch) {
      // eslint-disable-next-line no-console
      console.trace(action);
    }
    // if using a memoized record
    if (memo) {
      const memoized = memo.get(JSON.stringify(payload));
      if (memoized) {
        return resolveObservableAs(action$, actionAsyncLifecycle, memoized);
      }
    }
    metaCache.set(name, { ...meta, lastParams: payload, lastCalled: now });
    return observableFromAsyncLifeCycle(
      action$,
      actionAsyncLifecycle,
      payload,
      meta
    );
  };
  return action$.pipe(filter(phaseMatcher), mergeMap(mergeMapAction));
};

const responseDispatchOnPhase = (
  action$: Observable<Action<any>>,
  phase: AsyncPhase,
  dispatch: Dispatch<AnyAction>
): Observable<Action> => {
  const phaseMatcher = asyncActionMatcher(undefined, phase);
  const mergeMapDataAction = (action: AsyncAction<any>) => {
    const name = action[asyncableEmoji].name;
    const meta: AsyncMeta<any, any> = {
      ...naiveAsyncInitialMeta,
      ...metaCache.get(name),
    };
    // resolveData
    if (phase === "data" && meta.resolveData) {
      meta.resolveData(action.payload);
    }
    // onData
    if (phase === "data" && meta.onData) {
      meta.onData(action.payload, meta.lastParams || {}, dispatch);
    }
    // rejectError
    if (phase === "error" && meta.rejectError) {
      meta.rejectError(action.payload);
    }
    // onError
    if (phase === "error" && meta.onError) {
      meta.onError(action.payload, meta.lastParams || {}, dispatch);
    }
    // awaitResolve
    if (phase === "data" && meta.awaitResolve) {
      meta.awaitResolve(action.payload);
    }
    // awaitReject
    if (phase === "error" && meta.awaitReject) {
      meta.awaitReject(action.payload);
    }
    // memoize
    if (phase === "data" && meta.memo) {
      meta.memo.set(JSON.stringify(meta.lastParams), action.payload);
    }
    // subscribe
    if (phase === "subscribe") {
      const actionAsyncLifecycle = cache.get(name);
      const subscribe: number = action.payload;
      clearInterval(meta?.subscribeInterval);
      const subscribeInterval =
        actionAsyncLifecycle && subscribe > 0
          ? setInterval(() => {
              metaCache.get(name)?.abortController?.abort();
              dispatch(actionAsyncLifecycle.sync());
            }, subscribe)
          : undefined;
      metaCache.set(name, { ...meta, subscribe, subscribeInterval });
      return new Observable<never>();
    }
    // expectingData (dataDepends)
    meta.expectingData.forEach((cb) => cb(action.payload));

    const resolveData = phase === "data" ? undefined : meta.resolveData;
    const rejectError = phase === "error" ? undefined : meta.rejectError;
    const dataCount = phase === "data" ? meta.dataCount + 1 : 0;
    const errorCount = phase === "error" ? meta.errorCount + 1 : 0;
    const awaitResolve =
      meta.awaitResolve && phase === "data" ? undefined : meta.awaitResolve;
    const awaitReject =
      meta.awaitReject && phase === "error" ? undefined : meta.awaitReject;
    const record = Date.now() - meta.lastCalled;
    const expectingData: Array<OnData1<any>> =
      phase === "data" ? [] : meta.expectingData;
    const lastData = phase === "data" ? action.payload : meta.lastData;
    const lastError = phase === "error" ? `${action.payload}` : meta.lastError;
    const abortController = phase === "done" ? undefined : meta.abortController;
    metaCache.set(name, {
      ...meta,
      dataCount,
      errorCount,
      record,
      awaitResolve,
      awaitReject,
      resolveData,
      rejectError,
      expectingData,
      lastData,
      lastError,
      abortController,
    });
    return new Observable<never>();
  };
  return action$.pipe(
    filter(phaseMatcher),
    mergeMap(mergeMapDataAction)
  ) as Observable<Action<any>>;
};

/**
 * asyncableMiddleware is the higher order function for dispatching events to the store
 * @param {*} store
 * @returns
 */
export const naiveAsyncMiddleware: Middleware = (store) => {
  const action$: Subject<Action> = new Subject();
  const middleware = $toMiddleware(action$);
  asyncableEpicOnPhase(action$, "call", false).subscribe(store.dispatch);
  asyncableEpicOnPhase(action$, "sync", true).subscribe(store.dispatch);
  responseDispatchOnPhase(action$, "data", store.dispatch).subscribe(
    store.dispatch
  );
  responseDispatchOnPhase(action$, "error", store.dispatch).subscribe(
    store.dispatch
  );
  responseDispatchOnPhase(action$, "subscribe", store.dispatch).subscribe(
    store.dispatch
  );
  return middleware(store);
};

const selectFunction = (id: string) => (state: AsyncableSlice) => {
  const substate: any = state[asyncableEmoji];
  if (substate) {
    if (asyncableEmoji in substate) {
      return substate[asyncableEmoji][id] || naiveAsyncInitialState;
    }
    return substate[id] || naiveAsyncInitialState;
  }
  return naiveAsyncInitialState;
};

const retryOperation = <Data, Params>(
  operation: AsyncFunction<Data, Params>,
  errRetryCb: ErrRetryCb,
  retries = 0
): AsyncFunction<Data, Params> => {
  if (retries <= 0) {
    return operation;
  }
  return (params: Params) =>
    operation(params).catch((err: any) => {
      errRetryCb(err, retries);
      return retryOperation(operation, errRetryCb, retries - 1)(params);
    });
};

/**
 * returns the lifecycle registered with the given id, or undefined if not found
 * NOTE: impure function, refers to managed internal cache of created lifecycles
 * @param {string} id
 * @return {*}  {(AsyncLifecycle<any, any> | undefined)}
 */
export const findLifecycleById = (
  id: string
): AsyncLifecycle<any, any> | undefined => {
  const existing = id && cache.get(id);
  if (existing) {
    return existing;
  }
  return undefined;
};

/**
 * wraps a AsyncFunction and a unique identifier to provide a redux store managed lifecycle
 * This structure manages the provided async function
 * @template Data
 * @template Params
 * @param {AsyncFunction<Data, Params>} operation
 * @param {string} id
 * @returns {AsyncLifecycle<Data, Params>}
 */
export const asyncLifecycle = <Data, Params extends {}>(
  id: string,
  operation: AsyncFunction<Data, Params>,
  options?: AsyncableOptions
): AsyncLifecycle<Data, Params> => {
  const existing = id && cache.get(id);
  if (existing) {
    return existing;
  }
  const factory = asyncActionCreatorFactory(id, options || {});
  const lifecycle = newLifecycleFromFactory(id, operation, factory);
  // cache the created lifecycle and operation
  cache.set(id, lifecycle);
  const operationCopy = operation;
  metaCache.set(id, { ...naiveAsyncInitialMeta, ...options, operationCopy });
  metaCache.get(id);
  // apply certain lifecycle options post-hoc
  if (options) {
    lifecycle.options(options);
  }
  return lifecycle;
};

/**
 * Wraps a AsyncFunction and a unique identifier to provide a redux store managed lifecycle
 * that manages the given async operation, recognized by the given id
 * @template Data
 * @template Params
 * @deprecated favor asyncLifecycle instead
 * @param {AsyncFunction<Data, Params>} operation
 * @param {string} id
 * @returns {AsyncLifecycle<Data, Params>}
 */
export const naiveAsyncLifecycle = <Data, Params extends {}>(
  id: string,
  operation: AsyncFunction<Data, Params>
): AsyncLifecycle<Data, Params> => asyncLifecycle(id, operation);
