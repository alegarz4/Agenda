/* Modulo Dashboard de Lumen Planner.
   Contiene saludo, fecha, hora, resumen diario, prioridades, eventos y accion principal. */

const DASHBOARD_STORAGE_KEY = 'dashboard';
const AGENDA_STORAGE_KEY = 'agenda';

const WORK_CATEGORIES = [
  { id: 'pendiente', label: 'Pendiente' },
  { id: 'nota', label: 'Nota' },
  { id: 'asunto', label: 'Asunto importante' },
  { id: 'reunion', label: 'Reunion' },
  { id: 'evento', label: 'Evento' },
  { id: 'personal', label: 'Personal' }
];

const DEFAULT_DASHBOARD_STATE = {
  userName: 'Alejandra',
  summary: {
    title: 'Resumen de trabajo',
    completed: 0,
    pending: 3,
    nextBlock: 'Revisar agenda'
  },
  priorityTasks: [
    {
      id: 'task-pending',
      label: 'Revisar pendientes del dia',
      meta: 'Prioridad alta'
    },
    {
      id: 'task-meetings',
      label: 'Confirmar reuniones y llamadas',
      meta: 'Antes de iniciar'
    },
    {
      id: 'task-important',
      label: 'Marcar asuntos importantes',
      meta: 'Seguimiento'
    }
  ],
  upcomingEvents: [
    {
      id: 'event-review',
      time: '09:00',
      title: 'Revision de agenda'
    },
    {
      id: 'event-follow',
      time: '11:30',
      title: 'Seguimiento de pendientes'
    },
    {
      id: 'event-notes',
      time: '14:00',
      title: 'Captura de notas importantes'
    }
  ]
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const TIME_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

function createDashboardModule() {
  let clockTimerId = null;

  function mount(rootElement, appContext) {
    renderDashboard(rootElement, appContext.storage);

    clockTimerId = window.setInterval(() => {
      updateDateTime(rootElement);
    }, 1000);

    window.addEventListener('lumen:agenda-updated', () => {
      renderDashboard(rootElement, appContext.storage);
    });
  }

  function destroy() {
    if (clockTimerId) {
      window.clearInterval(clockTimerId);
      clockTimerId = null;
    }
  }

  return {
    name: 'dashboard',
    mount,
    destroy
  };
}

function renderDashboard(rootElement, storage) {
  const dashboardState = buildDashboardState(storage);

  rootElement.innerHTML = buildDashboardMarkup(dashboardState);
  updateDateTime(rootElement);
  bindDashboardActions(rootElement, storage, dashboardState);
  bindQuickCapture(rootElement, storage);
}

function loadDashboardState(storage) {
  const storedState = storage.get(DASHBOARD_STORAGE_KEY);

  if (!storedState) {
    storage.set(DASHBOARD_STORAGE_KEY, DEFAULT_DASHBOARD_STATE);
    return DEFAULT_DASHBOARD_STATE;
  }

  return {
    ...DEFAULT_DASHBOARD_STATE,
    ...storedState,
    summary: {
      ...DEFAULT_DASHBOARD_STATE.summary,
      ...storedState.summary
    },
    priorityTasks: storedState.priorityTasks || DEFAULT_DASHBOARD_STATE.priorityTasks,
    upcomingEvents: storedState.upcomingEvents || DEFAULT_DASHBOARD_STATE.upcomingEvents
  };
}

function buildDashboardState(storage) {
  const dashboardState = loadDashboardState(storage);
  const agendaState = storage.get(AGENDA_STORAGE_KEY) || { events: [] };
  const today = getTodayIsoDate();
  const todayEvents = agendaState.events.filter((event) => event.date === today);
  const openEvents = todayEvents.filter((event) => event.status !== 'realizado');
  const nextEvents = agendaState.events
    .filter((event) => buildEventDate(event) >= new Date())
    .sort((first, second) => buildEventDate(first) - buildEventDate(second))
    .slice(0, 3);

  return {
    ...dashboardState,
    summary: {
      ...dashboardState.summary,
      pending: openEvents.length,
      completed: todayEvents.filter((event) => event.status === 'realizado').length,
      nextBlock: nextEvents[0]?.title || dashboardState.summary.nextBlock
    },
    categorySummary: buildCategorySummary(todayEvents),
    priorityTasks: buildMemoryTasks(todayEvents, dashboardState.priorityTasks),
    upcomingEvents: nextEvents.length ? nextEvents.map((event) => ({
      id: event.id,
      time: event.time || 'Sin hora',
      title: event.title
    })) : dashboardState.upcomingEvents
  };
}

function buildDashboardMarkup(state) {
  return `
    <article class="dashboard" aria-labelledby="dashboard-title">
      <section class="dashboard-hero">
        <div class="dashboard-hero-copy">
          <p class="eyebrow">Inicio</p>
          <h2 id="dashboard-title">${getGreeting()}, ${escapeHtml(state.userName)}</h2>
          <p class="dashboard-subtitle">Tu agenda de trabajo para pendientes, notas, asuntos importantes, reuniones y eventos.</p>
        </div>
        <div class="dashboard-clock" aria-label="Fecha y hora actual">
          <span class="dashboard-date" data-dashboard-date></span>
          <strong class="dashboard-time" data-dashboard-time></strong>
        </div>
      </section>

      <section class="dashboard-grid" aria-label="Resumen del dia">
        <article class="summary-card">
          <p class="card-kicker">${escapeHtml(state.summary.title)}</p>
          <div class="summary-metrics">
            <div>
              <strong>${state.summary.pending}</strong>
              <span>Pendientes</span>
            </div>
            <div>
              <strong>${state.summary.completed}</strong>
              <span>Completadas</span>
            </div>
          </div>
          <p class="summary-note">Siguiente bloque: ${escapeHtml(state.summary.nextBlock)}</p>
        </article>

        <article class="quick-capture-card">
          <div class="panel-header">
            <h3>Captura rapida</h3>
            <span>+</span>
          </div>
          <form class="quick-capture-form" data-quick-capture-form>
            <label>
              <span>Tipo</span>
              <select name="categoryId">
                ${WORK_CATEGORIES.map((category) => `
                  <option value="${escapeHtml(category.id)}">${escapeHtml(category.label)}</option>
                `).join('')}
              </select>
            </label>
            <label>
              <span>Registro</span>
              <input name="title" type="text" placeholder="Anota lo importante aqui" required>
            </label>
            <div class="quick-capture-row">
              <label>
                <span>Fecha</span>
                <input name="date" type="date" value="${getTodayIsoDate()}" required>
              </label>
              <label>
                <span>Hora</span>
                <input name="time" type="time">
              </label>
            </div>
            <label>
              <span>Notas</span>
              <textarea name="notes" rows="3" placeholder="Contexto, persona relacionada, acuerdo o seguimiento"></textarea>
            </label>
            <button class="primary-action" type="submit">Guardar en agenda</button>
            <p class="quick-capture-feedback" data-quick-capture-feedback role="status"></p>
          </form>
        </article>

        <article class="dashboard-panel">
          <div class="panel-header">
            <h3>Pendientes prioritarios</h3>
            <span>${state.priorityTasks.length}</span>
          </div>
          <ul class="priority-list">
            ${state.priorityTasks.map(buildTaskItemMarkup).join('')}
          </ul>
        </article>

        <article class="dashboard-panel">
          <div class="panel-header">
            <h3>Proximos registros</h3>
            <span>${state.upcomingEvents.length}</span>
          </div>
          <ol class="event-list">
            ${state.upcomingEvents.map(buildEventItemMarkup).join('')}
          </ol>
        </article>
      </section>

      <section class="work-summary-strip" aria-label="Tipos de registros del dia">
        ${state.categorySummary.map((item) => `
          <article>
            <strong>${item.count}</strong>
            <span>${escapeHtml(item.label)}</span>
          </article>
        `).join('')}
      </section>

      <section class="dashboard-actions" aria-label="Acciones del Dashboard">
        <button class="primary-action" type="button" data-organize-day>
          Organiza mi dia
        </button>
        <p data-dashboard-feedback role="status"></p>
      </section>
    </article>
  `;
}

function buildTaskItemMarkup(task) {
  return `
    <li>
      <span class="item-indicator" aria-hidden="true"></span>
      <div>
        <strong>${escapeHtml(task.label)}</strong>
        <small>${escapeHtml(task.meta)}</small>
      </div>
    </li>
  `;
}

function buildCategorySummary(events) {
  return WORK_CATEGORIES.slice(0, 5).map((category) => ({
    label: category.label,
    count: events.filter((event) => event.categoryId === category.id).length
  }));
}

function bindQuickCapture(rootElement, storage) {
  const form = rootElement.querySelector('[data-quick-capture-form]');
  const feedback = rootElement.querySelector('[data-quick-capture-feedback]');

  if (!form || !feedback) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const date = String(formData.get('date') || getTodayIsoDate());
    const categoryId = String(formData.get('categoryId') || 'pendiente');
    const agendaState = storage.get(AGENDA_STORAGE_KEY) || {
      selectedDate: date,
      visibleMonth: date.slice(0, 7),
      editingEventId: null,
      categories: [],
      events: []
    };
    const newEvent = {
      id: createEventId(),
      title: String(formData.get('title') || '').trim(),
      date,
      time: String(formData.get('time') || ''),
      categoryId,
      priority: categoryId === 'asunto' ? 'alta' : 'normal',
      status: 'pendiente',
      reminderMinutes: 60,
      location: '',
      people: '',
      preparation: '',
      followUp: '',
      notes: String(formData.get('notes') || '').trim()
    };

    if (!newEvent.title) {
      return;
    }

    const nextAgendaState = {
      ...agendaState,
      selectedDate: date,
      visibleMonth: date.slice(0, 7),
      events: [...(agendaState.events || []), newEvent]
    };

    storage.set(AGENDA_STORAGE_KEY, nextAgendaState);
    window.dispatchEvent(new CustomEvent('lumen:agenda-external-update'));

    const updatedFeedback = rootElement.querySelector('[data-quick-capture-feedback]');

    if (updatedFeedback) {
      updatedFeedback.textContent = 'Guardado en Agenda.';
    }
  });
}

