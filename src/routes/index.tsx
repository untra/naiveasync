import React from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { HashRouter, Route, Switch } from "react-router-dom";

import home from "./home";
import test from "./tests";

// NOTE: see https://medium.com/@Dragonza/react-router-problem-with-gh-pages-c93a5e243819
// for explanation of BrowserRouter hook-up

const reload = () => window.location.reload();

export default () => (
  <HashRouter basename="/">
    <Switch>
      <Route path="/test" component={test} onEnter={reload} />
      <Route exact path="/" component={home} />
      <Route
        component={() => (
          <div className="wrapper">
            <h1>{"404 Not found"}</h1>{" "}
          </div>
        )}
      />
    </Switch>
  </HashRouter>
);
