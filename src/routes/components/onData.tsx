import React, { useState } from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { asyncLifecycle } from "../../naiveasync";
import { AsyncState, OnData } from "../../naiveasync/actions";
import { slowResolve } from "../../utils/promise";

const slowIconToName = (params: IconParams) =>
  slowResolve({
    icon: params.icon,
    name: iconToName[params.icon] || "NOT FOUND",
  });
const ondataLifecycle = asyncLifecycle("ONDATA_SELECTABLE", slowIconToName);

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
}

interface DP {
  select: (params?: IconParams) => void;
}

type Props = MP & DP;

const MemoizedComponent: React.FC<Props> = ({ state, select }) => {
  const [onDataType, setOnDataType] = useState("none");
  const assign = (icon: IconParams["icon"]) => () => select({ icon });
  const display = `selected: ${state.data?.icon || "..."} aka ${
    state.data?.name
  }`;
  const status = `status: ${state.status}`;
  const error = `error: ${state.error}`;
  const params = `params: ${JSON.stringify(state.params)}`;
  const assignOnData = (onData?: OnData<IconResp, IconParams>) => {
    if (onData) {
      setOnDataType(onData.name);
      ondataLifecycle.onData(onData);
    } else {
      setOnDataType("none");
      // ondataLifecycle.onData(null)
    }
  };
  const simple = () => {
    // eslint-disable-next-line no-console
    console.log("onData received!");
  };
  const cb = (data: IconResp) => {
    // eslint-disable-next-line no-console
    console.log("fresh data!", data);
  };
  const dispatched = (data: IconResp, dispatch: Dispatch<AnyAction>) => {
    // eslint-disable-next-line no-console
    console.log("dispatched data!", data);
    // eslint-disable-next-line no-console
    setTimeout(() => dispatch && dispatch(ondataLifecycle.reset()), 2000);
  };

  return (
    <div>
      <button name="🦅" value={"🦅"} onClick={assign("🦅")}>{`${"🦅"}`}</button>
      <button name="🐅" value={"🐅"} onClick={assign("🐅")}>{`${"🐅"}`}</button>
      <button name="🦓" value={"🦓"} onClick={assign("🦓")}>{`${"🦓"}`}</button>
      <button name="🦒" value={"🦒"} onClick={assign("🦒")}>{`${"🦒"}`}</button>
      <button name="🐘" value={"🐘"} onClick={assign("🐘")}>{`${"🐘"}`}</button>
      <button name="🐊" value={"🐊"} onClick={assign("🐊")}>{`${"🐊"}`}</button>
      <p>{`onData: ${onDataType}`}</p>
      <p>{display}</p>
      <p>{params}</p>
      <p>{error}</p>
      <p>{status}</p>
      <button name="disable onData" onClick={() => assignOnData()}>
        disable onData
      </button>
      <button name="simple onData" onClick={() => assignOnData(simple)}>
        simple onData
      </button>
      {/* TODO: theres a typing bug here I cant figure out just yet */}
      <button name="callback onData" onClick={() => assignOnData(cb as never)}>
        callback onData
      </button>
      <button
        name="dispatch onData"
        onClick={() => assignOnData(dispatched as never)}
      >
        dispatch onData
      </button>
    </div>
  );
};

const mapStateToProps = (state: never): MP => ({
  state: ondataLifecycle.selector(state),
});

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>): DP => ({
  select: (params?: IconParams) => dispatch(ondataLifecycle.sync(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(MemoizedComponent);
