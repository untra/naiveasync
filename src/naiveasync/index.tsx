import { useEffect, useState } from 'react'
// tslint:disable-next-line: no-duplicate-imports
import React from 'react'
import { AsyncableState, AsyncGenerator } from './actions'
import { asyncableLifecycle, asyncableMiddleware, asyncableReducer, createControllableContext } from './controllable'

export type NaiveAsyncState<D, P> = AsyncableState<D, P>

export const naiveAsyncReducer = asyncableReducer

export const naiveAsyncMiddleware = asyncableMiddleware

type NaiveAsyncComponentChildren<Data, Params> = (state: AsyncableState<Data, Params>, call: (params: Params) => void) => JSX.Element

interface NaiveAsyncComponentProps<Data, Params extends object> {
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


const AsyncLifecycle: React.FC<LifecycleAsyncProps<any, object>> = <Data, Params>(
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
    });
    return children(state, call)
}

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
    const { operation, children, autoParams } = props
    const [state, setState] = useState({
        params: autoParams,
        asyncLifeCycle: asyncableLifecycle(operation),
        AsyncControllable: createControllableContext(asyncableReducer, asyncableMiddleware),
    });
    const { params, asyncLifeCycle, AsyncControllable } = state
    const { selector, call, destroy } = asyncLifeCycle
    const invoke = (params: Params) => {
        setState({ ...state, params })
    }
    return (<AsyncControllable>{
        (reduxState, dispatch) => <AsyncLifecycle
            params={params}
            state={selector(reduxState)}
            call={(params: object) => {
                invoke(params as Params)
                dispatch(call(params as Params))
            }}
            destroy={() => {
                dispatch(destroy({}))
            }}
        >{children}</AsyncLifecycle>
    }</AsyncControllable>)
}
