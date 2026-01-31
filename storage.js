const DEFAULT_PREFIX = 'vibeisland2';

const createMemoryStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

const resolveStorage = (storage) => {
  if (storage) {
    return storage;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return createMemoryStorage();
};

const buildKey = (prefix, key) => `${prefix}:${key}`;

const parseJSON = (value, fallback) => {
  if (value === null) {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

export const createStorage = ({ prefix = DEFAULT_PREFIX, storage } = {}) => {
  const backingStorage = resolveStorage(storage);

  return {
    get: (key) => backingStorage.getItem(buildKey(prefix, key)),
    set: (key, value) => {
      backingStorage.setItem(buildKey(prefix, key), String(value));
    },
    remove: (key) => {
      backingStorage.removeItem(buildKey(prefix, key));
    },
    clear: () => {
      const keysToRemove = [];
      for (let index = 0; index < backingStorage.length; index += 1) {
        const storedKey = backingStorage.key(index);
        if (storedKey?.startsWith(`${prefix}:`)) {
          keysToRemove.push(storedKey);
        }
      }
      keysToRemove.forEach((storedKey) => backingStorage.removeItem(storedKey));
    },
    getJSON: (key, fallback = null) =>
      parseJSON(backingStorage.getItem(buildKey(prefix, key)), fallback),
    setJSON: (key, value) => {
      backingStorage.setItem(buildKey(prefix, key), JSON.stringify(value));
    },
    updateJSON: (key, updater, fallback = {}) => {
      const currentValue = parseJSON(
        backingStorage.getItem(buildKey(prefix, key)),
        fallback,
      );
      const nextValue = updater(currentValue);
      backingStorage.setItem(buildKey(prefix, key), JSON.stringify(nextValue));
      return nextValue;
    },
  };
};

export const storage = createStorage();
