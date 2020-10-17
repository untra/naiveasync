import React, { ChangeEvent, useState } from "react";
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
const timeoutLifecycle = naiveAsyncLifecycle(slowIconToName, 'TIMEOUT_SELECTABLE')

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
  const [timeout, setTheTimeout] = useState(0)
  const assign = (icon: IconParams["icon"]) => () => select({ icon })
  const display = `selected: ${state.data?.icon || '...'} aka ${state.data?.name}`
  const status = `status: ${state.status}`
  const error = `error: ${state.error}`
  const params = `params: ${JSON.stringify(state.params)}`
  const changeTimeout = (e: ChangeEvent) => {
    const element = e.currentTarget as HTMLInputElement
    const value = parseInt(element.value, 10);
    if (isNaN(value)) {
      return
    }
    setTheTimeout(value);
    timeoutLifecycle.timeout(value);
  }
  return (<div>
    <button name="🦅" value={"🦅"} onClick={assign("🦅")}>{`${"🦅"}`}</button>
    <button name="🐅" value={"🐅"} onClick={assign("🐅")}>{`${"🐅"}`}</button>
    <button name="🦓" value={"🦓"} onClick={assign("🦓")}>{`${"🦓"}`}</button>
    <button name="🦒" value={"🦒"} onClick={assign("🦒")}>{`${"🦒"}`}</button>
    <button name="🐘" value={"🐘"} onClick={assign("🐘")}>{`${"🐘"}`}</button>
    <button name="🐊" value={"🐊"} onClick={assign("🐊")}>{`${"🐊"}`}</button>
    <p>{display}</p>
    <p>{params}</p>
    <p>{error}</p>
    <p>{status}</p>
    <input type="number" id="timeout" name="timeout" min="1" value={timeout} onChange={changeTimeout} />
  </div>)
}

const mapStateToProps = (
  state: any,
): MP => ({
  state: timeoutLifecycle.selector(state)
});

const mapDispatchToProps = (
  dispatch: Dispatch<AnyAction>,
): DP => ({
  select: (params?: IconParams) => {
    return dispatch(timeoutLifecycle.sync(params))
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  MemoizedComponent
);
