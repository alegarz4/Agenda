/* Registro del Service Worker y funciones de notificacion para la PWA. */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register('./service-worker.js');
  } catch (error) {
    return null;
  }
}

async function refreshServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    window.location.reload();
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();

  if (registration) {
    await registration.update();
  }

  window.location.reload();
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  return Notification.requestPermission();
}

async function showNotification(title, body, tag = `lumen-${Date.now()}`) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(title, {
      body,
      icon: './assets/icons/icon-192.png',
      badge: './assets/icons/icon-192.png',
      tag,
      renotify: true,
      data: {
        url: './index.html#alertas'
      }
    });

    return true;
  }

  new Notification(title, {
    body,
    icon: './assets/icons/icon.svg',
    tag
  });

  return true;
}

export {
  registerServiceWorker,
  refreshServiceWorker,
  requestNotificationPermission,
  showNotification
};
