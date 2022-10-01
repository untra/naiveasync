import React, { useState } from "react";
// tslint:disable-next-line: no-implicit-dependencies
import Highlight from "react-highlight";
// tslint:disable-next-line: no-implicit-dependencies
import { Provider } from "react-redux";
// tslint:disable-next-line: no-implicit-dependencies
import { Link } from "react-router-dom";
import packageJSON from "../../package.json";
// tslint:disable-next-line: ordered-imports no-implicit-dependencies
import { Async, asyncLifecycle, naiveAsyncInitialState } from "../naiveasync";
import { AsyncComponentChildrenProps } from "../naiveasync/naiveasync";
import { handleChangeEvent } from "../naiveasync/utils";
import { createConnectedStore } from "../utils/store";

interface DataValue {
  value: string;
}

interface ParamsValue {
  [index: string]: string;
}

const version = packageJSON.version;

const exampleInit = naiveAsyncInitialState;
const exampleInflight = {
  ...exampleInit,
  status: "inflight",
  params: {
    user: "admin",
    password: "hunter2",
  },
};
const exampleError = {
  ...exampleInflight,
  status: "error",
  error: "kaboom typerror",
};
const exampleDone = {
  ...exampleInflight,
  status: "done",
  data: { "evil-secrets": "..." },
};
const examples = [exampleInit, exampleInflight, exampleError, exampleDone];
const pickedExample = examples[Math.floor(4 * Math.random())];

const asyncOperation = (params: ParamsValue): Promise<DataValue> =>
  new Promise((resolve, reject) => {
    const r = Math.random();
    const time = r * 1000;

    setTimeout(() => {
      if (r < 0.8) {
        resolve({ value: `success! ${params.foo} ${time}` });
      }
      reject(new Error("an error was thrown"));
    }, time);
  });

const asyncInputLifecycle = asyncLifecycle(
  "asyncInputOperation",
  asyncOperation
);

const AsyncableView =
  (props: { initialKey: string; initialValue: string }) =>
  (lcProps: AsyncComponentChildrenProps<DataValue, ParamsValue>) => {
    const { state, call, sync, reset } = lcProps;
    const { initialValue, initialKey } = props;
    const [key, setKey] = useState(initialKey);
    const [value, setValue] = useState(initialValue);
    const params = { [key]: value };
    return (
      <div>
        <h2>status: {state.status}</h2>
        <h2>params: {JSON.stringify(state.params)}</h2>
        <h2>error: {state.error}</h2>
        <h2>data: {JSON.stringify(state.data)}</h2>
        <div>
          <input
            type="text"
            name="key"
            value={key}
            onChange={handleChangeEvent(setKey)}
          />
          :
          <input
            type="text"
            name="value"
            value={value}
            onChange={handleChangeEvent(setValue)}
          />
        </div>
        <button onClick={() => call(params)}>
          <p>call</p>
        </button>
        <button onClick={() => sync(params)}>
          <p>sync</p>
        </button>
        <button onClick={() => reset()}>
          <p>reset</p>
        </button>
      </div>
    );
  };

const lifecycleflowimage =
  "https://naiveasync.untra.io/images/naiveasync-flow.png";

const store = createConnectedStore();

