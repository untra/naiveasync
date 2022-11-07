/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  AnyAction,
  AsyncableSlice,
  AsyncFunction,
  AsyncMeta,
  AsyncState,
} from "./actions";
import { useStore, useDispatch, Provider } from "react-redux";
import { Middleware, Reducer, Action, Dispatch } from "redux";
import {
  asyncLifecycle,
  AsyncLifecycle,
  naiveAsyncMiddleware,
  naiveAsyncReducer,
} from "./controllable";

type ControllableChildren<State> = (
  state: State,
  dispatch: <A extends AnyAction>(action: A) => void
) => React.ReactNode;

interface ControllableProps<State> {
  children: ControllableChildren<State>;
}

export type Controllable<State> = React.ComponentType<ControllableProps<State>>;

/**
 * Creates a controllable context, wrapping the provided reducer and middleware around dispatched actions.
 *
 * @export
 * @template State
 * @param {Reducer<State>} reducer
 * @param {Middleware} middleware
 * @return {*}  {Controllerable<State>}
 */
export const createControllableContext = <State extends AsyncableSlice>(
  reducer: Reducer<State>,
  middleware: Middleware
): Controllable<State> => {
  const Controllable = <State extends AsyncableSlice>(
    props: ControllableProps<State>
  ) => {
    const store = useStore();
    const dp = useDispatch();
    const [state, setState] = useState<AsyncableSlice>(
      reducer(undefined, { type: "" })
    );
    const internalDispatch: Dispatch<AnyAction> = <A extends Action>(
      action: A
    ) => {
      const dispatchedAction = dp(action);
      setState(reducer(store.getState(), dispatchedAction));
      return dp(dispatchedAction);
    };
    const dispatch = middleware({
      dispatch: internalDispatch, // dispatches loading states
      getState: () => state,
    })(internalDispatch); // dispatches done and error states
    return (
      <Provider store={store}>
        {props.children(state as State, dispatch)}
      </Provider>
    );
  };
  return Controllable;
};

type NaiveAsyncComponentChildren<Data, Params> = (
  state: AsyncState<Data, Params>,
  call: (params: Params) => void
) => JSX.Element;
export interface AsyncComponentChildrenProps<D, P> {
  state: AsyncState<D, P>;
  meta: AsyncMeta<D, P>;
  call: (params: P) => void;
  sync: (params: P) => void;
  reset: () => void;
  destroy: () => void;
  subscribe: (val: number) => void;
}
export type AsyncComponentChildren<Data, Params> = (
  childrenProps: AsyncComponentChildrenProps<Data, Params>
) => JSX.Element;

export interface AsyncComponentProps<Data, Params> {
  children: AsyncComponentChildren<Data, Params>;
  lifecycle: AsyncLifecycle<Data, Params>;
  initialState?: AsyncState<Data, Params>;
}

export interface NaiveAsyncComponentProps<Data, Params> {
  id: string;
  operation: AsyncFunction<Data, Params>;
  autoParams?: Params;
  children: NaiveAsyncComponentChildren<Data, Params>;
}

export interface NaiveLifecycleAsyncProps<Data, Params> {
  params?: Params;
  state: AsyncState<Data, Params>;
  call: (params: Params) => void;
  destroy: () => void;
  children: NaiveAsyncComponentChildren<Data, Params>;
}

export interface LifecycleAsyncProps<Data, Params> {
  state: AsyncState<Data, Params>;
  meta: AsyncMeta<Data, Params>;
  call: (params: Params) => void;
  sync: (params?: Params) => void;
  reset: () => void;
  destroy: () => void;
  subscribe: (val: number) => void;
  children: AsyncComponentChildren<Data, Params>;
}

const NaiveAsyncManaged: React.FC<NaiveLifecycleAsyncProps<any, any>> = <
  Data,
  Params
>(
  props: NaiveLifecycleAsyncProps<Data, Params>
) => {
  const { call, params, children, state, destroy } = props;
  useEffect(() => {
    if (params) {
      call(params);
    }
    // destroy is called when the component unmounts
    return destroy;
    // eslint-disable-next-line
  }, []);
  return children(state, call);
};

