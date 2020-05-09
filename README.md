# 🔁 NaiveAsync
## an opinionated and painless [React](https://reactjs.org/) n [Redux](https://redux.js.org/) promise wrapper

* [homepage](https://naiveasync.untra.io/)
* [tests](https://naiveasync.untra.io/#/test)
* [npm package](https://www.npmjs.com/package/@untra/naiveasync)

**NaiveAsync** is a straightforward React functional module that can be used to quickly turn an asynchronous operation into a well-managed react component centered around that asynchronous operation.

NaiveAsync will autogenerate your redux selectors, dispatch operations, and provide a managed lifecycle object you can control around your async operations for use in react components.

It turns a promise into a state object to render child components with, and a call function to invoke the promise, with just a few abstractions to manage it reasonably well.

## Usage

### A little bit of boilerplate...
```tsx
import * as ReactDOM from "react-dom";
import { Provider } from "redux";
import { applyMiddleware, createStore } from "redux";
import { NaiveAsync, naiveAsyncMiddleware, naiveAsyncReducer } from '@untra/naiveasync'
// the naiveAsyncReducer maintains the redux state
// the naiveAsyncMiddleware employs rxjs observables to fulfill promises
const store = createStore(naiveAsyncReducer, applyMiddleware(naiveAsyncMiddleware))

// supply the created store into your redux provider
// use the <NaiveAsync>(state, call) => react component and callback
// to render your asynchronous state with ease and splendor
ReactDOM.render(
<Provider store={store}>
    <NaiveAsync operation={asyncOperation}>(state, call) => (
        state.data ? <h2>{state.data}</h2> :
        state.error ? <h2>ERROR {state.error}</h2> :
        state.status === 'inflight' ? <h2>loading...</h2> :
        <button onclick={call()}>call</button>
    )
    </NaiveAsync>
</Provider>
)

```

## Design

NaiveAsync uses react [16.8.5 hooks](https://reactjs.org/docs/hooks-intro.html) to create an asynchronous experience you could take home to your mother.

Promises are a powerful tool in javascript, and a wrapper to abstract its most common uses into a simple react component that _just works_ is the goal here.

Some Terminology:
* an `AsyncOperation<D,P>` is a function that takes `(P)` and returns a `Promise<D>`
* an `naiveasyncstate` is an object of type
```ts
{
  status: '' | 'inflight' | 'error' | 'done'
  error: string
  params: <P extends {}>
  data: null|D
}
```

## Feature wishlist:

* swap placement of P and D, rename the dang thing
* rename the `AsyncState` type
* `.timeout()` will stop the async function and error after a specified timeout
* `.subscribe()` retries the request on a given interval
* `.onData((data? : D, dispatch? : Dispatch<AnyAction>) => void)` data callback with dispatch function
* `.onError((error? : string, dispatch? : Dispatch<AnyAction>) => void)` error callback with dispatch
* `.memoized(enabled? : boolean = true)` keeps a record of inputs and their outputs, and returns the cached results
* `.exponentialErrorRetry(enabled? : boolean = true)` retries the request if it fails a few seconds from now, following exponential backoff
* `.exponentialDataSync(enabled? : boolean = true)`
* lifecycle `.meta` display meta information about the selector eg:
  * consecutive data count
  * consecutive error count
  * time inflight : number
  * timeout number
  * error retry bool
  * data retry bool
*
* test support as observable / generator

# Copyright
Copyright (c) Samuel Volin 2020. License: MIT
