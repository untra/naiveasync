import React from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { Link } from "react-router-dom";
import packageJSON from '../../package.json'
import wwords from "../content/home-content.json";
// tslint:disable-next-line: ordered-imports no-implicit-dependencies
import { NaiveAsync, NaiveAsyncState, naiveAsyncInitialState } from "@untra/naiveasync";
// tslint:disable-next-line: no-implicit-dependencies
import Highlight from "react-highlight";

interface DataValue {
  value: string
}

interface ParamsValue {
  foo: string
}

const words: { [index: string]: { [index: string]: string } } = wwords

type SupportedLangs = keyof typeof words;
const version = packageJSON.version

const exampleInit = naiveAsyncInitialState
const exampleInflight = {
  ...exampleInit,
  "status": "inflight",
  "params": {
    "user": "admin",
    "password": "hunter2"
  },
}
const exampleError = {
  ...exampleInflight,
  "status": "error",
  "error": "kaboom typerror",
}
const exampleDone = {
  ...exampleInflight,
  "status": "done",
  "data": { "evil-secrets": "..." },
}
const examples = [
  exampleInit,
  exampleInflight,
  exampleError,
  exampleDone
]
const pickedExample = examples[(Math.floor(4 * Math.random()))]


// const randomData = blamDataRows(["foo", "bar", "baz"], 5);
// These are the supported languages
const DEFAULT_LANG = "en";
interface HomeScreenProps {
  lang: SupportedLangs;
}

const asyncOperation = (params: ParamsValue): Promise<DataValue> => {

  return new Promise((resolve, reject) => {
    const r = Math.random()
    const time = r * 1000

    setTimeout(() => {
      if (r < 0.8) {
        resolve({ value: `success! ${params.foo} ${time}` })
      }
      reject(new Error('an error was thrown'))
    }, time)
  })
}

const asyncableView = (state: NaiveAsyncState<DataValue, ParamsValue>, call: (params: ParamsValue) => void) => (<div>
  <h2>status: {state.status}</h2>
  <h2>params: {JSON.stringify(state.params)}</h2>
  <h2>error: {state.error}</h2>
  <h2>data: {JSON.stringify(state.data)}</h2>
  <button onClick={() => call({ foo: 'foo' })}>
    <p>foo</p>
  </button>
  <button onClick={() => call({ foo: 'bar' })}>
    <p>bar</p>
  </button>
  <button onClick={() => call({ foo: 'baz' })}>
    <p>baz</p>
  </button>
</div>)

const lifecycleflowimage = "https://naiveasync.untra.io/images/naiveasync-flow.png"


export default class Home extends React.Component<HomeScreenProps> {
  constructor(props: HomeScreenProps) {
    super(props);
  }

  public render() {
    // this is the word render function
    // it will display the text content in the given language or in english
    // the red X means there is missing text content
    // eslint-disable-next-line
    const W = (input: string) => {
      const display = words[DEFAULT_LANG][input] || "";
      return `${display}` || "❌";
      // return this.theseWords[input] || this.defaultWords[input] || "❌";
    };
    return (
      <div className="page-content">
        <div className="wrapper">
          <h1><span role="img" aria-label="Bento">🔁</span> NaiveAsync</h1>
          <h2>an opinionated and painless <a href="https://reactjs.org/">React</a> n <a href="https://redux.js.org/">Redux</a> promise wrapper</h2>
          <h3>
            v{version} -{" "}
            <Link to="/test">Tests</Link>-{" "}
            <a href="https://github.com/untra/naiveasync">Github</a> -{" "}
            <a href="https://www.npmjs.com/package/@untra/naiveasync">NPM</a> -{" "}
            <a href="https://dashboard.cypress.io/#/projects/wrytfx/runs">Cypress</a>
          </h3>
          <NaiveAsync id="asyncOp" operation={asyncOperation}>{asyncableView}</NaiveAsync>
          <p>NaiveAsync is a React Component that wraps a <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise">promise</a> and exposes an abstraction to invoke the promise and access it with a straightforward abstraction.</p>
          <p>Child Components rendered in a NaiveAsync component have access to a <code>state</code> and a <code>call</code> function.</p>
          <p>NaiveAsync takes three arguments:</p>
          <ul>
            <li><strong>operation:</strong><code>{`(params) => Promise`}</code> the operation takes in params and returns a promise</li>
            <li><strong>id:</strong><code>{`string`}</code> optional string identifier under which the component redux state is stored. If not provided, it will use the function name.</li>
            <li><strong>autoParams:</strong><code>{`Params`}</code> optional params object that, if provided, will be used to invoke the operation on component mount.</li>
          </ul>
          <Highlight className="tsx">{
            `// react-app-async.tsx
import React from "react";
import { NaiveAsync } from "@untra/naiveasync";
// NaiveAsync builds its own standard set of reducers and redux store
// or perhaps written more terseley
<NaiveAsync id="asyncOp" operation={asyncOperation}>{ asyncableView }</NaiveAsync>
`}
          </Highlight>

          <h2>naiveAsyncLifecycle(asyncOperation, id)</h2>
          <img alt={"the naiveasync lifecycle"} src={lifecycleflowimage} />
          <p>the core of the async lifecycle management comes from <code>{`naiveAsyncLifecycle`}</code>.
          This is available as its own function and can be used for fine-grained control in react components.</p>
          <code>{`const asyncLifecycle : AsyncLifecycle<Data,Params> = naiveAsyncLifecycle(function asyncoperation(params : Params) => {
            const data : Data = {};
            return data;
          })`}</code>

          <p>the <code><i>{`asyncLifecycle<Data,Params>`}</i></code> object exposes the following:</p>
          <ul>
          <li><code><strong>id : string</strong></code> the provided id used as the unique state identifer for the <code>selector</code> to identify the <code>AsyncState</code> in the redux store. Its optional; if not provided, the <code>Operation.name</code> is used.</li>
          <li><code><strong>operation : AsyncOperation</strong></code> the provided function, </li>
          <li><code><strong>selector(state : ReduxState) : AsyncState</strong></code> this is a redux state selector against the redux state, for use in <code>mapStateToProps</code>. Returns the `AsyncState` instance owned by this manager.</li>
          <li><code><strong>.call(params : Params)</strong></code> Action creator that triggers the associated <code>AsyncOperation</code> when dispatched, passing <code>params</code> into the operation. Resets its state when called again.</li>
          <li><code><strong>.sync({})</strong></code> Action creator that triggers the associated `AsyncOperation` when dispatched, reusing the last remaining params. Does not reset data or error states, making it useful for polling operations.</li>
          <li><code><strong>.reset({})</strong></code> Action dispatched internally when the associated `AsyncOperation` is reset to it's initial State.</li>
          <li><code><strong>.data(data : Data)</strong></code>Action dispatched internally when the associated `AsyncOperation` emits data.</li>
          <li><code><strong>.error(error : string)</strong></code>Action dispatched internally when the associated `AsyncOperation` emits an error (rejects) or throws an exception. The error will to be coerced to a string.</li>
          <li>and finally <code><strong>.destroy({})</strong></code> which removes the <code>AsyncState</code> instance owned by this lifecycle from the state tree. <code>AsyncState</code> objects will remain in the state tree until they are destroyed, even if they are no longer being used by their components on the dom. This can become a memory leak if left unchecked. For React components, a good practice is to dispatch the <code>.destroy({})</code> action in the component's <code>componentWillUnmount</code> method, or with a <code>useEffect</code> cleanup.</li>
          </ul>
          <p></p>
          <Highlight className="tsx">{
            `// react-app-async.tsx
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
    );
  }
}