export const AsyncManaged: React.FC<LifecycleAsyncProps<any, any>> = <
  Data,
  Params
>(
  props: LifecycleAsyncProps<Data, Params>
) => {
  const { call, children, state, destroy, reset, sync, meta, subscribe } =
    props;
  return children({ state, call, reset, destroy, sync, meta, subscribe });
};

const noop: AsyncFunction<unknown, unknown> = () => Promise.resolve({});

/**
 * The NaiveAsync tag accepts an operation and autoParams object of initial parameters to pass in.
 * @export
 * @template Data
 * @template Params
 * @param {NaiveAsyncComponentProps<Data, Params>} props
 * @returns {React.ReactElement<NaiveAsyncComponentProps<Data, Params>>}
 */

export const NaiveAsync = <Data, Params extends {}>(
  props: NaiveAsyncComponentProps<Data, Params>
): React.ReactElement<NaiveAsyncComponentProps<Data, Params>> => {
  const {
    operation = noop,
    children,
    autoParams,
    id = operation?.name,
  } = props;
  const [state, setState] = useState({
    params: autoParams,
    asyncLifeCycle: asyncLifecycle(id, operation),
    AsyncControllable: createControllableContext(
      naiveAsyncReducer,
      naiveAsyncMiddleware
    ),
  });
  const { params, asyncLifeCycle, AsyncControllable } = state;
  const { selector, call, destroy } = asyncLifeCycle;
  const invoke = (params: Params) => {
    setState({ ...state, params });
  };
  return (
    <AsyncControllable>
      {(reduxState, dispatch) => (
        <NaiveAsyncManaged
          params={params}
          state={selector(reduxState)}
          call={(params: any) => {
            invoke(params as Params);
            dispatch(call(params as Params));
          }}
          destroy={() => {
            dispatch(destroy());
          }}
        >
          {children}
        </NaiveAsyncManaged>
      )}
    </AsyncControllable>
  );
};

/**
 * The Async tag accepts a lifecycle, and an optional desired initial state for the operation (without triggering the underlying async function)
 * @export
 * @template Data
 * @template Params
 * @param {AsyncComponentProps<Data, Params>} props
 * @returns {React.ReactElement<AsyncComponentProps<Data, Params>>}
 */

export const Async = <Data, Params extends {}>(
  props: AsyncComponentProps<Data, Params>
): React.ReactElement<AsyncComponentProps<Data, Params>> => {
  const { children, lifecycle, initialState } = props;
  const [intervalTickle, setIntervalTickle] = useState(0);
  const [state, setState] = useState({
    initState: initialState || undefined,
    Controllable: createControllableContext(
      naiveAsyncReducer,
      naiveAsyncMiddleware
    ),
    subscribeInterval: undefined as any,
  });
  const assignState = (
    dispatch: (action: AnyAction) => void,
    asyncState: AsyncState<Data, Params>
  ) => {
    dispatch(assign(asyncState));
    setState({ ...state, initState: undefined });
  };
  const { Controllable, initState } = state;
  useEffect(() => {
    "noop to rerender";
  }, [intervalTickle]);
  const { selector, call, destroy, reset, sync, meta, assign, subscribe } =
    lifecycle;
  return (
    <Controllable>
      {(reduxState, dispatch) => {
        if (initState) {
          assignState(dispatch, initState);
        }
        return (
          <AsyncManaged
            state={selector(reduxState)}
            meta={meta()}
            call={(params: any) => {
              dispatch(call(params as Params));
            }}
            destroy={() => {
              dispatch(destroy());
            }}
            sync={(params?: any) => {
              dispatch(sync(params as Params));
            }}
            reset={() => {
              dispatch(reset());
            }}
            subscribe={(val: number) => {
              clearInterval(state.subscribeInterval);
              const subscribeInterval =
                val > 0
                  ? setInterval(() => setIntervalTickle(Math.random()), val)
                  : undefined;
              setState({ ...state, subscribeInterval });
              dispatch(subscribe(val));
            }}
          >
            {children as any}
          </AsyncManaged>
        );
      }}
    </Controllable>
  );
};
