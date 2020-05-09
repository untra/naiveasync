import React, { useEffect, useState } from "react";
// tslint:disable-next-line: no-implicit-dependencies
import { connect } from "react-redux";
import { AnyAction, Dispatch } from "redux";
import { naiveAsyncLifecycle } from "../../naiveasync"
import { NaiveAsyncState } from '../../naiveasync/actions'

const slowResolve = <T extends any>(val: T): Promise<T> => new Promise((resolve) => {
  const timeMS = Math.random() * 4000
  setTimeout(() => resolve(val), timeMS)
})
const randomNumberFn = (params: RandomNumberSyncParams) => {
  return slowResolve((Math.floor(Math.random() * 100)) * params.multiplier)
}
const randomNumberLifecycle = naiveAsyncLifecycle(randomNumberFn, 'RANDOM_SELECTABLE')

interface RandomNumberSyncParams {
  multiplier: number
}

interface MP {
  state: NaiveAsyncState<number, RandomNumberSyncParams>
}

interface DP {
  generate: (params?: RandomNumberSyncParams) => void
}

type Props = MP & DP

const RandomNumberSync: React.FC<Props> = ({ state, generate }) => {
  const val = state.data
  const [multiplier, setMultiplier] = useState(1)
  useEffect(() => {
    generate({ multiplier })
  }, [generate, multiplier])
  useEffect(() => {
    generate()
  }, [val, generate])
  const assignMultiplier = (num: number) => () => setMultiplier(num)
  const display = `multiplier: ${multiplier}x, random number: ${val}`
  const status = `status: ${state.status}`
  const error = `error: ${state.error}`
  return (<div>
    <button name="0x" value={0} onClick={assignMultiplier(0)}>0x</button>
    <button name="1x" value={1} onClick={assignMultiplier(1)}>1x</button>
    <button name="2x" value={2} onClick={assignMultiplier(2)}>2x</button>
    <button name="3x" value={3} onClick={assignMultiplier(3)}>3x</button>
    <button name="5x" value={5} onClick={assignMultiplier(5)}>5x</button>
    <button name="5x" value={5} onClick={assignMultiplier(10)}>10x</button>
    <p>{display}</p>
    <p>{status}</p>
  </div>)
}

const mapStateToProps = (
  state: any,
): MP => ({
  state: randomNumberLifecycle.selector(state)
});

const mapDispatchToProps = (
  dispatch: Dispatch<AnyAction>,
): DP => ({
  generate: (params?: RandomNumberSyncParams) => {
    return dispatch(randomNumberLifecycle.sync(params))
  }
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(
  RandomNumberSync
);