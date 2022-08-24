/** *
 * Naiveasync Tests
 * MIT License
 * Made with 💙 by @untra
 * ---
 */
import React from "react";
/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Provider } from "react-redux";
import * as packagejson from "../../package.json";
import { AsyncState } from "../naiveasync/actions";
import { asyncLifecycle, NaiveAsync } from "../naiveasync/index";
import { Async } from "../naiveasync/naiveasync";
import { createConnectedStore } from "../utils/store";
import DebounceTest from "./components/debounceTest";
import MemoizedSync from "./components/memoized";
import MetadataTest from "./components/metadataTest";
import OnDataSync from "./components/onData";
import OnErrorSync from "./components/onError";
import RandomNumberSelectableSync from "./components/RandomNumberSelectableSync";
import RandomNumberSync from "./components/RandomNumberSync";
import ThrottleTest from "./components/throttleTest";
import AssignTest from "./components/assignTest";
import RetryTest from "./components/retryTest";
import TraceTest from "./components/traceTest";
import DataDependsTest from "./components/dataDependsTest";
import SubscribeTest from "./components/subscribeTest";
import TimeoutSync from "./components/timeout";
import { mockResolve, slowReject } from "../utils/promise";

const emojiView = (state: AsyncState<any, {}>) => (
  <p>
    {state.status === "inflight"
      ? "💬"
      : state.error
      ? "💥"
      : state.data
      ? "✔️"
      : "❌"}{" "}
    {`${state.data}`} {`${state.status}`} {`${state.error}`}{" "}
  </p>
);

// eslint-disable-next-line
const callableView = (state: AsyncState<any, {}>, call: ({}) => any) => (
  <button onClick={call}>
    {state.status === "inflight"
      ? "💬"
      : state.error
      ? "💥"
      : state.data
      ? "✔️"
      : "❌"}{" "}
    {`${state.status}`}{" "}
  </button>
);

const slowResolve = <T extends any>(val: T): Promise<T> =>
  new Promise((resolve) => {
    const timeMS = Math.random() * 4000;
    setTimeout(() => resolve(val), timeMS);
  });

const autoParamsOp = (params: {}) =>
  Promise.resolve(`✅ with params ${JSON.stringify(params)}`);

const autoResolve = (params: {}) => slowResolve("✅");

// Hi friend 👋 thanks for reading my naiveasync tests!
// maybe you're on this github page?

const thisGithubPage =
  "https://github.com/untra/naiveasync/blob/master/src/routes/test.tsx";

// If you are, then I want to know you are a talented and skilled engineer,
// and it would certainly be a pleasure to shake your hand one day,
// and tell you personally _just how cool you are_

// While you're here you may also want to check out that cypress page:
const thatCypressPage = "https://dashboard.cypress.io/#/projects/wrytfx/runs";

const namedFunction = function namedFunction() {
  return slowResolve(true);
};

const unreliableTime = 2000;

const unreliableAsyncOperation = (): Promise<{ value: number }> =>
  new Promise((resolve, reject) => {
    const r = Math.random();
    const time = r * unreliableTime;

    setTimeout(() => {
      if (r < 0.99) {
        resolve({ value: r });
      }
      reject(new Error("an error was thrown"));
    }, time);
  });

const lifeCycleInput = asyncLifecycle("17_LIFECYCLE_INPUT", autoParamsOp);

const asyncInputLifecycle = asyncLifecycle(
  "19_ASYNC_OPERATION",
  unreliableAsyncOperation
);

const subscribeLifecycle = asyncLifecycle(
  "21_SUBSCRIBE_OPERATION",
  unreliableAsyncOperation
);

const store = createConnectedStore();

