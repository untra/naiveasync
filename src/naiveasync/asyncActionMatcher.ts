import { AnyAction, AsyncAction, AsyncPhase, isAsyncAction, naiveAsyncEmoji, NaiveAsyncFunction } from "./actions";

const asyncActionMatchesPhase = (action: AsyncAction<any>, phase?: AsyncPhase) => {
    return !!(!phase || action[naiveAsyncEmoji].phase === phase)
}

const asyncActionMatchesOperation = (action: AsyncAction<any>, operation?: NaiveAsyncFunction<any, any>) => {
    return (!operation || (operation.name && operation.name === action[naiveAsyncEmoji].name))
}

type OnData = <Data>(data: Data) => void
type OnError = (error: string) => void

/**
 * an action matcher typeguard for a given operation and phase
 * @export
 * @template Data
 * @template Params
 * @param {(NaiveAsyncFunction<Data, Params> | undefined)} operation
 * @param {AsyncPhase | undefined} phase
 * @returns {(action: AnyAction) => action is AsyncAction<any>}
 */
export function asyncActionMatcher<Data extends any, Params extends object>(
    operation: NaiveAsyncFunction<Data, Params> | undefined,
    phase: 'call',
): (action: AnyAction) => action is AsyncAction<Params>

export function asyncActionMatcher<Data, Params extends object>(
    operation: NaiveAsyncFunction<Data, Params> | undefined,
    phase: 'sync',
): (action: AnyAction) => action is AsyncAction<Params>

export function asyncActionMatcher<Data, Params extends object>(
    operation: NaiveAsyncFunction<Data, Params> | undefined,
    phase: 'data',
): (action: AnyAction) => action is AsyncAction<Data>

export function asyncActionMatcher<Data, Params extends object>(
    operation: NaiveAsyncFunction<Data, Params> | undefined,
    phase: 'error',
): (action: AnyAction) => action is AsyncAction<string>

export function asyncActionMatcher<Data, Params extends object>(
    operation: NaiveAsyncFunction<Data, Params> | undefined,
    phase: 'syncTimeout' | 'syncInterval',
): (action: AnyAction) => action is AsyncAction<number>

export function asyncActionMatcher<Data, Params extends object>(
    operation: NaiveAsyncFunction<Data, Params> | undefined,
    phase: 'reset' | 'clear',
): (action: AnyAction) => action is AsyncAction<undefined>

export function asyncActionMatcher<Data, Params extends object>(
    operation: NaiveAsyncFunction<Data, Params> | undefined,
    phase: 'onData',
): (action: AnyAction) => action is AsyncAction<OnData>

export function asyncActionMatcher<Data, Params extends object>(
    operation: NaiveAsyncFunction<Data, Params> | undefined,
    phase: 'onError',
): (action: AnyAction) => action is AsyncAction<OnError>

export function asyncActionMatcher<Data, Params>(
    operation?: NaiveAsyncFunction<Data, Params>,
    phase?: AsyncPhase,
): (action: AnyAction) => action is AsyncAction<Params>

export function asyncActionMatcher<Data, Params>(
    operation?: NaiveAsyncFunction<Data, Params>,
    phase?: AsyncPhase,
) {
    return (action: AnyAction) =>
        isAsyncAction(action)
        && asyncActionMatchesPhase(action, phase)
        && asyncActionMatchesOperation(action, operation)
}
