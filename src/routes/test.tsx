/***
 * Naivetable Tests
 * MIT License
 * Made with 💙 by @untra
 * ---
 */
import React from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { Provider } from "react-redux";
import { applyMiddleware, createStore } from "redux";
import * as packagejson from '../../package.json'
import { NaiveAsyncState } from "../naiveasync/actions"
import { NaiveAsync, naiveAsyncMiddleware, naiveAsyncReducer } from "../naiveasync/index"
import DebounceTest from './components/debounceTest'
import MemoizedSync from './components/memoized'
import MetadataTest from './components/metadataTest'
import OnDataSync from './components/onData'
import OnErrorSync from './components/onError'
import RandomNumberSelectableSync from './components/RandomNumberSelectableSync'
import RandomNumberSync from './components/RandomNumberSync'
import ThrottleTest from './components/throttleTest'
import TimeoutSync from './components/timeout'


const store = createStore(naiveAsyncReducer, applyMiddleware(naiveAsyncMiddleware))

const emojiView = (state: NaiveAsyncState<any, {}>) => (<p>{
  state.status === 'inflight' ? '💬'
    : state.error ? '💥'
      : state.data ? '✔️'
        : '❌'
} {`${state.data}`} {`${state.status}`} {`${state.error}`} </p>)

// eslint-disable-next-line
const callableView = (state: NaiveAsyncState<any, {}>, call: ({ }) => any) => (<button onClick={call}>{
  state.status === 'inflight' ? '💬'
    : state.error ? '💥'
      : state.data ? '✔️'
        : '❌'
} {`${state.status}`} </button>)

const slowResolve = <T extends any>(val: T): Promise<T> => new Promise((resolve) => {
  const timeMS = Math.random() * 4000
  setTimeout(() => resolve(val), timeMS)
})

const autoParamsOp = (params: {}) => {
  return Promise.resolve(`✅ with params ${JSON.stringify(params)}`)
}

const autoResolve = (params: {}) => slowResolve('✅')

// Hi friend 👋 thanks for reading my naiveasync tests!
// maybe you're on this github page?

const thisGithubPage =
  "https://github.com/untra/naiveasync/blob/master/src/routes/test.tsx";

// If you are, then I want to know you are a talented and skilled engineer,
// and it would certainly be a pleasure to shake your hand one day,
// and tell you personally _just how cool you are_

// While you're here you may also want to check out that cypress page:
const thatCypressPage = "https://dashboard.cypress.io/#/projects/wrytfx/runs";



const timeoutResolve = <T extends any>(resolveTo: any, timeout = 4000): Promise<T> => new Promise((res) => {
  setTimeout(() => res(resolveTo), timeout)
})

const timeoutReject = <T extends any>(rejectTo: any, timeout = 4000) => new Promise((_, rej) => {
  setTimeout(() => rej(rejectTo), timeout)
})

const namedFunction = function namedFunction() {
  return timeoutResolve(true)
}



