import { Store } from "redux";
import { asyncLifecycle } from ".";
import { slowResolve } from "../utils/promise";
import { createConnectedStore } from "../utils/store";
import { naiveAsyncEmoji } from "./actions";
import { v4 } from "uuid";

describe("store", () => {
  it(`should be connected with the middleare`, () => {
    const store = createConnectedStore();
    const state = store.getState();
    expect(state).toHaveProperty(naiveAsyncEmoji);
  });
});

describe("lifecycle", () => {
  let store: Store = createConnectedStore();
  beforeAll(() => {
    store = createConnectedStore();
  });

  it(`should be testable from here `, () => {
    const lc = asyncLifecycle(v4(), () => slowResolve({ output: "success" }));
    const state = store.getState();
    expect(state).toHaveProperty(naiveAsyncEmoji);
  });

  it(`should be testable from here `, () => {
    const data = { output: "success" };
    const lc = asyncLifecycle(v4(), () => slowResolve(data));

    store.dispatch(lc.data(data));
    const state = store.getState();
    expect(lc.selector(state)).toHaveProperty("data", data);
  });
});
