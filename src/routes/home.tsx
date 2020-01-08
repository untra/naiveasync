/* tslint:disable */
import React from "react";
// tslint:disable-next-line: no-implicit-dependencies
// import Highlight from "react-highlight";
// tslint:disable-next-line: no-implicit-dependencies
import { Link } from "react-router-dom";
import packageJSON from '../../package.json'
import wwords from "../content/home-content.json";
import { NaiveAsync, NaiveAsyncState } from "../naiveasync/index";
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
          <NaiveAsync id="asyncOp" operation={asyncOperation}>{ asyncableView }</NaiveAsync>
          <p>NaiveAsync is a straightforward React Component with its own internal redux store and rxjs observable reducer.</p>
          <p>It uses these to provide a reasonable rendering abstraction around an async process, defined from a <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise">promise</a> object.</p>
          <p>Child Components rendered in a NaiveAsync component have access to a <code>state</code> and a <code>call</code> function.</p>
          <p>NaiveAsync takes three arguments:</p>
          <ul>
            <li><strong>operation:</strong><code>{`(params) => Promise`}</code> the operation takes in params and returns a promise</li>
            <li><strong>id:</strong><code>{`string`}</code> optional string identifier under which the component redux state is stored. If not provided, it will use the function name. Not providing an identifier or reusing identifiers across NaiveAsync Components can cause bugs.</li>
            <li><strong>autoParams:</strong><code>{`Params`}</code> optional params object that, if provided, will be used to invoke the operation on component mount.</li>
          </ul>
          <Highlight className="tsx">{
            `// react-app-async.tsx
import React from "react";
import { NaiveAsync } from "@untra/naiveasync";
// NaiveAsync builds its own standard set of reducers and redux store
// designed to provide a
// or perhaps written more terseley
// <NaiveAsync id="asyncOp" operation={asyncOperation}>{ asyncableView }</NaiveAsync>
`}
          </Highlight>
        </div>
      </div>
    );
  }
}