export default class Test extends React.Component {
  public render() {
    return (
      <div className="wrapper">
        <h1>
          <span role="img" aria-label="Bento">
            🔁
          </span>{" "}
          NaiveAsync
        </h1>
        <h2>Cypress Tests and demonstration</h2>
        <h3>
          View this page and tests at <a href={thisGithubPage}>Github.com</a>
        </h3>
        <h3>
          View the test results at <a href={thatCypressPage}>Cypress.io</a>
        </h3>
        <h4>version {packagejson.version}</h4>
        <p>
          This page is a demonstration of the NaiveTable component used in a
          variety of ways:
        </p>
        <ul>
          <li>It is the selection and input to a variety of cypress tests.</li>
          <li>
            This is also a demonstration of the power of react-hooks, a
            functional and clean approach to writing react components.
          </li>
          <li>
            View the chrome console to see statistics and reports of how the
            examples render. (coming soon)
        </li>
        </ul>
        <h4>
          #1 It should be invoked automatically when autoParams are specified...
        </h4>
        <NaiveAsync id="NA1" operation={autoParamsOp} autoParams={{}} >{(state: any) => (<div>
          <p>status: {JSON.stringify(state.status)}</p>
          <p>params: {JSON.stringify(state.params)}</p>
          <p>error: {JSON.stringify(state.error)}</p>
          <p>data: {JSON.stringify(state.data)}</p>
        </div>)}</NaiveAsync>
        <h4>
          #2 It can be invoked when the call cb is invoked
        </h4>
        <NaiveAsync id="NA2" operation={autoParamsOp} >{(state, call) => (<div>
          <p>status: {JSON.stringify(state.status)}</p>
          <p>params: {JSON.stringify(state.params)}</p>
          <p>error: {JSON.stringify(state.error)}</p>
          <p>data: {JSON.stringify(state.data)}</p>
          <button onClick={() => call({})} >call</button>
        </div>)}</NaiveAsync>
        <h4>
          #3 Multiple autoParamed operations should execute
        </h4>
        <NaiveAsync id="NA3a" operation={autoResolve} autoParams={{}} >{(state: any) => (<div>
          <p>{state.data || '💬'}</p>
        </div>)}</NaiveAsync>
        <NaiveAsync id="NA3b" operation={autoResolve} autoParams={{}} >{(state: any) => (<div>
          <p>{state.data || '💬'}</p>
        </div>)}</NaiveAsync>
        <NaiveAsync id="NA3c" operation={autoResolve} autoParams={{}} >{(state: any) => (<div>
          <p>{state.data || '💬'}</p>
        </div>)}</NaiveAsync>
        <h4>
          #4 a circus of promises
        </h4>
        <NaiveAsync id="NA4a" operation={() => Promise.resolve(true)} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA4b" operation={() => Promise.resolve(false)} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA4c" operation={() => Promise.reject('boom')} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA4d" operation={() => Promise.reject(new Error('kaboom!'))} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA4e" operation={() => timeoutResolve(true)} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA4f" operation={() => timeoutResolve(false)} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA4g" operation={() => timeoutReject('slow boom') as Promise<boolean>} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA4h" operation={() => timeoutReject(new Error('slow kaboom!')) as Promise<boolean>} autoParams={{}}>{emojiView}</NaiveAsync>
        <h4>
          #5 callable promises
        </h4>
        <NaiveAsync id="NA5a" operation={() => Promise.resolve(true)}>{callableView}</NaiveAsync>
        <NaiveAsync id="NA5b" operation={() => timeoutResolve(true)}>{callableView}</NaiveAsync>
        <NaiveAsync id="NA5c" operation={() => slowResolve(true)}>{callableView}</NaiveAsync>
        <h4>
          #6 very small timeouts
        </h4>
        <NaiveAsync id="NA6a" operation={() => timeoutResolve(true, 1)} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA6b" operation={() => timeoutResolve(true, 2)} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA6c" operation={() => timeoutResolve(true, 3)} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA6d" operation={() => timeoutResolve(true, 4)} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA6e" operation={() => timeoutResolve(true, 5)} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA6f" operation={() => timeoutResolve(true, 6)} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA6g" operation={() => timeoutResolve(true, 7)} autoParams={{}}>{emojiView}</NaiveAsync>
        <NaiveAsync id="NA6h" operation={() => timeoutResolve(true, 8)} autoParams={{}}>{emojiView}</NaiveAsync>
        <h4>
          #7 shared id experiment
        </h4>
        <NaiveAsync id="NA7" operation={namedFunction}>{callableView}</NaiveAsync>
        <NaiveAsync id="NA7" operation={namedFunction}>{callableView}</NaiveAsync>
        <NaiveAsync id="NA7" operation={namedFunction}>{callableView}</NaiveAsync>
        <h4>
          #8 lifecycle sync
        </h4>
        <Provider store={store}>
          <RandomNumberSync />
        </Provider>
        <h4>
          #9 lifecycle sync retains last passed params
        </h4>
        <Provider store={store}>
          <RandomNumberSelectableSync />
        </Provider>

        <h4>
          #10 test memoized
        </h4>
        <Provider store={store}>
          <MemoizedSync />
        </Provider>

        <h4>
          #11 test timeout
        </h4>
        <Provider store={store}>
          <TimeoutSync />
        </Provider>

        <h4>
          #12 test onData
        </h4>
        <Provider store={store}>
          <OnDataSync />
        </Provider>

        <h4>
          #13 test onError
        </h4>
        <Provider store={store}>
          <OnErrorSync />
        </Provider>

        <h4>
          #14 test meta
        </h4>
        <Provider store={store}>
          <MetadataTest />
        </Provider>

        <h4>
          #15 throttle
        </h4>
        <Provider store={store}>
          <ThrottleTest />
        </Provider>

        <h4>
          #16 debounce
        </h4>
        <Provider store={store}>
          <DebounceTest />
        </Provider>
      </div>

    );
  }
}
