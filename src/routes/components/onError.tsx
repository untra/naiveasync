import React, { useState } from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { asyncLifecycle } from "../../naiveasync";
import { AsyncState, OnError } from "../../naiveasync/actions";
import { slowResolve } from "../../utils/promise";

const slowIconToName = (params: IconParams) =>
  slowResolve({
    icon: params.icon,
    name: iconToName[params.icon] || "NOT FOUND",
  });
const onErrorLifecycle = asyncLifecycle(
  "ONERROR_SELECTABLE",
  slowIconToName
).timeout(2000);

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
  const [onErrorType, setonErrorType] = useState("none");
  const assign = (icon: IconParams["icon"]) => () => select({ icon });
  const display = `selected: ${state.data?.icon || "..."} aka ${
    state.data?.name
  }`;
  const status = `status: ${state.status}`;
  const error = `error: ${state.error}`;
  const params = `params: ${JSON.stringify(state.params)}`;
  const assignonError = (onError?: OnError<never, IconParams>) => {
    if (onError) {
      setonErrorType(onError.name);
      onErrorLifecycle.onError(onError);
    } else {
      setonErrorType("none");
      // onErrorLifecycle.onError(null)
    }
  };
  const simple = () => {
    // eslint-disable-next-line no-console
    console.error("onError received!");
  };
  const cb: OnError<never, IconParams> = (error: string) => {
    // eslint-disable-next-line no-console
    console.error("an error was thrown", error);
  };
  const dispatched = (
    error: string,
    params: IconParams,
    dispatch: Dispatch<AnyAction>
  ) => {
    // eslint-disable-next-line no-console
    console.error("very bad error!", error);
    // eslint-disable-next-line no-console
    setTimeout(() => dispatch && dispatch(onErrorLifecycle.reset()), 2000);
  };

  return (
    <div>
      <button name="🦅" value={"🦅"} onClick={assign("🦅")}>{`${"🦅"}`}</button>
      <button name="🐅" value={"🐅"} onClick={assign("🐅")}>{`${"🐅"}`}</button>
      <button name="🦓" value={"🦓"} onClick={assign("🦓")}>{`${"🦓"}`}</button>
      <button name="🦒" value={"🦒"} onClick={assign("🦒")}>{`${"🦒"}`}</button>
      <button name="🐘" value={"🐘"} onClick={assign("🐘")}>{`${"🐘"}`}</button>
      <button name="🐊" value={"🐊"} onClick={assign("🐊")}>{`${"🐊"}`}</button>
      <p>{`onError: ${onErrorType}`}</p>
      <p>{display}</p>
      <p>{params}</p>
      <p>{error}</p>
      <p>{status}</p>
      <button name="disable onError" onClick={() => assignonError()}>
        disable onError
      </button>
      <button name="simple onError" onClick={() => assignonError(simple)}>
        simple onError
      </button>
      {/* TODO: theres a typing bug here I cant figure out just yet */}
      <button name="callback onError" onClick={() => assignonError(cb)}>
        callback onError
      </button>
      <button name="dispatch onError" onClick={() => assignonError(dispatched)}>
        dispatch onError
      </button>
    </div>
  );
};

const mapStateToProps = (state: never): MP => ({
  state: onErrorLifecycle.selector(state),
});

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>): DP => ({
  select: (params?: IconParams) => dispatch(onErrorLifecycle.sync(params)),
});

export default connect(mapStateToProps, mapDispatchToProps)(MemoizedComponent);
