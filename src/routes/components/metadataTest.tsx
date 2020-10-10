import React from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { naiveAsyncLifecycle } from "../../naiveasync"
import { AsyncMeta, NaiveAsyncState } from '../../naiveasync/actions'

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
const metadataLifecycle = naiveAsyncLifecycle(slowIconToName, 'METADATA_SELECTABLE')

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
  meta: AsyncMeta<any, any>
}

interface DP {
  select: (params?: IconParams) => void
}

type Props = MP & DP

const MemoizedComponent: React.FC<Props> = ({ state, select, meta }) => {
  const assign = (icon: IconParams["icon"]) => () => select({ icon })
  const display = `selected: ${state.data?.icon || '...'} aka ${state.data?.name}`
  const status = `status: ${state.status}`
  const error = `error: ${state.error}`
  const params = `params: ${JSON.stringify(state.params)}`

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
    <p>{`last called: ${meta.lastCalled}`}</p>
    <p>{`last params: ${JSON.stringify(meta.lastParams)}`}</p>
    <p>{`data count: ${meta.dataCount}`}</p>
    <p>{`error count: ${meta.errorCount}`}</p>
  </div>)
}

const mapStateToProps = (
  state: any,
): MP => ({
  state: metadataLifecycle.selector(state),
  meta: metadataLifecycle.meta()
});

const mapDispatchToProps = (
  dispatch: Dispatch<AnyAction>,
): DP => ({
  select: (params?: IconParams) => {
    return dispatch(metadataLifecycle.sync(params))
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  MemoizedComponent
);
