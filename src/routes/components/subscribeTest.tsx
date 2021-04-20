import React, { useEffect } from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect, useDispatch } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { asyncLifecycle, mockDoneAsyncState } from "../../naiveasync"
import { NaiveAsyncState } from '../../naiveasync/actions'

const slowResolve = <T extends any>(val: T): Promise<T> => new Promise((resolve) => {
  const timeMS = Math.random() * 4000
  setTimeout(() => resolve(val), timeMS)
})
const slowIconToName = (params: {}) => {
  return slowResolve({
    icon: '',
    name: `${Math.random()}`
  })
}
const subscriptionTestLifecycle = asyncLifecycle('22_SUBSCRIBE_TEST', slowIconToName)

interface IconResp {
  icon: string
  name: string
}

interface MP {
  state: NaiveAsyncState<IconResp, {}>
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
    dispatch(subscriptionTestLifecycle.assign(mockDoneAsyncState({ icon, name }, {})))
  }, [dispatch])
  const sync = (params: any) => dispatch(subscriptionTestLifecycle.sync(params));
  const call = (params: any) => dispatch(subscriptionTestLifecycle.call(params));
  const reset = () => dispatch(subscriptionTestLifecycle.reset());
  const subscribe = (params: number) => dispatch(subscriptionTestLifecycle.subscribe(params));

  return (<div>
    <p>status: {JSON.stringify(state.status)}</p>
    <p>params: {JSON.stringify(state.params)}</p>
    <p>error: {JSON.stringify(state.error)}</p>
    <p>data: {JSON.stringify(state.data)}</p>
    <button onClick={() => call({})} >call</button>
    <button style={{ backgroundColor: "cyan" }} onClick={() => sync({})} >sync</button>
    <button style={{ backgroundColor: "yellow" }} onClick={() => reset()} >reset</button>
    <p>subscriptions</p>
    <button style={{ backgroundColor: "gray" }} onClick={() => subscribe(2000)} >subscribe 2sec</button>
    <button style={{ backgroundColor: "gray" }} onClick={() => subscribe(6000)} >subscribe 6sec</button>
    <button style={{ backgroundColor: "gray" }} onClick={() => subscribe(10000)} >subscribe 10sec</button>
    <button style={{ backgroundColor: "light-gray" }} onClick={() => subscribe(0)} >clear subscribe</button>
  </div>)
}

const mapStateToProps = (
  state: any,
): MP => ({
  state: subscriptionTestLifecycle.selector(state)
});

const mapDispatchToProps = (
  dispatch: Dispatch<AnyAction>,
): DP => ({
  select: () => {
    return dispatch(subscriptionTestLifecycle.sync({}))
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  SubscribeComponent
);
