import { Reducer } from 'redux'
import { AnyAction, isAsyncAction, naiveAsyncEmoji, naiveAsyncInitialState, NaiveAsyncState } from './actions'

const callReducer: Reducer<NaiveAsyncState<any, any>, AnyAction> = (state: NaiveAsyncState<any, any> = naiveAsyncInitialState, action: AnyAction) =>
  isAsyncAction(action) && action[naiveAsyncEmoji].phase === 'call'
    ? {
      ...state,
      status: 'inflight',
      params: action.payload,
      data: null,
      error: '',
    }
    : state

const syncReducer: Reducer<NaiveAsyncState<any, any>, AnyAction> = (state: NaiveAsyncState<any, any> = naiveAsyncInitialState, action: AnyAction) => {
    if (isAsyncAction(action) && action[naiveAsyncEmoji].phase === 'sync') {
      const params = state.params
      return {
        ...state,
        status: 'inflight',
        params,
      }
    }
    return state
}

const durationReducer: Reducer<NaiveAsyncState<any, any>, AnyAction> = (state: NaiveAsyncState<any, any> = naiveAsyncInitialState, action: AnyAction) => {
  if (isAsyncAction(action) && action[naiveAsyncEmoji].phase === 'duration') {
    return {
      ...state,
      duration: action.payload
    }
  }
  return state
}

const recordReducer: Reducer<NaiveAsyncState<any, any>, AnyAction> = (state: NaiveAsyncState<any, any> = naiveAsyncInitialState, action: AnyAction) => {
  if (isAsyncAction(action) && action[naiveAsyncEmoji].phase === 'duration') {
    return {
      ...state,
      duration: action.payload ? 0 : undefined
    }
  }
  return state
}

const clearReducer: Reducer<NaiveAsyncState<any, any>, AnyAction> = (state: NaiveAsyncState<any, any> = naiveAsyncInitialState, action: AnyAction) => {
  if (isAsyncAction(action) && action[naiveAsyncEmoji].phase === 'clear') {
    return {
      ...state,
      interval: undefined,
      duration: undefined
    }
  }
  return state
}

const syncIntervalReducer: Reducer<NaiveAsyncState<any, any>, AnyAction> = (state: NaiveAsyncState<any, any> = naiveAsyncInitialState, action: AnyAction) => {
  if (isAsyncAction(action) && action[naiveAsyncEmoji].phase === 'syncInterval') {
    return {
      ...state,
      interval: action.payload
    }
  }
  return state
}

const dataReducer: Reducer<NaiveAsyncState<any, any>, AnyAction> = (state: NaiveAsyncState<any, any> = naiveAsyncInitialState, action: AnyAction) =>
  isAsyncAction(action) && action[naiveAsyncEmoji].phase === 'data'
    ? {
      ...state,
      data: action.payload,
      error: '',
    }
    : state

const errorReducer: Reducer<NaiveAsyncState<any, any>, AnyAction> = (state: NaiveAsyncState<any, any> = naiveAsyncInitialState, action: AnyAction) => {
  if (isAsyncAction(action) && action[naiveAsyncEmoji].phase === 'error') {
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

const doneReducer: Reducer<NaiveAsyncState<any, any>, AnyAction> = (state: NaiveAsyncState<any, any> = naiveAsyncInitialState, action: AnyAction) =>
  isAsyncAction(action) && action[naiveAsyncEmoji].phase === 'done'
    ? {
      ...state,
      status: 'done',
      error: '',
    }
    : state

const resetReducer: Reducer<NaiveAsyncState<any, any>, AnyAction> = (state: NaiveAsyncState<any, any> = naiveAsyncInitialState, action: AnyAction) =>
  isAsyncAction(action) && action[naiveAsyncEmoji].phase === 'reset' ? naiveAsyncInitialState : state

export const chain = <S>(firstReducer: Reducer<S>, ...reducers: Array<Reducer<S>>): Reducer<S> => (
  state: any,
  action: any,
) =>
  reducers.reduce(
    (accumulatedState, nextReducer) => nextReducer(accumulatedState, action),
    firstReducer(state, action),
  )


export const asyncStateReducer = chain(callReducer, syncReducer, dataReducer, errorReducer, doneReducer, resetReducer, clearReducer, syncIntervalReducer, recordReducer, durationReducer)
