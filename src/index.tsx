/* tslint:disable */
import ReactDOM from "react-dom";
import { Provider } from 'react-redux';
import { applyMiddleware, createStore,  } from "redux";
import { naiveAsyncMiddleware, naiveAsyncReducer } from '../src/naiveasync/index'
import routes from './routes'
import React from "react";
// the naiveAsyncReducer maintains the redux state
// the naiveAsyncMiddleware employs rxjs observables to fulfill promises
const store = createStore(naiveAsyncReducer, applyMiddleware(naiveAsyncMiddleware))

// supply the created store into your redux provider
// use the <NaiveAsync>(state, call) => react component and callback
// to render your asynchronous state with ease and splendor

ReactDOM.render(<Provider store={store} >{routes()}</Provider>, document.getElementById("root"));