function buildMemoryTasks(todayEvents, fallbackTasks) {
  const memoryTasks = todayEvents
    .flatMap((event) => [
      event.preparation ? {
        id: `${event.id}-prep`,
        label: `Preparar: ${event.preparation}`,
        meta: event.title
      } : null,
      event.followUp ? {
        id: `${event.id}-follow`,
        label: `Seguimiento: ${event.followUp}`,
        meta: event.title
      } : null
    ])
    .filter(Boolean)
    .slice(0, 3);

  return memoryTasks.length ? memoryTasks : fallbackTasks;
}

function createEventId() {
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildEventItemMarkup(event) {
  return `
    <li>
      <time>${escapeHtml(event.time)}</time>
      <span>${escapeHtml(event.title)}</span>
    </li>
  `;
}

function updateDateTime(rootElement) {
  const now = new Date();
  const dateElement = rootElement.querySelector('[data-dashboard-date]');
  const timeElement = rootElement.querySelector('[data-dashboard-time]');

  if (dateElement) {
    dateElement.textContent = capitalize(DATE_FORMATTER.format(now));
  }

  if (timeElement) {
    timeElement.textContent = TIME_FORMATTER.format(now);
  }
}

function bindDashboardActions(rootElement, storage, state) {
  const organizeButton = rootElement.querySelector('[data-organize-day]');
  const feedbackElement = rootElement.querySelector('[data-dashboard-feedback]');

  if (!organizeButton || !feedbackElement) {
    return;
  }

  organizeButton.addEventListener('click', () => {
    const updatedState = {
      ...state,
      lastOrganizedAt: new Date().toISOString()
    };

    storage.set(DASHBOARD_STORAGE_KEY, updatedState);
    feedbackElement.textContent = 'Dia marcado para organizar. Agrega pendientes, notas, reuniones o eventos en Agenda.';
  });
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return 'Buenos dias';
  }

  if (hour < 19) {
    return 'Buenas tardes';
  }

  return 'Buenas noches';
}

function getTodayIsoDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function buildEventDate(event) {
  const eventTime = event.time || '09:00';
  const [year, month, day] = event.date.split('-').map(Number);
  const [hour, minute] = eventTime.split(':').map(Number);
  return new Date(year, month - 1, day, hour || 0, minute || 0);
}

function capitalize(value) {
  if (!value) {
    return '';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export { createDashboardModule };
