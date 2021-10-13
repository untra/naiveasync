import React, { useEffect } from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { asyncLifecycle, AsyncState } from "../../naiveasync";
import { slowResolve } from "../../utils/promise";

const randomNumberFn = () => slowResolve(Math.floor(Math.random() * 100));
const randomNumberLifecycle = asyncLifecycle("RANDOM", randomNumberFn);

interface MP {
  state: AsyncState<number, never>;
}

interface DP {
  generate: () => void;
}

type Props = MP & DP;

const RandomNumberSync: React.FC<Props> = ({ state, generate }) => {
  const val = state.data;
  useEffect(() => {
    generate();
  }, [val, generate]);
  const display = `random number: ${val}`;
  return <p>{display}</p>;
};

const mapStateToProps = (state: never): MP => ({
  state: randomNumberLifecycle.selector(state),
});

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>): DP => ({
  generate: () => dispatch(randomNumberLifecycle.sync({})),
});

export default connect(mapStateToProps, mapDispatchToProps)(RandomNumberSync);
