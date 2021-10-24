import React from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { asyncLifecycle } from "../../naiveasync";
import { AsyncMeta, AsyncState } from "../../naiveasync/actions";
import { slowResolve } from "../../utils/promise";

const slowIconToName = (params: IconParams) =>
  slowResolve({
    icon: params.icon,
    name: iconToName[params.icon] || "NOT FOUND",
  });
const metadataLifecycle = asyncLifecycle("METADATA_SELECTABLE", slowIconToName);

const iconToName = {
  "🦅": "eagle",
  "🐅": "tiger",
  "🦓": "zebra",
  "🦒": "giraffe",
  "🐘": "elephant",
  "🐊": "crocodile",
};

interface IconParams {
  icon: "🦅" | "🐅" | "🦓" | "🦒" | "🐘" | "🐊";
}

interface IconResp {
  icon: string;
  name: string;
}

interface MP {
  state: AsyncState<IconResp, IconParams>;
  meta: AsyncMeta<IconResp, IconParams>;
}

interface DP {
  select: (params?: IconParams) => void;
}

type Props = MP & DP;

const MemoizedComponent: React.FC<Props> = ({ state, select, meta }) => {
  const assign = (icon: IconParams["icon"]) => () => select({ icon });
  const display = `selected: ${state.data?.icon || "..."} aka ${
    state.data?.name
  }`;
  const status = `status: ${state.status}`;
  const error = `error: ${state.error}`;
  const params = `params: ${JSON.stringify(state.params)}`;

  return (
    <div>
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
    </div>
  );
};

const mapStateToProps = (state: never): MP => ({
  state: metadataLifecycle.selector(state),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta: metadataLifecycle.meta() as any,
});

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>): DP => ({
  select: (params?: IconParams) => dispatch(metadataLifecycle.sync(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(MemoizedComponent);
