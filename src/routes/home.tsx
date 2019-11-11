/* tslint:disable */
import React from "react";
// tslint:disable-next-line: no-implicit-dependencies
// import Highlight from "react-highlight";
// tslint:disable-next-line: no-implicit-dependencies
import { Link } from "react-router-dom";
import packageJSON from '../../package.json'
import wwords from "../content/home-content.json";
import { NaiveAsync, NaiveAsyncState } from "../naiveasync/index";

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
  private readonly randomFilenames = ['copy', 'new-hot-startup', 'foobarbaz', 'blockchainz', 'stuff', 'wack-wack-wack', '1']
  private randomFilename = this.randomFilenames[0]
  constructor(props: HomeScreenProps) {
    super(props);
    const rand = Math.floor(Math.random() * this.randomFilenames.length)
    this.randomFilename = this.randomFilenames[rand] || this.randomFilename
    // eslint-disable-next-line
    const { lang } = props;
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
          <h2>an opinionated and painless <a href="https://reactjs.org/">React</a> promise wrapper</h2>
          <h3>
            v{version} -{" "}
            <Link to="/test">Tests</Link>-{" "}
            <a href="https://github.com/untra/naiveasync">Github</a> -{" "}
            <a href="https://www.npmjs.com/package/@untra/naiveasync">NPM</a> -{" "}
            <a href="https://dashboard.cypress.io/#/projects/wrytfx/runs">Cypress</a>
          </h3>
          <NaiveAsync operation={asyncOperation}>{ asyncableView }</NaiveAsync>
        </div>
      </div>
    );
  }
}