export default class Home extends React.Component<{}> {
  public render() {
    return (
      <Provider store={store}>
        <div className="page-content">
          <div className="wrapper">
            <h1>
              <span role="img" aria-label="Bento">
                🔁
              </span>{" "}
              NaiveAsync
            </h1>
            <h2>
              an opinionated and painless{" "}
              <a href="https://reactjs.org/">React</a> n{" "}
              <a href="https://redux.js.org/">Redux</a> promise wrapper
            </h2>
            <h3>
              v{version} - <Link to="/test">Tests</Link>-{" "}
              <a href="https://github.com/untra/naiveasync">Github</a> -{" "}
              <a href="https://www.npmjs.com/package/@untra/naiveasync">NPM</a>{" "}
              - <a href="https://naiveasync.untra.io/docs">Docs</a>
            </h3>
            <Async lifecycle={asyncInputLifecycle}>
              {AsyncableView({ initialKey: "foo", initialValue: "bar" })}
            </Async>
            <p>
              NaiveAsync is a React Component that wraps a{" "}
              <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise">
                promise
              </a>{" "}
              and exposes an abstraction to invoke the promise and access it
              with a straightforward abstraction for use with redux.
            </p>
            <p>
              Child Components rendered in a Async component have access to a
              variety of functions, including <code>call</code>,{" "}
              <code>sync</code>, <code>reset</code>, <code>subscribe</code>, and
              a <code>state</code> object.
            </p>
            <p>NaiveAsync takes three arguments:</p>
            <ul>
              <li>
                <strong>id:</strong>
                <code>{`string`}</code> optional string identifier under which
                the component redux state is stored. If not provided, it will
                use the function name.
              </li>
              <li>
                <strong>operation:</strong>
                <code>{`(params) => Promise`}</code> the operation takes in
                params and returns a promise
              </li>
              <li>
                <strong>options:</strong>
                <code>{`AsyncOptions`}</code> optional behaviors for a lifecycle
                to enable changes to execution, including <code>subscribe</code>
                , <code>throttle</code>, <code>debounce</code> and{" "}
                <code>timeout</code>.
              </li>
            </ul>
            <Highlight className="tsx">
              {`// react-app-async.tsx
import React from "react";
import { NaiveAsync } from "@untra/naiveasync";
// NaiveAsync builds its own standard set of reducers and redux store
const asyncOperation = (params: ParamsValue): Promise<DataValue> =>
  new Promise((resolve, reject) => {
    const r = Math.random();
    const time = r * 1000;

    setTimeout(() => {
      if (r < 0.8) {
        resolve({ value: \`success! \${params.foo} \${time}\` });
      }
      reject(new Error("an error was thrown"));
    }, time);
  });
<Async id="asyncOp" operation={asyncoperation}>{ asyncableView }</NaiveAsync>
`}
            </Highlight>

            <h2>naiveAsyncLifecycle(asyncOperation, id)</h2>
            <img alt={"the naiveasync lifecycle"} src={lifecycleflowimage} />
            <p>
              the core of the async lifecycle management comes from{" "}
              <code>{`naiveAsyncLifecycle`}</code>. This is available as its own
              function and can be used for fine-grained control in react
              components.
            </p>
            <code>{`const asyncLifecycle : AsyncLifecycle<Data,Params> = naiveAsyncLifecycle(function asyncoperation(params : Params) => {
            const data : Data = {};
            return data;
          })`}</code>

            <p>
              the{" "}
              <code>
                <i>{`asyncLifecycle<Data,Params>`}</i>
              </code>{" "}
              object exposes the following:
            </p>
            <ul>
              <li>
                <code>
                  <strong>id : string</strong>
                </code>{" "}
                the provided id used as the unique state identifer for the{" "}
                <code>selector</code> to identify the <code>AsyncState</code> in
                the redux store. Its optional; if not provided, the{" "}
                <code>Operation.name</code> is used.
              </li>
              <li>
                <code>
                  <strong>operation : AsyncOperation</strong>
                </code>{" "}
                the provided function,{" "}
              </li>
              <li>
                <code>
                  <strong>selector(state : ReduxState) : AsyncState</strong>
                </code>{" "}
                this is a redux state selector against the redux state, for use
                in <code>mapStateToProps</code>. Returns the `AsyncState`
                instance owned by this manager.
              </li>
              <li>
                <code>
                  <strong>.call(params : Params)</strong>
                </code>{" "}
                Action creator that triggers the associated{" "}
                <code>AsyncOperation</code> when dispatched, passing{" "}
                <code>params</code> into the operation. Resets its state when
                called again.
              </li>
              <li>
                <code>
                  <strong>.sync({})</strong>
                </code>{" "}
                Action creator that triggers the associated `AsyncOperation`
                when dispatched, reusing the last employed params if none are
                provided. Does not reset data or error states, making it useful
                for polling / repeated operations.
              </li>
              <li>
                <code>
                  <strong>.reset({})</strong>
                </code>{" "}
                Action dispatched internally when the associated
                `AsyncOperation` is reset to it's initial State.
              </li>
              <li>
                <code>
                  <strong>.data(data : Data)</strong>
                </code>
                Action dispatched internally when the associated
                `AsyncOperation` emits data.
              </li>
              <li>
                <code>
                  <strong>.error(error : string)</strong>
                </code>
                Action dispatched internally when the associated
                `AsyncOperation` emits an error (rejects) or throws an
                exception. The error will to be coerced to a string.
              </li>
              <li>
                and finally{" "}
                <code>
                  <strong>.destroy({})</strong>
                </code>{" "}
                which removes the <code>AsyncState</code> instance owned by this
                lifecycle from the redux state tree. <code>AsyncState</code>{" "}
                objects will remain in the state tree until they are destroyed,
                even if they are no longer being used by their components on the
                dom. This can become a memory leak if left unchecked. For React
                components, a good practice is to dispatch the{" "}
                <code>.destroy({})</code> action in the component's{" "}
                <code>componentWillUnmount</code> method, or with a{" "}
                <code>useEffect</code> cleanup.
              </li>
            </ul>
            <p></p>
            <Highlight className="tsx">
              {`// react-app-async.tsx
import React from "react";
import { naiveAsyncLifecycle } from "@untra/naiveasync";
// remember, the asyncOperation is a function that takes params and returns a Promise
const asyncoperation : () => Promise<any> = () => fetch("api.example.com/users")
// The naiveasyncLifecycle(...) function wraps the asyncOperation and a string identifier
const asyncLifecycle = naiveasyncLifecycle(asyncoperation, "ASYNC_OP_NAME")
// the asyncLifecycle exposes a selector that will return the current state of the operation:
{
  "status": "${pickedExample.status}",
  "params": ${JSON.stringify(pickedExample.params)},
  "error": "${pickedExample.error}",
  "data": ${JSON.stringify(pickedExample.data)},
}
`}
            </Highlight>
          </div>
        </div>
      </Provider>
    );
  }
}
