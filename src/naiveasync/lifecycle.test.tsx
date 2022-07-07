/* eslint-disable unused-imports/no-unused-vars */
import { Store } from "redux";
import { asyncLifecycle } from ".";
import { mockRejectString, quickReject, quickResolve } from "../utils/promise";
import { createConnectedStore } from "../utils/store";
import { naiveAsyncEmoji } from "./actions";
import { v4 } from "uuid";
import {
  mockDoneAsyncState,
  mockErrorAsyncState,
  mockInflightAsyncState,
  mockInitialAsyncState,
} from "./utils";

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

  it(`should register with the store and live until .destroy()`, () => {
    let state = store.getState();
    expect(Object.keys(state[naiveAsyncEmoji])).toHaveLength(0);
    const lc = asyncLifecycle(v4(), () => quickResolve({ output: "success" }));
    state = store.getState();
    expect(Object.keys(state[naiveAsyncEmoji])).toHaveLength(0);
    store.dispatch(lc.reset());
    state = store.getState();
    expect(Object.keys(state[naiveAsyncEmoji])).toHaveLength(1);
    store.dispatch(lc.destroy());
    state = store.getState();
    expect(Object.keys(state[naiveAsyncEmoji])).toHaveLength(0);
  });

  it(`should have values that can be modified with .assign() and .reset()`, () => {
    const data = { output: v4() };
    const params = { paramz: v4() };
    const error = "mock error";
    const lc = asyncLifecycle(v4(), () => quickResolve(data));

    // .reset
    store.dispatch(lc.reset());
    let asyncState = lc.selector(store.getState());
    expect(asyncState).toHaveProperty("data");
    expect(asyncState).toHaveProperty("error");
    expect(asyncState).toHaveProperty("status");
    expect(asyncState).toHaveProperty("params");

    // .assign done
    store.dispatch(lc.assign(mockDoneAsyncState(data, params)));
    asyncState = lc.selector(store.getState());
    expect(asyncState.data).toEqual(data);
    expect(asyncState.params).toEqual(params);
    expect(asyncState.status).toEqual("done");
    expect(asyncState.error).toEqual("");

    // .assign error
    store.dispatch(lc.assign(mockErrorAsyncState(error)));
    asyncState = lc.selector(store.getState());
    expect(asyncState.data).toEqual(null);
    expect(asyncState.params).toEqual({});
    expect(asyncState.status).toEqual("error");
    expect(asyncState.error).toEqual(error);

    // .assign inflight
    store.dispatch(lc.assign(mockInflightAsyncState(params)));
    asyncState = lc.selector(store.getState());
    expect(asyncState.data).toEqual(null);
    expect(asyncState.params).toEqual(params);
    expect(asyncState.status).toEqual("inflight");
    expect(asyncState.error).toEqual("");

    // .assign initial
    store.dispatch(lc.assign(mockInitialAsyncState()));
    asyncState = lc.selector(store.getState());
    expect(asyncState).toEqual(mockInitialAsyncState());
  });

  it(`should call the promise when .call()`, async () => {
    const paramz = v4();
    const dataz = { output: "success" };
    const lc = asyncLifecycle(v4(), ({ paramz }: { paramz: string }) =>
      quickResolve(dataz)
    );
    const opSpy = jest.spyOn(lc, "operation");

    // .call
    store.dispatch(lc.call({ paramz }));
    let state = store.getState();
    const asyncState = lc.selector(state);
    expect(asyncState.status).toEqual("inflight");
    expect(asyncState.params).toEqual({ paramz });
    expect(asyncState.error).toEqual("");
    expect(asyncState.data).toEqual(null);
    expect(opSpy).toHaveBeenCalled();
    await lc.awaitResolve();
    const meta = lc.meta();
    expect(meta.dataCount).toEqual(1);
    expect(meta.lastParams).toEqual({ paramz });
    state = store.getState();
    expect(lc.selector(state).status).toEqual("done");
    expect(lc.selector(state).data).toEqual(dataz);

    jest.resetAllMocks();
  });

  it(`should call the promise when .sync() with lastParams`, async () => {
    const paramz = v4();
    const dataz = { output: "success" };
    const lc = asyncLifecycle(v4(), ({ paramz }: { paramz: string }) =>
      quickResolve(dataz)
    );
    const opSpy = jest.spyOn(lc, "operation");

    // set the state initially
    store.dispatch(lc.sync({ paramz }));
    await lc.awaitResolve();

    // .sync
    store.dispatch(lc.sync());
    let state = store.getState();
    const asyncState = lc.selector(state);
    expect(asyncState.status).toEqual("inflight");
    expect(asyncState.params).toEqual({ paramz });
    expect(asyncState.error).toEqual("");
    expect(asyncState.data).toEqual(dataz);
    expect(opSpy).toHaveBeenCalled();
    await lc.awaitResolve();
    const meta = lc.meta();
    expect(meta.dataCount).toEqual(2);
    expect(meta.lastParams).toEqual({ paramz });
    state = store.getState();
    expect(lc.selector(state).status).toEqual("done");
    expect(lc.selector(state).data).toEqual(dataz);

    jest.resetAllMocks();
  });

  it(`should call the promise when .sync() with params`, async () => {
    const paramz = v4();
    const err = "mock err";
    const dataz = { output: "success" };
    const lc = asyncLifecycle(v4(), ({ paramz }: { paramz: string }) =>
      quickResolve(dataz)
    );
    const opSpy = jest.spyOn(lc, "operation");

    // set the state initially
    store.dispatch(lc.assign(mockErrorAsyncState(err)));

    // .sync
    store.dispatch(lc.sync({ paramz }));
    let state = store.getState();
    let asyncState = lc.selector(state);
    expect(asyncState.status).toEqual("inflight");
    expect(asyncState.params).toEqual({ paramz });
    expect(asyncState.error).toEqual(err);
    expect(asyncState.data).toEqual(null);
    expect(opSpy).toHaveBeenCalled();
    await lc.awaitResolve();
    const meta = lc.meta();
    expect(meta.dataCount).toEqual(1);
    expect(meta.lastParams).toEqual({ paramz });
    state = store.getState();
    asyncState = lc.selector(state);
    expect(asyncState.status).toEqual("done");
    expect(asyncState.data).toEqual(dataz);
    expect(asyncState.error).toEqual("");
    expect(asyncState.params).toEqual({ paramz });
    jest.resetAllMocks();
  });

  it(`should .onData and .onError with params to boot`, async () => {
    const err = "mock err";
    const dataz = { output: "success" };

    const lcRejects = asyncLifecycle(v4(), async () =>
      mockRejectString("mock", 20)
    ).onError((data, params, dispatch) => {
      // heck ya
    });

    const lcResolves = asyncLifecycle(v4(), async () =>
      quickResolve(dataz)
    ).onData((data, params, dispatch) => {
      dispatch(lcRejects.sync({}));
    });
    //  dispatch resolves, which .onData dispatches rejects, which .onError stops
    store.dispatch(lcResolves.sync({}));
    await lcResolves.awaitResolve();
    await lcRejects.awaitReject().catch(() => null);
    const rejectsMeta = lcRejects.meta();
    expect(rejectsMeta.errorCount).toBe(1);
    expect(rejectsMeta.dataCount).toBe(0);
    expect(rejectsMeta.onError).toBeTruthy();
    const resolvesMeta = lcResolves.meta();
    expect(resolvesMeta.dataCount).toBe(1);
    expect(resolvesMeta.errorCount).toBe(0);
    expect(resolvesMeta.onData).toBeTruthy();
  });
});
