import { useEffect, useState } from 'react'
// tslint:disable-next-line: no-duplicate-imports
import React from 'react'
import { AsyncableEmoji, AsyncableSlice, AsyncableState, AsyncGenerator } from './actions'
import { asyncableLifecycle, asyncableMiddleware, asyncableReducer, AsyncLifecycle, createControllableContext } from './controllable'

type NaiveAsyncComponentChildren<Data, Params> = (state: AsyncableState<Data, Params>, call: (params: Params) => void) => JSX.Element

interface NaiveAsyncComponentProps<Data, Params extends object> {
    id: string
    operation: AsyncGenerator<Data, Params>
    autoParams?: Params
    children: NaiveAsyncComponentChildren<Data, Params>
}

interface LifecycleAsyncProps<Data, Params> {
    params?: Params
    state: AsyncableState<Data, Params>
    call: (params: Params) => void
    destroy: () => void
    children: NaiveAsyncComponentChildren<Data, Params>
}


const AsyncManaged: React.FC<LifecycleAsyncProps<any, object>> = <Data, Params>(
    props: LifecycleAsyncProps<Data, Params>
) => {
    const { call, params, children, state, destroy } = props
    // this useEffect will
    // (if props.params is truthy)
    // invoke call with params whenever params change
    // and when the component is disposed of it should destroy itself
    useEffect(() => {
        if (params) {
            call(params)
        }
        // destroy is called when the component unmounts
        return destroy
        // eslint-disable-next-line
    }, []);
    return children(state, call)
}

// type ControllableChildren<State> = (
//     state: State,
//     dispatch: <A extends AnyAction>(action: A) => void,
//   ) => React.ReactNode

// interface ControllableProps<State> = (
//     children: ControllableChildren<State>
// ) =>

// const ControllableWrapper : React.ReactElement = (props: ControllableProps) => {
//     store = useState

//     return (<div></div>)
// }

/** a function that takes a singular params object P, returning a Promise<D> */
export type NaiveAsyncFunction<D, P> = AsyncGenerator<D, P>

/** The state of a NaiveAsyncFunction, encompassing status, params, error, data */
export type NaiveAsyncState<D, P> = AsyncableState<D, P>

/** The redux store type that is accepted as input to an NaiveAsyncLifecycle selector  */
export type NaiveAsyncSlice = AsyncableSlice

/** The managed async lifecycle object of a given NaiveAsyncFunction */
export type NaiveAsyncLifecycle<D, P> = AsyncLifecycle<D, P>

/** 🔁 if you're into the whole brevity thing */
export const naiveAsyncEmoji = AsyncableEmoji

/** a reducer to plug into your redux combineReducers */
export const naiveAsyncReducer = asyncableReducer

/** middleware to plug into your redux combineMiddleware */
export const naiveAsyncMiddleware = asyncableMiddleware

/** wraps a NaiveAsyncFunction and a unique identifier to provide a redux store managed lifecycle  */
export const naiveAsyncLifecycle = asyncableLifecycle

/**
 * the NaiveAsync tag accepts an operation and autoParams object of initial parameters to pass in
 *
 * @export
 * @template Data
 * @template Params
 * @param {NaiveAsyncComponentProps<Data, Params>} props
 * @returns {React.ReactElement<NaiveAsyncComponentProps<Data, Params>>}
 */
export function NaiveAsync<Data, Params extends object>(props: NaiveAsyncComponentProps<Data, Params>): React.ReactElement<NaiveAsyncComponentProps<Data, Params>> {
    const { operation, children, autoParams, id } = props
    const [state, setState] = useState({
        params: autoParams,
        asyncLifeCycle: asyncableLifecycle(operation, id),
        AsyncControllable: createControllableContext(asyncableReducer, asyncableMiddleware),
    });
    const { params, asyncLifeCycle, AsyncControllable } = state
    const { selector, call, destroy } = asyncLifeCycle
    const invoke = (params: Params) => {
        setState({ ...state, params })
    }
    return (<AsyncControllable>{
        (reduxState, dispatch) => <AsyncManaged
            params={params}
            state={selector(reduxState)}
            call={(params: object) => {
                invoke(params as Params)
                dispatch(call(params as Params))
            }}
            destroy={() => {
                dispatch(destroy({}))
            }}
        >{children}</AsyncManaged>
    }</AsyncControllable>)
}
