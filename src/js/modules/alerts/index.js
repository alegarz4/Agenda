/* Modulo Alertas de Lumen Planner.
   Observa eventos de Agenda, muestra avisos proximos y permite activar notificaciones del navegador. */

const AGENDA_STORAGE_KEY = 'agenda';
const ALERTS_STORAGE_KEY = 'alerts';
const DEFAULT_ALERT_WINDOW_MINUTES = 60;

function createAlertsModule() {
  let root = null;
  let storage = null;
  let timerId = null;
  let state = null;

  function mount(rootElement, appContext) {
    root = rootElement;
    storage = appContext.storage;
    state = loadAlertsState(storage);

    render();
    bindGlobalEvents();
    startAlertMonitor();
  }

  function render() {
    const agendaState = getAgendaState();
    const upcomingAlerts = getUpcomingAlerts(agendaState.events, state.windowMinutes);

    root.innerHTML = buildAlertsMarkup(upcomingAlerts, state.windowMinutes);
    bindAlertsEvents();
  }

  function bindAlertsEvents() {
    const enableButton = root.querySelector('[data-alerts-enable]');
    const testButton = root.querySelector('[data-alerts-test]');
    const windowSelect = root.querySelector('[data-alerts-window]');

    if (enableButton) {
      enableButton.addEventListener('click', requestNotificationPermission);
    }

    if (testButton) {
      testButton.addEventListener('click', () => {
        if (canSendBrowserNotification()) {
          showNotification('Lumen Planner', 'Las alertas estan listas para tus eventos de Agenda.');
          updateFeedback('Alerta de prueba enviada.');
          return;
        }

        updateFeedback('Activa las alertas para recibir notificaciones del navegador.');
      });
    }

    if (windowSelect) {
      windowSelect.addEventListener('change', () => {
        state.windowMinutes = Number(windowSelect.value);
        saveAlertsState();
        render();
      });
    }
  }

  function bindGlobalEvents() {
    window.addEventListener('lumen:agenda-updated', () => {
      render();
      checkDueAlerts();
    });
  }

  function startAlertMonitor() {
    checkDueAlerts();
    timerId = window.setInterval(checkDueAlerts, 30000);
  }

  function checkDueAlerts() {
    const agendaState = getAgendaState();
    const dueAlerts = getDueAlerts(agendaState.events);

    dueAlerts.forEach((event) => {
      if (state.dismissedEventIds.includes(event.id)) {
        return;
      }

      showNotification('Evento proximo', `${event.title} inicia ${event.time || 'hoy'}.`);
      state.dismissedEventIds = [...state.dismissedEventIds, event.id];
    });

    saveAlertsState();
    render();
  }

  function requestNotificationPermission() {
    if (!('Notification' in window)) {
      updateFeedback('Este navegador no soporta notificaciones.');
      return;
    }

    Notification.requestPermission().then((permission) => {
      state.permission = permission;
      saveAlertsState();
      render();

      if (permission === 'granted') {
        showNotification('Lumen Planner', 'Recibiras alertas de tus eventos proximos.');
        updateFeedback('Notificaciones activadas.');
      } else {
        updateFeedback('Las notificaciones no fueron activadas.');
      }
    });
  }

  function showNotification(title, body) {
    if (canSendBrowserNotification()) {
      new Notification(title, {
        body,
        icon: './assets/icons/icon.svg'
      });
      return;
    }

    updateFeedback(body);
  }

  function canSendBrowserNotification() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  function updateFeedback(message) {
    const feedbackElement = root.querySelector('[data-alerts-feedback]');

    if (feedbackElement) {
      feedbackElement.textContent = message;
    }
  }

  function getAgendaState() {
    return storage.get(AGENDA_STORAGE_KEY) || {
      events: [],
      categories: []
    };
  }

  function saveAlertsState() {
    storage.set(ALERTS_STORAGE_KEY, state);
  }

  return {
    name: 'alerts',
    mount,
    destroy() {
      if (timerId) {
        window.clearInterval(timerId);
      }
    }
  };
}

