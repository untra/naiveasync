import React from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { asyncLifecycle } from "../../naiveasync";
import { NaiveAsyncState } from "../../naiveasync/actions";
import { slowResolve } from "../../utils/promise";

const slowIconToName = (params: {}) => {
  // eslint-disable-next-line no-console
  console.log("debounce called!");
  return slowResolve({
    icon: "",
    name: "DEBOUNCE",
  });
};
const debounceLifecycle = asyncLifecycle(
  "DEBOUNCE_SELECTABLE",
  slowIconToName
).debounce(2000);

interface IconResp {
  icon: string;
  name: string;
}

interface MP {
  state: NaiveAsyncState<IconResp, {}>;
}

interface DP {
  select: (params?: {}) => void;
}

type Props = MP & DP;

const MemoizedComponent: React.FC<Props> = ({ state, select }) => {
  const display = `selected: ${state.data?.icon || "..."} (check the logs)`;
  const status = `status: ${state.status}`;
  const error = `error: ${state.error}`;
  const params = `params: ${JSON.stringify(state.params)}`;

  return (
    <div>
      <button
        name="🦅"
        value={"🦅"}
        onClick={() => select()}
      >{`select`}</button>
      <p>{display}</p>
      <p>{params}</p>
      <p>{error}</p>
      <p>{status}</p>
    </div>
  );
};

const mapStateToProps = (state: never): MP => ({
  state: debounceLifecycle.selector(state),
});

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>): DP => ({
  select: () => dispatch(debounceLifecycle.sync({})),
});

export default connect(mapStateToProps, mapDispatchToProps)(MemoizedComponent);
