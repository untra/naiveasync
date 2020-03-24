import React, { useEffect } from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { naiveAsyncLifecycle } from "../../naiveasync"
import { NaiveAsyncState } from '../../naiveasync/actions'

const slowResolve = <T extends any>(val: T): Promise<T> => new Promise((resolve) => {
    const timeMS = Math.random() * 4000
    setTimeout(() => resolve(val), timeMS)
})
const intervalFn = () => slowResolve(Math.floor(Math.random() * 100))
const intervalLifecycle = naiveAsyncLifecycle(intervalFn, 'RANDOM')

interface MP {
  state: NaiveAsyncState<number,any>
}

interface DP {
  generate : () => void
}

type Props = MP & DP

const intervalSync : React.FC<Props> = ({state, generate }) => {
    const val = state.data
    useEffect(() => {
        generate()
    }, [val, generate])
    const display = `random number: ${val}`
    return (<p>{display}</p>)
}

const mapStateToProps = (
  state: any,
): MP => ({
  state : intervalLifecycle.selector(state)
});

const mapDispatchToProps = (
  dispatch: Dispatch<AnyAction>,
): DP => ({
  generate : () => dispatch(intervalLifecycle.sync())
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  intervalSync
);