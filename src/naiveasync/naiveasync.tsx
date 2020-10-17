import React, { useEffect, useState } from 'react'
import { NaiveAsyncFunction, NaiveAsyncState } from './actions'
import { AsyncLifecycle, createControllableContext, naiveAsyncLifecycle, naiveAsyncMiddleware, naiveAsyncReducer } from './controllable'

export type NaiveAsyncComponentChildren<Data, Params> = (state: NaiveAsyncState<Data, Params>, call: (params: Params) => void) => JSX.Element

export interface NaiveAsyncComponentProps<Data, Params> {
    id?: string
    operation?: NaiveAsyncFunction<Data, Params>
    autoParams?: Params
    children: NaiveAsyncComponentChildren<Data, Params>
    lifecycle?: AsyncLifecycle<Data, Params>
}

export interface LifecycleAsyncProps<Data, Params> {
    params?: Params
    state: NaiveAsyncState<Data, Params>
    call: (params: Params) => void
    destroy: () => void
    children: NaiveAsyncComponentChildren<Data, Params>
}


export const AsyncManaged: React.FC<LifecycleAsyncProps<any, object>> = <Data, Params>(
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

const noop = () => Promise.resolve({})

/**
 * the NaiveAsync tag accepts an operation and autoParams object of initial parameters to pass in, 
 *
 * @export
 * @template Data
 * @template Params
 * @param {NaiveAsyncComponentProps<Data, Params>} props
 * @returns {React.ReactElement<NaiveAsyncComponentProps<Data, Params>>}
 */
export function NaiveAsync<Data, Params extends object>(props: NaiveAsyncComponentProps<Data, Params>): React.ReactElement<NaiveAsyncComponentProps<Data, Params>> {
    const { operation, children, autoParams, id, lifecycle } = props
    const [state, setState] = useState({
        params: autoParams,
        asyncLifeCycle: lifecycle ? lifecycle : naiveAsyncLifecycle(operation || noop, id || operation?.name || ''),
        AsyncControllable: createControllableContext(naiveAsyncReducer, naiveAsyncMiddleware),
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
                dispatch(destroy())
            }}
        >{children}</AsyncManaged>
    }</AsyncControllable>)
}