export default class Test extends React.Component {
  public render() {
    return (
      <Provider store={store}>
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
            <li>
              It is the selection and input to a variety of cypress tests.
            </li>
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
            #1 It should be invoked automatically when autoParams are
            specified...
          </h4>
          <NaiveAsync id="NA1" operation={autoParamsOp} autoParams={{}}>
            {(state: any) => (
              <div>
                <p>status: {JSON.stringify(state.status)}</p>
                <p>params: {JSON.stringify(state.params)}</p>
                <p>error: {JSON.stringify(state.error)}</p>
                <p>data: {JSON.stringify(state.data)}</p>
              </div>
            )}
          </NaiveAsync>

          <h4>#2 It can be invoked when the call cb is invoked</h4>
          <NaiveAsync id="NA2" operation={autoParamsOp}>
            {(state, call) => (
              <div>
                <p>status: {JSON.stringify(state.status)}</p>
                <p>params: {JSON.stringify(state.params)}</p>
                <p>error: {JSON.stringify(state.error)}</p>
                <p>data: {JSON.stringify(state.data)}</p>
                <button onClick={() => call({})}>call</button>
              </div>
            )}
          </NaiveAsync>

          <h4>#3 Multiple autoParamed operations should execute</h4>
          <NaiveAsync id="NA3a" operation={autoResolve} autoParams={{}}>
            {(state: any) => (
              <div>
                <p>{state.data || "💬"}</p>
              </div>
            )}
          </NaiveAsync>

          <NaiveAsync id="NA3b" operation={autoResolve} autoParams={{}}>
            {(state: any) => (
              <div>
                <p>{state.data || "💬"}</p>
              </div>
            )}
          </NaiveAsync>

          <NaiveAsync id="NA3c" operation={autoResolve} autoParams={{}}>
            {(state: any) => (
              <div>
                <p>{state.data || "💬"}</p>
              </div>
            )}
          </NaiveAsync>

          <h4>#4 a circus of promises</h4>
          <NaiveAsync
            id="NA4a"
            operation={() => Promise.resolve(true)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA4b"
            operation={() => Promise.resolve(false)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA4c"
            operation={() => Promise.reject("boom")}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA4d"
            operation={() => Promise.reject(new Error("kaboom!"))}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA4e"
            operation={() => slowResolve(true)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA4f"
            operation={() => slowResolve(false)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA4g"
            operation={() =>
              slowReject(new Error("slow boom")) as Promise<string>
            }
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA4h"
            operation={() =>
              slowReject(new Error("slow kaboom!")) as Promise<boolean>
            }
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>

          <h4>#5 callable promises</h4>
          <NaiveAsync id="NA5a" operation={() => Promise.resolve(true)}>
            {callableView}
          </NaiveAsync>
          <NaiveAsync id="NA5b" operation={() => slowResolve(true)}>
            {callableView}
          </NaiveAsync>
          <NaiveAsync id="NA5c" operation={() => slowResolve(true)}>
            {callableView}
          </NaiveAsync>

          <h4>#6 very small timeouts</h4>
          <NaiveAsync
            id="NA6a"
            operation={() => mockResolve(true, 1)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA6b"
            operation={() => mockResolve(true, 2)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA6c"
            operation={() => mockResolve(true, 3)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA6d"
            operation={() => mockResolve(true, 4)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA6e"
            operation={() => mockResolve(true, 5)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA6f"
            operation={() => mockResolve(true, 6)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA6g"
            operation={() => mockResolve(true, 7)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>
          <NaiveAsync
            id="NA6h"
            operation={() => mockResolve(true, 8)}
            autoParams={{}}
          >
            {emojiView}
          </NaiveAsync>

          <h4>#7 shared id experiment</h4>
          <NaiveAsync id="NA7" operation={namedFunction}>
            {callableView}
          </NaiveAsync>
          <NaiveAsync id="NA7" operation={namedFunction}>
            {callableView}
          </NaiveAsync>
          <NaiveAsync id="NA7" operation={namedFunction}>
            {callableView}
          </NaiveAsync>

          <h4>#8 lifecycle sync</h4>
          <RandomNumberSync />

          <h4>#9 lifecycle sync retains last passed params</h4>
          <RandomNumberSelectableSync />

          <h4>#10 test memoized</h4>
          <MemoizedSync />

          <h4>#11 test timeout</h4>
          <TimeoutSync />

          <h4>#12 test onData</h4>
          <OnDataSync />

          <h4>#13 test onError</h4>
          <OnErrorSync />

          <h4>#14 test meta</h4>
          <MetadataTest />

          <h4>#15 throttle</h4>
          <ThrottleTest />

          <h4>#16 debounce</h4>
          <DebounceTest />

          <h4>#17 naiveasync with lifecycle input</h4>
          <NaiveAsync operation={lifeCycleInput.operation} id="TEST_18">
            {(state, call) => (
              <div>
                <p>status: {JSON.stringify(state.status)}</p>
                <p>params: {JSON.stringify(state.params)}</p>
                <p>error: {JSON.stringify(state.error)}</p>
                <p>data: {JSON.stringify(state.data)}</p>
                <button onClick={() => call({})}>call</button>
              </div>
            )}
          </NaiveAsync>

          <h4>#18 Async tag with a managed lifecycle</h4>
          <Async lifecycle={asyncInputLifecycle}>
            {({ state, call }) => (
              <div>
                <p>status: {JSON.stringify(state.status)}</p>
                <p>params: {JSON.stringify(state.params)}</p>
                <p>error: {JSON.stringify(state.error)}</p>
                <p>data: {JSON.stringify(state.data)}</p>
                <button onClick={() => call({})}>call</button>
              </div>
            )}
          </Async>

          <h4>#19 reusing Async tag with the same lifecycle, more buttons</h4>
          <Async lifecycle={asyncInputLifecycle}>
            {({ state, call, reset, sync }) => (
              <div>
                <p>status: {JSON.stringify(state.status)}</p>
                <p>params: {JSON.stringify(state.params)}</p>
                <p>error: {JSON.stringify(state.error)}</p>
                <p>data: {JSON.stringify(state.data)}</p>
                <button onClick={() => call({})}>call</button>
                <button
                  style={{ backgroundColor: "cyan" }}
                  onClick={() => sync({})}
                >
                  sync
                </button>
                <button
                  style={{ backgroundColor: "yellow" }}
                  onClick={() => reset()}
                >
                  reset
                </button>
              </div>
            )}
          </Async>

          <h4>#20 assignTest</h4>
          <AssignTest />

          <h4>#21 subscribe with Async Test</h4>
          <Async lifecycle={subscribeLifecycle}>
            {({ state, call, reset, sync, subscribe }) => (
              <div>
                <p>status: {JSON.stringify(state.status)}</p>
                <p>params: {JSON.stringify(state.params)}</p>
                <p>error: {JSON.stringify(state.error)}</p>
                <p>data: {JSON.stringify(state.data)}</p>
                <button onClick={() => call({})}>call</button>
                <button
                  style={{ backgroundColor: "cyan" }}
                  onClick={() => sync({})}
                >
                  sync
                </button>
                <button
                  style={{ backgroundColor: "yellow" }}
                  onClick={() => reset()}
                >
                  reset
                </button>
                <p>subscriptions</p>
                <button
                  style={{ backgroundColor: "gray" }}
                  onClick={() => subscribe(2000)}
                >
                  subscribe 2sec
                </button>
                <button
                  style={{ backgroundColor: "gray" }}
                  onClick={() => subscribe(6000)}
                >
                  subscribe 6sec
                </button>
                <button
                  style={{ backgroundColor: "gray" }}
                  onClick={() => subscribe(10000)}
                >
                  subscribe 10sec
                </button>
                <button
                  style={{ backgroundColor: "light-gray" }}
                  onClick={() => subscribe(0)}
                >
                  clear subscribe
                </button>
              </div>
            )}
          </Async>

          <h4>#22 subscribe test</h4>
          <SubscribeTest />

          <h4>#23 retry test</h4>
          <RetryTest />

          <h4>#24 trace</h4>
          <TraceTest />

          <h4>#25 data depends</h4>
          <DataDependsTest />
        </div>
      </Provider>
    );
  }
}
