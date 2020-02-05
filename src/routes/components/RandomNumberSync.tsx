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
const randomNumberFn = () => slowResolve(Math.floor(Math.random() * 100))
const randomNumberLifecycle = naiveAsyncLifecycle(randomNumberFn, 'RANDOM')

interface MP {
  state: NaiveAsyncState<number,any>
}

interface DP {
  generate : () => void
}

type Props = MP & DP

const RandomNumberSync : React.FC<Props> = ({state, generate }) => {
    const val = state.data
    useEffect(() => {
      console.log(val)
        generate()
    }, [val, generate])
    const display = `random number: ${val}`
    return (<p>{display}</p>)
}

const mapStateToProps = (
  state: any,
): MP => ({
  state : randomNumberLifecycle.selector(state)
});

const mapDispatchToProps = (
  dispatch: Dispatch<AnyAction>,
): DP => ({
  generate : () => dispatch(randomNumberLifecycle.sync({}))
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  RandomNumberSync
);