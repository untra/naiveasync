import React, { useState } from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { naiveAsyncLifecycle } from "../../naiveasync"
import { NaiveAsyncState } from '../../naiveasync/actions'

const slowResolve = <T extends any>(val: T): Promise<T> => new Promise((resolve) => {
  const timeMS = Math.random() * 4000
  setTimeout(() => resolve(val), timeMS)
})
const slowIconToName = (params: IconParams) => {
  return slowResolve({
    icon: params.icon,
    name: iconToName[params.icon] || 'NOT FOUND'
  })
}
const memoizedLifecycle = naiveAsyncLifecycle(slowIconToName, 'MEMOIZED_SELECTABLE')

const iconToName = {
  "🦅": "eagle",
  "🐅": "tiger",
  "🦓": "zebra",
  "🦒": "giraffe",
  "🐘": "elephant",
  "🐊": "crocodile"
}

interface IconParams {
  icon: "🦅" | "🐅" | "🦓" | "🦒" | "🐘" | "🐊"
}

interface IconResp {
  icon: string
  name: string
}

interface MP {
  state: NaiveAsyncState<IconResp, IconParams>
}

interface DP {
  select: (params?: IconParams) => void
}

type Props = MP & DP

const MemoizedComponent: React.FC<Props> = ({ state, select }) => {
  const [memoized, setMemoized] = useState(false)
  const toggleMemoized = (memo: boolean) => {
    memoizedLifecycle.memoized(memo)
    setMemoized(memo)
  }
  const assign = (icon: IconParams["icon"]) => () => select({ icon })
  const display = `selected: ${state.data?.icon || '...'} aka ${state.data?.name}`
  const status = `status: ${state.status}`
  const params = `params: ${JSON.stringify(state.params)}`
  return (<div>
    <button name="🦅" value={"🦅"} onClick={assign("🦅")}>{`${"🦅"}`}</button>
    <button name="🐅" value={"🐅"} onClick={assign("🐅")}>{`${"🐅"}`}</button>
    <button name="🦓" value={"🦓"} onClick={assign("🦓")}>{`${"🦓"}`}</button>
    <button name="🦒" value={"🦒"} onClick={assign("🦒")}>{`${"🦒"}`}</button>
    <button name="🐘" value={"🐘"} onClick={assign("🐘")}>{`${"🐘"}`}</button>
    <button name="🐊" value={"🐊"} onClick={assign("🐊")}>{`${"🐊"}`}</button>
    <p>{`memoized: ${memoized}`}</p>
    <p>{display}</p>
    <p>{params}</p>
    <p>{status}</p>
    <button name="memoized" onClick={() => toggleMemoized(!memoized)}>toggle memoized</button>
  </div>)
}

const mapStateToProps = (
  state: any,
): MP => ({
  state: memoizedLifecycle.selector(state)
});

const mapDispatchToProps = (
  dispatch: Dispatch<AnyAction>,
): DP => ({
  select: (params?: IconParams) => {
    return dispatch(memoizedLifecycle.sync(params))
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  MemoizedComponent
);
