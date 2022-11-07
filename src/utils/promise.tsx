export const mockResolve = <T extends {}>(
  val: T,
  maxTime: number
): Promise<T> =>
  new Promise((resolve) => {
    const timeMS = Math.random() * maxTime;
    setTimeout(() => resolve(val), timeMS);
  });

export const mockReject = (
  err: Error | string,
  maxTime: number
): Promise<never> =>
  new Promise((resolve, reject) => {
    const timeMS = Math.random() * maxTime;
    setTimeout(() => reject(err), timeMS);
  });

export const slowResolve = <T extends {}>(val: T): Promise<T> =>
  mockResolve(val, 4000);

export const mediumResolve = <T extends {}>(val: T): Promise<T> =>
  mockResolve(val, 400);

export const quickResolve = <T extends {}>(val: T): Promise<T> =>
  mockResolve(val, 40);

export const quickReject = (err: Error | string): Promise<never> =>
  mockReject(err, 40);

export const mediumReject = (err: Error | string): Promise<never> =>
  mockReject(err, 400);

export const slowReject = (err: Error | string): Promise<never> =>
  mockReject(err, 4000);

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
