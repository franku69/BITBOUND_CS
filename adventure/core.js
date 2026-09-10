( () => {
  'use strict';
  /** Compact a dense array without allocating a replacement array. */
  function compactInPlace(list, keep, recycle) {
    let write = 0;
    for (let read = 0; read < list.length; read++) {
      const item = list[read];
      if (keep(item)) list[write++] = item; else if (recycle) recycle(item);
    }
    list.length = write;
    return list;
  }
  /** Add to a bounded dense store, reclaiming dead entries before replacing one. */
  function pushBounded(list, item, limit, { keep = value => value && value.alive !== false, replace = value => value && value.alive !== false } = {}) {
    if (list.length >= limit) compactInPlace(list, keep);
    if (list.length < limit) {
      list.push(item);
      return item;
    }
    const index = list.findIndex(replace);
    if (index < 0) return null;
    list[index] = item;
    return item;
  }
  /** Reuses short-lived objects to avoid garbage-collector spikes during combat. */
  class ObjectPool { constructor(factory, reset, maxFree = 256) {
      this.factory = factory;
      this.reset = reset;
      this.maxFree = maxFree;
      this.free = [];
    } acquire(seed) {
      const value = this.free.pop() || this.factory();
      this.reset(value, seed);
      return value;
    } release(value) {
      if (this.free.length < this.maxFree) this.free.push(value);
    } clear() {
      this.free.length = 0;
    } get available() {
      return this.free.length;
    } }
  /** Keeps only the most recently used heavy assets instead of growing forever. */
  class LruCache { constructor(limit = 4) {
      this.limit = Math.max(1, limit | 0);
      this.values = new Map();
    } has(key) {
      return this.values.has(key);
    } get(key) {
      if (!this.values.has(key)) return undefined;
      const value = this.values.get(key);
      this.values.delete(key);
      this.values.set(key, value);
      return value;
    } set(key, value) {
      if (this.values.has(key)) this.values.delete(key);
      this.values.set(key, value);
      while (this.values.size > this.limit) this.values.delete(this.values.keys().next().value);
      return value;
    } delete(key) {
      return this.values.delete(key);
    } clear() {
      this.values.clear();
    } keys() {
      return this.values.keys();
    } get size() {
      return this.values.size;
    } }
  /**
 * One-dimensional spatial hash for side-scrolling worlds.
 * Rebuild is O(n); local collision queries inspect only overlapping buckets.
 */
  class SpatialHash1D { constructor(cellSize = 128) {
      this.cellSize = Math.max(16, cellSize | 0);
      this.buckets = new Map();
      this.bucketPool = [];
      this.seen = new WeakMap();
      this.querySerial = 0;
    } clear() {
      for (const bucket of this.buckets.values()) {
        bucket.length = 0;
        this.bucketPool.push(bucket);
      }
      this.buckets.clear();
    } rebuild(items, getBounds = null, isActive = value => value && value.alive !== false) {
      this.clear();
      for (const item of items) {
        if (!isActive(item)) continue;
        const bounds = getBounds ? getBounds(item): null;
        const first = Math.floor( (bounds ? bounds[0]: item.x) / this.cellSize);
        const last = Math.floor( (bounds ? bounds[1]: item.x + (item.w || 0)) / this.cellSize);
        for (let key = first; key <= last; key++) {
          let bucket = this.buckets.get(key);
          if (!bucket) {
            bucket = this.bucketPool.pop() || [];
            this.buckets.set(key, bucket);
          }
          bucket.push(item);
        }
      }
      return this;
    } visit(min, max, visitor, stopOnTruthy = false) {
      this.querySerial = (this.querySerial + 1) >>> 0;
      if (this.querySerial === 0) {
        this.seen = new WeakMap();
        this.querySerial = 1;
      }
      const serial = this.querySerial, first = Math.floor(min / this.cellSize), last = Math.floor(max / this.cellSize);
      for (let key = first; key <= last; key++) {
        const bucket = this.buckets.get(key);
        if (!bucket) continue;
        for (const item of bucket) {
          if (this.seen.get(item) === serial) continue;
          this.seen.set(item, serial);
          if (visitor(item) && stopOnTruthy) return true;
        }
      }
      return false;
    } some(min, max, visitor) {
      return this.visit(min, max, visitor, true);
    } forEach(min, max, visitor) {
      this.visit(min, max, visitor, false);
    } }
  /** Avoids redundant DOM writes in the frequently refreshed HUD. */
  class DomWriteCache { text(element, value) {
      if (!element) return;
      const next = String(value);
      if (element.textContent !== next) element.textContent = next;
    } style(element, property, value) {
      if (element && element.style[property] !== value) element.style[property] = value;
    } toggle(element, className, force) {
      if (element && element.classList.contains(className) !== Boolean(force)) element.classList.toggle(className, Boolean(force));
    } }
  window.BitboundCore = Object.freeze({
    compactInPlace,
    pushBounded,
    ObjectPool,
    LruCache,
    SpatialHash1D,
    DomWriteCache
  });
})();
