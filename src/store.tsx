import { applyMiddleware, compose, createStore, Middleware, StoreEnhancer } from "redux";
import { naiveAsyncEmoji, naiveAsyncMiddleware, naiveAsyncReducer, NaiveAsyncSlice } from "./naiveasync";
// the following resources are needed to specify a redux store with devtools enabled
const getEnhancers = () => {
  const enhancers: StoreEnhancer[] = [];
  const devToolsExtension: () => StoreEnhancer = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }
  return enhancers;
};
export const initialState : NaiveAsyncSlice = {
  [naiveAsyncEmoji]: {},
};
const middlewares: Middleware[] = [naiveAsyncMiddleware]
const enhancers: StoreEnhancer[] = getEnhancers();
const composedEnhancers = compose(applyMiddleware(...middlewares), ...enhancers);

export const createdConnectedStore = () => createStore(naiveAsyncReducer, initialState, composedEnhancers as any)
