/* Utilidades PWA; la logica offline se completara en una tarea posterior. */

function registerServiceWorker(serviceWorkerPath) {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(serviceWorkerPath);
  });
}

export { registerServiceWorker };
