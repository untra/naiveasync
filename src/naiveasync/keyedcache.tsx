interface Cache<T> {
  [index: string]: T | undefined;
}

export class KeyedCache<T> {
  private cache: Cache<T>;
  public constructor() {
    this.cache = {};
  }
  public get(index: string): T | undefined {
    return this.cache[index];
  }
  public set(index: string, data: T): void {
    this.cache[index] = data;
  }
  public remove(index: string): void {
    delete this.cache[index];
  }
  public size(): number {
    return this.keys().length;
  }
  public keys(): string[] {
    return Object.keys(this.cache);
  }
}
