import { Reducer } from 'redux'
import { AnyAction, AsyncableEmoji, AsyncableState, initialAsyncableState, isAsyncAction } from './actions'

const callReducer: Reducer<AsyncableState<any, any>, AnyAction> = (state: AsyncableState<any, any> = initialAsyncableState, action: AnyAction) =>
  isAsyncAction(action) && action[AsyncableEmoji].phase === 'call'
  ? {
    ...state,
    status: 'inflight',
    params: action.payload,
    data: null,
    error: '',
  }
  : state

const dataReducer: Reducer<AsyncableState<any, any>, AnyAction> = (state: AsyncableState<any, any> = initialAsyncableState, action: AnyAction) =>
  isAsyncAction(action) && action[AsyncableEmoji].phase === 'data'
    ? {
      ...state,
      data: action.payload,
      error: '',
    }
    : state

const errorReducer: Reducer<AsyncableState<any, any>, AnyAction> = (state: AsyncableState<any, any> = initialAsyncableState, action: AnyAction) => {
  if (isAsyncAction(action) && action[AsyncableEmoji].phase === 'error') {
    const isError = (a: Error | any): a is Error => a instanceof Error
    const error: string = isError(action.payload) ? action.payload.message :
      typeof action.payload === 'object' ? JSON.stringify(action.payload) :
        action.payload
    return {
      ...state,
      status: 'error',
      error,
    }
  }
  return state
}

const doneReducer: Reducer<AsyncableState<any, any>, AnyAction> = (state: AsyncableState<any, any> = initialAsyncableState, action: AnyAction) =>
  isAsyncAction(action) && action[AsyncableEmoji].phase === 'done'
    ? {
      ...state,
      status: 'done',
      error: '',
    }
    : state

const resetReducer: Reducer<AsyncableState<any, any>, AnyAction> = (state: AsyncableState<any, any> = initialAsyncableState, action: AnyAction) =>
  isAsyncAction(action) && action[AsyncableEmoji].phase === 'reset' ? initialAsyncableState : state

export const chain = <S>(firstReducer: Reducer<S>, ...reducers: Array<Reducer<S>>): Reducer<S> => (
  state: any,
  action: any,
) =>
  reducers.reduce(
    (accumulatedState, nextReducer) => nextReducer(accumulatedState, action),
    firstReducer(state, action),
  )


export const asyncStateReducer = chain(callReducer, dataReducer, errorReducer, doneReducer, resetReducer)
