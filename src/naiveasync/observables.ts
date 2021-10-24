/* eslint-disable @typescript-eslint/no-explicit-any */
import { Action, Middleware, Store } from "redux";
import {
  BehaviorSubject,
  from as rxFrom,
  Observable,
  ObservableInput,
  Subject,
} from "rxjs";
import { AnyAction } from "./actions";

/**
 * SubjectLike interface type containing method signatures critical to behavior of an observable subject
 * @interface SubjectLike
 * @template S
 * @template A
 */
interface SubjectLike<S, A = S> {
  subscribe: Subject<S>["subscribe"];
  next: Subject<A>["next"];
}

/**
 * StoreLike interface type containing method signatures critical to behavior of a redux store
 * @interface StoreLike
 * @template S
 * @template A
 */
interface StoreLike<S, A extends Action = AnyAction> {
  subscribe: Store<S, A>["subscribe"];
  getState: Store<S, A>["getState"];
  dispatch: Store<S, A>["dispatch"];
}

// const isPromise = <Data>(obj: Promise<Data> | any): obj is Promise<Data> =>
// obj instanceof Promise

// /** Internal. Converts an `Promise` to an `Observable` by piping its yield into the subscriber until the `Promise` is exhausted. */
// const $fromPromise = <Data>(asyncPromise: Promise<Data>): Observable<Data> =>
// new Observable<Data>(
//   subscriber =>
//     void (async () => {
//       const f = Observable.fr
//       console.log('this is the void promise!!!!')
//       try {
//         await asyncPromise
//         .then((data) => subscriber.next(data))
//         .catch((err) => subscriber.error(err))
//         .finally(() => {
//           if (subscriber.closed) {
//             return
//           }
//           subscriber.complete()
//         })
//       } catch (e) {
//         console.warn('wacky error', e)
//         subscriber.error(e)
//       }
//     })(),
// )

const isAsyncIterable = <Data>(
  obj: AsyncIterable<Data> | any
): obj is AsyncIterable<Data> =>
  Symbol.asyncIterator in obj &&
  typeof obj[Symbol.asyncIterator] === "function";

/** Internal. Converts an `AsyncIterable` to an `Observable` by piping its yield into the subscriber until the `AsyncIterable` is exhausted. */
const $fromAsyncIterable = <Data>(
  asyncIterable: AsyncIterable<Data>
): Observable<Data> =>
  new Observable<Data>(
    (subscriber) =>
      void (async () => {
        try {
          for await (const data of asyncIterable) {
            if (subscriber.closed) {
              return;
            }
            subscriber.next(data);
          }
          subscriber.complete();
        } catch (e) {
          subscriber.error(e);
        }
      })()
  );

/** Type guard that indicates whether an object has the crucial methods to behave like a Redux Store. */
export const isStoreLike = (
  maybeStoreLike: StoreLike<any, any> | any
): maybeStoreLike is StoreLike<any, any> =>
  !!maybeStoreLike &&
  "subscribe" in maybeStoreLike &&
  typeof maybeStoreLike.subscribe === "function" &&
  "getState" in maybeStoreLike &&
  typeof maybeStoreLike.getState === "function" &&
  "dispatch" in maybeStoreLike &&
  typeof maybeStoreLike.dispatch === "function";

/** Function that converts `Store<S, A>` -> `SubjectLike<S, A>`. */
const $fromStore = <S, A extends Action>(
  store: StoreLike<S, A>
): SubjectLike<S, A> => {
  const state$ = new BehaviorSubject<S>(store.getState());
  store.subscribe(() => {
    state$.next(store.getState());
  });
  return {
    subscribe: state$.subscribe.bind(state$) as any,
    next: (action: A) => {
      store.dispatch(action);
    },
  };
};
/**
 * $from creates a redux observable from an observableinput type (a promise or other subscribable)
 * @template Item
 * @param {ObservableInput<Item>} observableInput
 * @returns
 */
export const $from = <Item>(observableInput: ObservableInput<Item>) =>
  isStoreLike(observableInput)
    ? $fromStore(observableInput)
    : isAsyncIterable(observableInput)
    ? $fromAsyncIterable(observableInput)
    : // isPromise(observableInput) ? $fromPromise(observableInput) :
      rxFrom(observableInput);

/**
 * $toMiddleware creates a Redux Middleware that pipes all dispatched actions through the given Subject.
 * provides an indirect means to create an Observable<Action> from a Redux store.
 * Subscribers to the Subject are notified after the reducers are called, so can perform side-effects without delaying state updates.
 * This middleware can be used as a lightweight alternative to redux-observable
 * @param {Subject<Action>} action$
 * @returns {Middleware}
 */
export const $toMiddleware =
  (action$: Subject<Action>): Middleware =>
  () =>
  (next) =>
  (action) => {
    const result = next(action);
    action$.next(action);
    return result;
  };
