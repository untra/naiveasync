import React, { useEffect } from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect, useDispatch } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { asyncLifecycle, mockDoneAsyncState } from "../../naiveasync";
import { NaiveAsyncState } from "../../naiveasync/actions";
import { slowResolve } from "../../utils/promise";

const slowIconToName = (params: {}) =>
  slowResolve({
    icon: "",
    name: "DEBOUNCE",
  });
const assignTestLifecycle = asyncLifecycle("ASSIGN_TEST", slowIconToName);

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

const AssignedComponent: React.FC<Props> = ({ state, select }) => {
  const display = `selected: ${state.data?.icon} (${state.data?.name})`;
  const status = `status: ${state.status}`;
  const error = `error: ${state.error}`;
  const params = `params: ${JSON.stringify(state.params)}`;
  const dispatch = useDispatch();
  useEffect(() => {
    const icon = "🦅";
    const name = "assigned!";
    dispatch(
      assignTestLifecycle.assign(mockDoneAsyncState({ icon, name }, {}))
    );
  }, [dispatch]);

  return (
    <div>
      <i>(this component should appear in an initial "done" state)</i>
      <p>{display}</p>
      <p>{params}</p>
      <p>{error}</p>
      <p>{status}</p>
    </div>
  );
};

const mapStateToProps = (state: never): MP => ({
  state: assignTestLifecycle.selector(state),
});

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>): DP => ({
  select: () => dispatch(assignTestLifecycle.sync({})),
});

export default connect(mapStateToProps, mapDispatchToProps)(AssignedComponent);
