# 🔁 NaiveAsync
## an opinionated and painless [React](https://reactjs.org/) promise wrapper

[npm package](https://www.npmjs.com/package/@untra/naiveasync)

**NaiveAsync** is a straightforward React `^16.8.5` functional module that can be used to quickly turn an asynchronous operation into a well-managed react component centered around that asynchronous operation.

It turns a promise into a state object to render child components with, and a call function to invoke the promise, with a few abstractions to manage it reasonably well.

Shamelessly built with serious inspiration from [stately](https://github.com/hiebj/stately)

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

NaiveAsync uses react 16.8.5 and hooks to create an asynchronous experience you could take home to your mother.

Promises are a powerful tool in javascript, and a wrapper to abstract its most common uses into a simple react component that _just works._

<!-- Despite not being written with classes, I kept the [**SOLID principles**](https://en.wikipedia.org/wiki/SOLID) in mind while designing this package:

_Single Responsibility:_ This package does one thing, and does it well.

_Open / Close :_ The rendering and behavior of NaiveTable columns can be extended, and the code is open source.

_Liskov Substitution:_ By rendering arbitrary `DataObjects`, and accepting anonymous functions to return their `JSX.Elements` allow for "subtype" correctness.

_Interface Segregation:_ Inputs to the function are minimized to tolerate a bare-minimum, and accept only more features as desired.

_Dependency Inversion:_ Concrete details such as `data` and `headers` are input into higher-level abstractions. -->

## Limitations

# Copyright
Copyright (c) Samuel Volin 2019. License: MIT
