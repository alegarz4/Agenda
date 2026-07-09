/* Adaptador base para LocalStorage con namespace de aplicacion. */

function createStorageAdapter(namespace) {
  function buildKey(key) {
    return `${namespace}:${key}`;
  }

  return {
    namespace,

    get(key) {
      const rawValue = window.localStorage.getItem(buildKey(key));

      if (!rawValue) {
        return null;
      }

      try {
        return JSON.parse(rawValue);
      } catch (error) {
        window.localStorage.removeItem(buildKey(key));
        return null;
      }
    },

    set(key, value) {
      window.localStorage.setItem(buildKey(key), JSON.stringify(value));
    },

    remove(key) {
      window.localStorage.removeItem(buildKey(key));
    }
  };
}

export { createStorageAdapter };
