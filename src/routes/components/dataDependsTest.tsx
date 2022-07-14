import React from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect, useDispatch } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { AsyncLifecycle, asyncLifecycle, AsyncState } from "../../naiveasync";

const resolveMedium = <T extends {}>(val: T): Promise<T> =>
  new Promise((resolve) => {
    const rand = Math.random();
    const timeMS = rand * 5000;
    // eslint-disable-next-line no-console
    console.log(`Chosen random value: ${rand}`);

    setTimeout(() => {
      resolve(val);
    }, timeMS);
  });

const requiredLifecycle: AsyncLifecycle<{}, {}> = asyncLifecycle(
  "25_REQUIRED_TEST",
  resolveMedium
);

const dependsLifecycle: AsyncLifecycle<{}, {}> = asyncLifecycle(
  "25_DEPENDS_TEST",
  resolveMedium
).dataDepends(requiredLifecycle.id);

interface MP {
  dependstate: AsyncState<{}, {}>;
  requiredstate: AsyncState<{}, {}>;
}

interface DP {
  select: (params?: {}) => void;
}

type Props = MP & DP;

const DependsTestComponent: React.FC<Props> = ({
  dependstate,
  requiredstate,
}) => {
  const dispatch = useDispatch();
  const dependssync = (params: {}) => dispatch(dependsLifecycle.sync(params));
  const dependscall = (params: {}) => dispatch(dependsLifecycle.call(params));
  const dependsreset = () => dispatch(dependsLifecycle.reset());
  const requiredsync = (params: {}) => dispatch(requiredLifecycle.sync(params));
  const requiredcall = (params: {}) => dispatch(requiredLifecycle.call(params));
  const requiredreset = () => dispatch(requiredLifecycle.reset());

  return (
    <div>
      <div>
        <h4>Dependendant State</h4>
        <p>status: {JSON.stringify(dependstate.status)}</p>
        <p>params: {JSON.stringify(dependstate.params)}</p>
        <p>error: {JSON.stringify(dependstate.error)}</p>
        <p>data: {JSON.stringify(dependstate.data)}</p>
        <button onClick={() => dependscall({})}>call</button>
        <button
          style={{ backgroundColor: "cyan" }}
          onClick={() => dependssync({})}
        >
          sync
        </button>
        <button
          style={{ backgroundColor: "yellow" }}
          onClick={() => dependsreset()}
        >
          reset
        </button>
      </div>
      <div>
        <h4>Required State</h4>
        <p>status: {JSON.stringify(requiredstate.status)}</p>
        <p>params: {JSON.stringify(requiredstate.params)}</p>
        <p>error: {JSON.stringify(requiredstate.error)}</p>
        <p>data: {JSON.stringify(requiredstate.data)}</p>
        <button onClick={() => requiredcall({})}>call</button>
        <button
          style={{ backgroundColor: "cyan" }}
          onClick={() => requiredsync({})}
        >
          sync
        </button>
        <button
          style={{ backgroundColor: "yellow" }}
          onClick={() => requiredreset()}
        >
          reset
        </button>
      </div>
    </div>
  );
};

const mapStateToProps = (state: never): MP => ({
  dependstate: dependsLifecycle.selector(state),
  requiredstate: requiredLifecycle.selector(state),
});

const mapDispatchToProps = (dispatch: Dispatch<AnyAction>): DP => ({
  select: () => dispatch(dependsLifecycle.sync({})),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DependsTestComponent);
