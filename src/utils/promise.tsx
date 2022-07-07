export const mockResolve = <T extends unknown>(
  val: T,
  maxTime: number
): Promise<T> =>
  new Promise((resolve) => {
    const timeMS = Math.random() * maxTime;
    setTimeout(() => resolve(val), timeMS);
  });

export const mockReject = (err: Error, maxTime: number): Promise<never> =>
  new Promise((resolve, reject) => {
    const timeMS = Math.random() * maxTime;
    setTimeout(() => reject(err), timeMS);
  });

export const mockRejectString = (
  err: string,
  maxTime: number
): Promise<never> =>
  new Promise((resolve, reject) => {
    const timeMS = Math.random() * maxTime;
    setTimeout(() => reject(err), timeMS);
  });

export const slowResolve = <T extends unknown>(val: T): Promise<T> =>
  mockResolve(val, 4000);

export const mediumResolve = <T extends unknown>(val: T): Promise<T> =>
  mockResolve(val, 400);

export const quickResolve = <T extends unknown>(val: T): Promise<T> =>
  mockResolve(val, 40);

export const quickReject = (err: Error): Promise<never> => mockReject(err, 40);

export const mediumReject = (err: Error): Promise<never> =>
  mockReject(err, 400);

export const slowReject = (err: Error): Promise<never> => mockReject(err, 4000);
