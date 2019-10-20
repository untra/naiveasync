interface Cache<T> {
    [index: string]: T | undefined
}

export class KeyedCache<T> {
    private cache: Cache<T>
    constructor() {
        this.cache = {}
    }
    public get(index: string) {
        return this.cache[index]
    }
    public set(index: string, data: T) {
        this.cache[index] = data
    }
    public remove(index: string) {
        delete this.cache[index]
    }
    public size() {
        return this.keys().length
    }
    public keys() {
        return Object.keys(this.cache)
    }
}