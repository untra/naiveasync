import React from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { naiveAsyncLifecycle } from "../../naiveasync"
import { NaiveAsyncState } from '../../naiveasync/actions'

const slowResolve = <T extends any>(val: T): Promise<T> => new Promise((resolve) => {
  const timeMS = Math.random() * 4000
  setTimeout(() => resolve(val), timeMS)
})
const slowIconToName = (params: {}) => {
  // tslint:disable-next-line: no-console
  console.log('debounce called!')
  return slowResolve({
    icon: '',
    name: 'DEBOUNCE'
  })
}
const debounceLifecycle = naiveAsyncLifecycle(slowIconToName, 'DEBOUNCE_SELECTABLE').debounce(2000)

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

const MemoizedComponent: React.FC<Props> = ({ state, select }) => {
  const display = `selected: ${state.data?.icon || '...'} (check the logs)`
  const status = `status: ${state.status}`
  const error = `error: ${state.error}`
  const params = `params: ${JSON.stringify(state.params)}`

  return (<div>
    <button name="🦅" value={"🦅"} onClick={() => select()}>{`select`}</button>
    <p>{display}</p>
    <p>{params}</p>
    <p>{error}</p>
    <p>{status}</p>
  </div>)
}

const mapStateToProps = (
  state: any,
): MP => ({
  state: debounceLifecycle.selector(state)
});

const mapDispatchToProps = (
  dispatch: Dispatch<AnyAction>,
): DP => ({
  select: () => {
    return dispatch(debounceLifecycle.sync({}))
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  MemoizedComponent
);
