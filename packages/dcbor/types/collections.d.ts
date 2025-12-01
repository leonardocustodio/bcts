declare module 'collections/sorted-map' {
  export class SortedMap<K = any, V = any> {
      constructor(entries?: ReadonlyArray<[K, V]> | null, equals?: (a: K, b: K) => boolean, compare?: (a: K, b: K) => number);

      set(key: K, value: V): this;
      get(key: K): V | undefined;
      delete(key: K): boolean;
      has(key: K): boolean;
      forEach(callbackfn: (value: V, index: K, map: SortedMap<K, V>) => void, thisArg?: any): void;
      map<T>(callbackfn: (value: V, index: K, map: SortedMap<K, V>) => T, thisArg?: any): T[];
      length: number;
      max(): V | undefined;
  }
}
