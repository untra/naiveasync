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
    public update(index: string, data: Partial<T>) {
        const state = this.cache[index]
        if (state && typeof(data) === "object") {
            const updated : T = {...state, ...data}
            this.cache[index] = updated
        }
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