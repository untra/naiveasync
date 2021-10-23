import React, { useEffect } from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect, useDispatch } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { AsyncLifecycle, asyncLifecycle, mockDoneAsyncState } from "../../naiveasync"
import { NaiveAsyncState } from '../../naiveasync/actions'

const riskyResolve = <T extends any>(val: T): Promise<T> => new Promise((resolve, reject) => {
  const rand = Math.random()
  const timeMS = rand * 100
  // tslint:disable-next-line: no-console
  console.log(`Chosen random value: ${rand}`);

  setTimeout(() => {
    if(rand > 0.5) {
      reject(val);
    } else {
      resolve(val);
    }
  }, timeMS)
});

const handleErr = (err: string) => {
  // tslint:disable-next-line: no-console
  console.debug(`retried err: `, err);
}
const retryTestLifecycle : AsyncLifecycle<{},{}> = asyncLifecycle('23_RETRY_TEST', riskyResolve).retries(3, handleErr)


interface MP {
  state: NaiveAsyncState<{}, {}>
}

interface DP {
  select: (params?: {}) => void
}

type Props = MP & DP

const SubscribeComponent: React.FC<Props> = ({ state, select }) => {
  const dispatch = useDispatch()
  useEffect(() => {
    const icon = "🦅"
    const name = "assigned!"
    dispatch(retryTestLifecycle.assign(mockDoneAsyncState({ icon, name }, {})))
  }, [dispatch])
  const sync = (params: any) => dispatch(retryTestLifecycle.sync(params));
  const call = (params: any) => dispatch(retryTestLifecycle.call(params));
  const reset = () => dispatch(retryTestLifecycle.reset());

  return (<div>
    <p>status: {JSON.stringify(state.status)}</p>
    <p>params: {JSON.stringify(state.params)}</p>
    <p>error: {JSON.stringify(state.error)}</p>
    <p>data: {JSON.stringify(state.data)}</p>
    <button onClick={() => call({})} >call</button>
    <button style={{ backgroundColor: "cyan" }} onClick={() => sync({})} >sync</button>
    <button style={{ backgroundColor: "yellow" }} onClick={() => reset()} >reset</button>
  </div>)
}

const mapStateToProps = (
  state: any,
): MP => ({
  state: retryTestLifecycle.selector(state)
});

const mapDispatchToProps = (
  dispatch: Dispatch<AnyAction>,
): DP => ({
  select: () => {
    return dispatch(retryTestLifecycle.sync({}))
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  SubscribeComponent
);
