import { Reducer } from 'redux'
import { AnyAction, AsyncableState, AsyncableSymbol, initialAsyncableState, isAsyncAction } from './actions'

const callReducer: Reducer<AsyncableState<any, any>, AnyAction> = (state = initialAsyncableState, action) =>
  isAsyncAction(action) && action[AsyncableSymbol].phase === 'call'
    ? {
      ...state,
      status: 'inflight',
      params: action.payload,
      data: null,
      error: '',
    }
    : state

const dataReducer: Reducer<AsyncableState<any, any>, AnyAction> = (state = initialAsyncableState, action) =>
  isAsyncAction(action) && action[AsyncableSymbol].phase === 'data'
    ? {
      ...state,
      data: action.payload,
      error: '',
    }
    : state

const errorReducer: Reducer<AsyncableState<any, any>, AnyAction> = (state = initialAsyncableState, action) => {
  if (isAsyncAction(action) && action[AsyncableSymbol].phase === 'error') {
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

const doneReducer: Reducer<AsyncableState<any, any>, AnyAction> = (state = initialAsyncableState, action) =>
  isAsyncAction(action) && action[AsyncableSymbol].phase === 'done'
    ? {
      ...state,
      status: 'done',
      error: '',
    }
    : state

const resetReducer: Reducer<AsyncableState<any, any>, AnyAction> = (state = initialAsyncableState, action) =>
  isAsyncAction(action) && action[AsyncableSymbol].phase === 'reset' ? initialAsyncableState : state

export const chain = <S>(firstReducer: Reducer<S>, ...reducers: Array<Reducer<S>>): Reducer<S> => (
  state,
  action,
) =>
  reducers.reduce(
    (accumulatedState, nextReducer) => nextReducer(accumulatedState, action),
    firstReducer(state, action),
  )


export const asyncStateReducer = chain(callReducer, dataReducer, errorReducer, doneReducer, resetReducer)
