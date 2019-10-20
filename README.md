# 🔁 NaiveAsync
## an opinionated and painless [React](https://reactjs.org/) promise wrapper

**NaiveAsync** is a straightforward React `^16.8.5` functional module that can be used to quickly turn an asynchronous operation into a well-managed react component centered around that asynchronous operation.

It turns a promise into a state object to render child components with, and a call function to invoke the promise, with a few abstractions to manage it reasonably well.

Shamelessly built with inspiration from [stately](https://github.com/hiebj/stately)

## Usage

### A little bit of boilerplate...
```tsx
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { applyMiddleware, createStore } from "redux";
import { NaiveAsync, naiveAsyncMiddleware, naiveAsyncReducer } from '@untra/naiveasync'
// the naiveAsyncReducer maintains the redux state
// the naiveAsyncMiddleware employs rxjs observables to fulfill promises
const store = createStore(naiveAsyncReducer, applyMiddleware(naiveAsyncMiddleware))

// supply the created store into your redux provider
// use the <NaiveAsync>(state, call) => react component and callback
// to render your asynchronous state with ease and splendor
// render as you see fit
ReactDOM.render(
<Provider store={store}>
    <NaiveAsync operation={asyncOperation}>(state, call) =>
        (<div>
            <h2>state: {JSON.stringify(state, null, 2)}</h2>
            <button onClick={() => call({ foo: 'bar' })}>
            <p>call</p>
            </button>
        </div>)
    </NaiveAsync>
</Provider>
)

```

## Design

NaiveTable uses react 16.8.5 and hooks to create a straightforward functional JSX.Element react component.

Despite not being written with classes, I kept the [**SOLID principles**](https://en.wikipedia.org/wiki/SOLID) in mind while designing this package:

_Single Responsibility:_ This package does one thing, and does it well.

_Open / Close :_ The rendering and behavior of NaiveTable columns can be extended, and the code is open source.

_Liskov Substitution:_ By rendering arbitrary `DataObjects`, and accepting anonymous functions to return their `JSX.Elements` allow for "subtype" correctness.

_Interface Segregation:_ Inputs to the function are minimized to tolerate a bare-minimum, and accept only more features as desired.

_Dependency Inversion:_ Concrete details such as `data` and `headers` are input into higher-level abstractions.

## Limitations

* _It's super dumb._ NaiveTable will render data naively (duh) by using a series of nested divs, and as such is not the most effective solution with large amounts of data. While NaiveTable will render more than a thousand rows with ease, more than a hundred and I would recommend a more dynamic table solution with virtual scroll. Similarly, I would not recommend this table for the following needs in a table:
  * sorting on multiple columns
  * rendering a large number of rows
  * dynamic 'fetched' data aka virtual scrolling

* _It wants consistency._ NaiveTable likes structured  `Array<T>` of `{ [index: string]: any;}` data shapes. While this should be most use cases, this means unstructured data may not be render consistently.

* _It will reasonably assume what you meant._ NaiveTable's creator has made some assumptions about what you want the component to behave like, such as default rendering `any` data values into `<p></p>` tags, defaulting column widths to `auto`, etc. It is not magic, just trying its best to please.

# Copyright
Copyright (c) Samuel Volin 2019. License: MIT