function loadAlertsState(storage) {
  const storedState = storage.get(ALERTS_STORAGE_KEY);

  return {
    permission: getNotificationPermission(),
    windowMinutes: DEFAULT_ALERT_WINDOW_MINUTES,
    dismissedEventIds: [],
    ...storedState
  };
}

function buildAlertsMarkup(alerts, selectedWindowMinutes) {
  return `
    <article class="alerts" aria-labelledby="alerts-title">
      <header class="alerts-header">
        <div>
          <p class="eyebrow">Alertas</p>
          <h2 id="alerts-title">Avisos inteligentes</h2>
          <p>Recibe recordatorios de eventos cercanos de tu Agenda.</p>
        </div>
        <div class="alerts-actions">
          <label class="alert-window">
            <span>Anticipacion</span>
            <select data-alerts-window>
              ${buildWindowOptionsMarkup(selectedWindowMinutes)}
            </select>
          </label>
          <button class="secondary-action" type="button" data-alerts-enable>
            Activar alertas
          </button>
          <button class="secondary-action" type="button" data-alerts-test>
            Probar alerta
          </button>
        </div>
      </header>

      <section class="alerts-panel" aria-label="Eventos con alerta proxima">
        <div class="panel-header">
          <h3>Proximas alertas</h3>
          <span>${alerts.length}</span>
        </div>
        ${buildAlertsListMarkup(alerts)}
        <p class="alerts-feedback" data-alerts-feedback role="status"></p>
      </section>
    </article>
  `;
}

function buildWindowOptionsMarkup(selectedValue) {
  const options = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hora' },
    { value: 120, label: '2 horas' },
    { value: 1440, label: '1 dia' }
  ];

  return options.map((option) => `
    <option value="${option.value}" ${option.value === selectedValue ? 'selected' : ''}>
      ${option.label}
    </option>
  `).join('');
}

function buildAlertsListMarkup(alerts) {
  if (!alerts.length) {
    return '<p class="empty-alerts">No hay eventos proximos dentro del periodo seleccionado.</p>';
  }

  return `
    <ul class="alerts-list">
      ${alerts.map((event) => `
        <li>
          <div>
            <strong>${escapeHtml(event.title)}</strong>
            <small>${formatAlertTime(event)}</small>
          </div>
          <span>${event.minutesUntil <= 0 ? 'Ahora' : `En ${event.minutesUntil} min`}</span>
        </li>
      `).join('')}
    </ul>
  `;
}

function getUpcomingAlerts(events, windowMinutes) {
  const now = new Date();

  return events
    .map((event) => ({
      ...event,
      startsAt: buildEventDate(event),
      minutesUntil: Math.round((buildEventDate(event).getTime() - now.getTime()) / 60000)
    }))
    .filter((event) => event.startsAt >= now && event.minutesUntil <= getEventReminderWindow(event, windowMinutes))
    .sort((first, second) => first.startsAt - second.startsAt);
}

function getDueAlerts(events) {
  const now = new Date();

  return events
    .map((event) => ({
      ...event,
      startsAt: buildEventDate(event)
    }))
    .filter((event) => {
      const minutesUntil = Math.round((event.startsAt.getTime() - now.getTime()) / 60000);
      const reminderWindow = getEventReminderWindow(event, 1);
      return minutesUntil >= 0 && minutesUntil <= Math.max(1, reminderWindow);
    });
}

function getEventReminderWindow(event, fallbackMinutes) {
  return Number(event.reminderMinutes || fallbackMinutes);
}

function buildEventDate(event) {
  const time = event.time || '09:00';
  const [year, month, day] = event.date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  return new Date(year, month - 1, day, hour || 0, minute || 0);
}

function formatAlertTime(event) {
  return `${escapeHtml(event.date)} ${escapeHtml(event.time || 'Sin hora')}`;
}

function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }

  return Notification.permission;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export { createAlertsModule };
