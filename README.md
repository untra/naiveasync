# 🔁 NaiveAsync
## an opinionated and painless [React](https://reactjs.org/) n [Redux](https://redux.js.org/) promise wrapper

* [homepage](https://naiveasync.untra.io/)
* [tests](https://naiveasync.untra.io/#/test)
* [npm package](https://www.npmjs.com/package/@untra/naiveasync)

> _Simultaneously master redux and never have to write it ever again_

**NaiveAsync** is a variety of utilities for cleanly turning promises into state for react components, managing redux.
It is a straightforward React functional module that can be used to quickly turn an asynchronous function into a managed and cached lifecycle object that can represent components in various states. 

Real quick: an [async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) can be specified with the `async function` keyword, or can be understand to be a _function that returns a promise_ or `() => Promise`.

NaiveAsync will autogenerate your redux selectors, dispatch operations, and provide a managed lifecycle object you can control around your async operations for use in react components.

The AsyncLifecycle will turn an async function into a state object to render child components with, redux action creators, selectors, and reducers to manage the promise state in redux, with a bunch of other tools for combining operation wiring.

_basically its a swiss army knife that does all your redux for you and makes your storybook better_

## Usage

NaiveAsync is a variety of utilities. At its core are two main tools though:

* `asyncLifecycle` - which turns a () => Promise into the swiss army knife of managed redux goodness
* `<NaiveAsync>` - all that as an exotic react component

### NaiveAsync
```tsx
import * as ReactDOM from "react-dom";
import { Provider } from "redux";
import { applyMiddleware, createStore } from "redux";
import { NaiveAsync, naiveAsyncMiddleware, naiveAsyncReducer } from '@untra/naiveasync'
// the naiveAsyncReducer maintains the redux state
// the naiveAsyncMiddleware employs rxjs observables to fulfill promises
const store = createStore(naiveAsyncReducer, applyMiddleware(naiveAsyncMiddleware))

// an async function is a function that returns a promise.
const asyncOperation = (val: number) => new Promise((resolve) => {
  const timeMS = Math.random() * 4000
  setTimeout(() => resolve(val), timeMS)
})

// supply the created store into your redux provider
// use the <NaiveAsync>(state, call) => react component and callback
// to render your asynchronous state with ease and splendor
ReactDOM.render(
<Provider store={store}>
    <NaiveAsync operation={asyncOperation} id={"example"}>(state, call) => (
        state.data ? <h2>{state.data}</h2> :
        state.status === 'inflight' ? <h2>loading...</h2> :
        <button onclick={call()}>call</button>
    )
    </NaiveAsync>
</Provider>
)

```
### asyncLifecycle

This function takes in an async function and an identifier that is used in the redux store to namespace your promise state.

If you're interested in what it does, it'll be easier just to [point you to the code](https://github.com/untra/naiveasync/blob/master/src/naiveasync/controllable.tsx#L33).

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

### Simmilar but worse

to achieve the simmilar goals as what react + redux + naiveasync can provide, heres a starting point for your other framework or whatever

- [angular](https://stackoverflow.com/a/24091953/1435958)
- [svelte](https://svelte-recipes.netlify.app/components/)

## Recommended usage arround REST APIs

* use `.OnData` to dispatch a .sync indexing calls on create, update and destory 
* use `.debounce` on search calls, to ensure that the underlying operation is not repeated
* use a 2 - 6 seconds `.subscribe` for live dashboards and gentle api usage.
* use a (very low > 1000 ms) `.throttle` on index calls, so multiple resources that need it can receive it
* sensitive calls that should not throw an error (eg. login / auth) can use .onError to dispatch emergency logout
* calls to the api whose response is not likely to change with can use .memoize(true)
* testing utilities pair nicely with storybook
* best served with typescript

## 1.0.0 feature wishlist:

* ~~swap placement of P and D, rename the dang thing~~
* ~~rename the `AsyncState` type~~
* ~~`.timeout()` will stop the async function and error after a specified timeout~~
* ~~`.subscribe()` retries the request on a given interval~~
* ~~`.onData((data? : D, dispatch? : Dispatch<AnyAction>) => void)` data callback with dispatch function~~
* ~~`.onError((error? : string, dispatch? : Dispatch<AnyAction>) => void)` error callback with dispatch~~
* ~~`.memoized(enabled? : boolean = true)` keeps a record of inputs and their outputs, and returns the cached results~~
* `.exponentialErrorRetry(enabled? : boolean = true)` if the request errors, retries the request if it fails a few seconds from now, following an exponential backoff strategy
* ~~lifecycle `.meta` display meta information about the selector eg:~~
  * ~~consecutive data count~~
  * ~~consecutive error count~~
  * ~~time inflight : number~~
  * ~~timeout number~~
  * ~~debounce number~~
  * ~~throttle number~~
  * ~~error retry bool~~
  * ~~data retry bool~~
* test support for immutablejs
* test support as observable / generator

## Copyright
Copyright (c) Samuel Volin 2021. License: MIT

