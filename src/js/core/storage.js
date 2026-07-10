/* Capa pequena de LocalStorage con espacio de nombres propio de la PWA. */
const STORAGE_NAMESPACE = 'lumen-planner-v2';

function readStore(key, fallback) {
  const rawValue = window.localStorage.getItem(`${STORAGE_NAMESPACE}:${key}`);

  if (!rawValue) {
    writeStore(key, fallback);
    return clone(fallback);
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    writeStore(key, fallback);
    return clone(fallback);
  }
}

function writeStore(key, value) {
  window.localStorage.setItem(`${STORAGE_NAMESPACE}:${key}`, JSON.stringify(value));
}

function removeStore(key) {
  window.localStorage.removeItem(`${STORAGE_NAMESPACE}:${key}`);
}

function exportStore() {
  const prefix = `${STORAGE_NAMESPACE}:`;
  const data = {};

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(prefix))
    .sort()
    .forEach((key) => {
      data[key] = window.localStorage.getItem(key);
    });

  return {
    app: 'Lumen Planner',
    version: 2,
    exportedAt: new Date().toISOString(),
    data
  };
}

function importStore(rawContent) {
  const payload = JSON.parse(rawContent);
  const prefix = `${STORAGE_NAMESPACE}:`;

  if (!payload || payload.app !== 'Lumen Planner' || !payload.data || typeof payload.data !== 'object') {
    throw new Error('Archivo de respaldo invalido');
  }

  Object.entries(payload.data).forEach(([key, value]) => {
    if (!key.startsWith(prefix) || typeof value !== 'string') {
      return;
    }

    JSON.parse(value);
    window.localStorage.setItem(key, value);
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export {
  STORAGE_NAMESPACE,
  readStore,
  writeStore,
  removeStore,
  exportStore,
  importStore
};
