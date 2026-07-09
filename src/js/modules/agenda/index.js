/* Modulo Agenda de Lumen Planner.
   Administra eventos locales con calendario mensual y categorias por color. */

const AGENDA_STORAGE_KEY = 'agenda';

const DEFAULT_CATEGORIES = [
  {
    id: 'pendiente',
    label: 'Pendiente',
    color: '#1f5eff'
  },
  {
    id: 'nota',
    label: 'Nota',
    color: '#667085'
  },
  {
    id: 'asunto',
    label: 'Asunto importante',
    color: '#d92d20'
  },
  {
    id: 'reunion',
    label: 'Reunion',
    color: '#f79009'
  },
  {
    id: 'evento',
    label: 'Evento',
    color: '#17b26a'
  },
  {
    id: 'personal',
    label: 'Personal',
    color: '#7a5af8'
  }
];

const DEFAULT_AGENDA_STATE = {
  selectedDate: getDateInputValue(new Date()),
  visibleMonth: getMonthKey(new Date()),
  editingEventId: null,
  categories: DEFAULT_CATEGORIES,
  events: []
};

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  month: 'long',
  year: 'numeric'
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short'
});

function createAgendaModule() {
  let root = null;
  let storage = null;
  let state = null;

  function mount(rootElement, appContext) {
    root = rootElement;
    storage = appContext.storage;
    state = loadAgendaState(storage);
    render();
    bindPlannerMonthTabs();
    notifyAgendaChanged();
  }

  function render() {
    root.innerHTML = buildAgendaMarkup(state);
    bindAgendaEvents();
  }

  function bindAgendaEvents() {
    root.querySelector('[data-agenda-prev]').addEventListener('click', () => {
      state.visibleMonth = shiftMonth(state.visibleMonth, -1);
      persistAndRender();
    });

    root.querySelector('[data-agenda-next]').addEventListener('click', () => {
      state.visibleMonth = shiftMonth(state.visibleMonth, 1);
      persistAndRender();
    });

    root.querySelector('[data-agenda-today]').addEventListener('click', () => {
      const today = new Date();
      state.selectedDate = getDateInputValue(today);
      state.visibleMonth = getMonthKey(today);
      state.editingEventId = null;
      persistAndRender();
    });

    root.querySelector('[data-agenda-form]').addEventListener('submit', handleFormSubmit);

    root.querySelector('[data-agenda-cancel-edit]').addEventListener('click', () => {
      state.editingEventId = null;
      persistAndRender();
    });

    root.querySelectorAll('[data-agenda-day]').forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedDate = button.dataset.agendaDay;
        state.visibleMonth = getMonthKey(parseDateValue(state.selectedDate));
        state.editingEventId = null;
        persistAndRender();
      });
    });

    root.querySelectorAll('[data-agenda-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        state.editingEventId = button.dataset.agendaEdit;
        const event = findEventById(state.editingEventId);

        if (event) {
          state.selectedDate = event.date;
          state.visibleMonth = getMonthKey(parseDateValue(event.date));
        }

        persistAndRender();
      });
    });

    root.querySelectorAll('[data-agenda-delete]').forEach((button) => {
      button.addEventListener('click', () => {
        deleteEvent(button.dataset.agendaDelete);
      });
    });
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const eventData = {
      id: state.editingEventId || createEventId(),
      title: String(formData.get('title')).trim(),
      date: String(formData.get('date')),
      time: String(formData.get('time') || ''),
      categoryId: String(formData.get('categoryId')),
      priority: String(formData.get('priority') || 'normal'),
      status: String(formData.get('status') || 'pendiente'),
      reminderMinutes: Number(formData.get('reminderMinutes') || 60),
      location: String(formData.get('location') || '').trim(),
      people: String(formData.get('people') || '').trim(),
      preparation: String(formData.get('preparation') || '').trim(),
      followUp: String(formData.get('followUp') || '').trim(),
      notes: String(formData.get('notes') || '').trim()
    };

    if (!eventData.title || !eventData.date) {
      return;
    }

    if (state.editingEventId) {
      state.events = state.events.map((item) => (
        item.id === state.editingEventId ? eventData : item
      ));
    } else {
      state.events = [...state.events, eventData];
    }

    state.selectedDate = eventData.date;
    state.visibleMonth = getMonthKey(parseDateValue(eventData.date));
    state.editingEventId = null;
    persistAndRender();
  }

  function deleteEvent(eventId) {
    state.events = state.events.filter((event) => event.id !== eventId);

    if (state.editingEventId === eventId) {
      state.editingEventId = null;
    }

    persistAndRender();
  }

  function persistAndRender() {
    saveAgendaState(storage, state);
    render();
    notifyAgendaChanged();
  }

  function findEventById(eventId) {
    return state.events.find((event) => event.id === eventId);
  }

  function notifyAgendaChanged() {
    window.dispatchEvent(new CustomEvent('lumen:agenda-updated', {
      detail: {
        events: state.events,
        categories: state.categories
      }
    }));
  }

  function bindPlannerMonthTabs() {
    window.addEventListener('lumen:agenda-jump-month', (event) => {
      const month = Number(event.detail.month);
      const year = Number(event.detail.year);
      const targetDate = new Date(year, month, 1);

      state.selectedDate = getDateInputValue(targetDate);
      state.visibleMonth = getMonthKey(targetDate);
      state.editingEventId = null;
      persistAndRender();
    });
  }

  return {
    name: 'agenda',
    mount
  };
}

function loadAgendaState(storage) {
  const storedState = storage.get(AGENDA_STORAGE_KEY);

  if (!storedState) {
    storage.set(AGENDA_STORAGE_KEY, DEFAULT_AGENDA_STATE);
    return structuredCloneSafe(DEFAULT_AGENDA_STATE);
  }

  return {
    ...DEFAULT_AGENDA_STATE,
    ...storedState,
    categories: storedState.categories || DEFAULT_CATEGORIES,
    events: storedState.events || []
  };
}

function saveAgendaState(storage, agendaState) {
  storage.set(AGENDA_STORAGE_KEY, agendaState);
}

function buildAgendaMarkup(agendaState) {
  const currentMonthDate = parseMonthKey(agendaState.visibleMonth);
  const editingEvent = agendaState.editingEventId
    ? agendaState.events.find((event) => event.id === agendaState.editingEventId)
    : null;
  const selectedEvents = getEventsForDate(agendaState.events, agendaState.selectedDate);

  return `
    <article class="agenda" aria-labelledby="agenda-title">
      <header class="agenda-header">
        <div>
          <p class="eyebrow">Agenda de trabajo</p>
          <h2 id="agenda-title">Pendientes, notas, asuntos y reuniones</h2>
          <p>Registra lo que no debes olvidar con fecha, hora, personas, seguimiento y notas.</p>
        </div>
        <div class="agenda-header-actions">
          <div class="category-legend" aria-label="Categorias disponibles">
            ${buildCategoryLegendMarkup(agendaState.categories)}
          </div>
          <button class="secondary-action" type="button" data-agenda-today>Hoy</button>
        </div>
      </header>

      <section class="agenda-layout">
        <div class="calendar-card" aria-label="Calendario mensual">
          <div class="calendar-toolbar">
            <button class="icon-button" type="button" data-agenda-prev aria-label="Mes anterior">&lsaquo;</button>
            <h3>${capitalize(MONTH_FORMATTER.format(currentMonthDate))}</h3>
            <button class="icon-button" type="button" data-agenda-next aria-label="Mes siguiente">&rsaquo;</button>
          </div>
          <div class="calendar-weekdays">
            ${buildWeekdayMarkup()}
          </div>
          <div class="calendar-grid">
            ${buildCalendarDaysMarkup(agendaState, currentMonthDate)}
          </div>
        </div>

        <aside class="agenda-panel" aria-label="Formulario de registros de agenda">
          <form class="event-form" data-agenda-form>
            <div class="panel-header">
              <h3>${editingEvent ? 'Editar registro' : 'Nuevo registro'}</h3>
              <span>${selectedEvents.length}</span>
            </div>
            ${buildEventFormFields(agendaState, editingEvent)}
            <div class="form-actions">
              <button class="primary-action" type="submit">
                ${editingEvent ? 'Guardar cambios' : 'Guardar registro'}
              </button>
              <button class="secondary-action" type="button" data-agenda-cancel-edit>
                Cancelar
              </button>
            </div>
          </form>

          <section class="selected-events" aria-label="Registros del dia seleccionado">
            <h3>Registros del dia</h3>
            ${buildSelectedEventsMarkup(selectedEvents, agendaState.categories)}
          </section>
        </aside>
      </section>
    </article>
  `;
}

function buildEventFormFields(agendaState, editingEvent) {
  const eventDate = editingEvent?.date || agendaState.selectedDate;
  const eventTitle = editingEvent?.title || '';
  const eventTime = editingEvent?.time || '';
  const eventNotes = editingEvent?.notes || '';
  const eventCategory = editingEvent?.categoryId || agendaState.categories[0].id;
  const eventPriority = editingEvent?.priority || 'normal';
  const eventStatus = editingEvent?.status || 'pendiente';
  const eventReminder = editingEvent?.reminderMinutes || 60;
  const eventLocation = editingEvent?.location || '';
  const eventPeople = editingEvent?.people || '';
  const eventPreparation = editingEvent?.preparation || '';
  const eventFollowUp = editingEvent?.followUp || '';

  return `
    <label>
      <span>Que necesitas anotar</span>
      <input name="title" type="text" value="${escapeHtml(eventTitle)}" placeholder="Pendiente, nota, asunto, reunion o evento" required>
    </label>
    <label>
      <span>Fecha</span>
      <input name="date" type="date" value="${escapeHtml(eventDate)}" required>
    </label>
    <label>
      <span>Hora</span>
      <input name="time" type="time" value="${escapeHtml(eventTime)}">
    </label>
    <label>
      <span>Categoria</span>
      <select name="categoryId">
        ${agendaState.categories.map((category) => `
          <option value="${escapeHtml(category.id)}" ${category.id === eventCategory ? 'selected' : ''}>
            ${escapeHtml(category.label)}
          </option>
        `).join('')}
      </select>
    </label>
    <div class="event-form-grid">
      <label>
        <span>Prioridad</span>
        <select name="priority">
          <option value="normal" ${eventPriority === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="alta" ${eventPriority === 'alta' ? 'selected' : ''}>Alta</option>
          <option value="critica" ${eventPriority === 'critica' ? 'selected' : ''}>Critica</option>
        </select>
      </label>
      <label>
        <span>Estado</span>
        <select name="status">
          <option value="pendiente" ${eventStatus === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="confirmado" ${eventStatus === 'confirmado' ? 'selected' : ''}>Confirmado</option>
          <option value="realizado" ${eventStatus === 'realizado' ? 'selected' : ''}>Realizado</option>
          <option value="reprogramar" ${eventStatus === 'reprogramar' ? 'selected' : ''}>Reprogramar</option>
        </select>
      </label>
    </div>
    <label>
      <span>Recordarme antes</span>
      <select name="reminderMinutes">
        <option value="15" ${eventReminder === 15 ? 'selected' : ''}>15 minutos</option>
        <option value="30" ${eventReminder === 30 ? 'selected' : ''}>30 minutos</option>
        <option value="60" ${eventReminder === 60 ? 'selected' : ''}>1 hora</option>
        <option value="120" ${eventReminder === 120 ? 'selected' : ''}>2 horas</option>
        <option value="1440" ${eventReminder === 1440 ? 'selected' : ''}>1 dia</option>
      </select>
    </label>
    <label>
      <span>Lugar / medio</span>
      <input name="location" type="text" value="${escapeHtml(eventLocation)}" placeholder="Oficina, llamada, mensaje, enlace o direccion">
    </label>
    <label>
      <span>Personas relacionadas</span>
      <input name="people" type="text" value="${escapeHtml(eventPeople)}" placeholder="Nombre, area, contacto o equipo">
    </label>
    <label>
      <span>Antes / preparar</span>
      <textarea name="preparation" rows="3" placeholder="Documentos, datos, mensajes o detalles que necesito tener listos">${escapeHtml(eventPreparation)}</textarea>
    </label>
    <label>
      <span>Seguimiento</span>
      <textarea name="followUp" rows="3" placeholder="A quien avisar, que enviar, que confirmar o que revisar">${escapeHtml(eventFollowUp)}</textarea>
    </label>
    <label>
      <span>Notas</span>
      <textarea name="notes" rows="4" placeholder="Detalles importantes, acuerdos, contexto, decisiones o recordatorios">${escapeHtml(eventNotes)}</textarea>
    </label>
  `;
}

function buildCategoryLegendMarkup(categories) {
  return categories.map((category) => `
    <span>
      <i style="background:${escapeHtml(category.color)}"></i>
      ${escapeHtml(category.label)}
    </span>
  `).join('');
}

function buildWeekdayMarkup() {
  const baseSunday = new Date(2026, 0, 4);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(baseSunday);
    day.setDate(baseSunday.getDate() + index);
    return `<span>${capitalize(WEEKDAY_FORMATTER.format(day))}</span>`;
  }).join('');
}

function buildCalendarDaysMarkup(agendaState, monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const calendarStart = new Date(firstDay);
  calendarStart.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(calendarStart);
    day.setDate(calendarStart.getDate() + index);

    const dateValue = getDateInputValue(day);
    const isCurrentMonth = day.getMonth() === month;
    const isSelected = dateValue === agendaState.selectedDate;
    const dayEvents = getEventsForDate(agendaState.events, dateValue);

    return `
      <button
        class="calendar-day ${isCurrentMonth ? '' : 'is-muted'} ${isSelected ? 'is-selected' : ''}"
        type="button"
        data-agenda-day="${dateValue}"
        aria-label="${dateValue}"
      >
        <span>${day.getDate()}</span>
        <div class="event-dots" aria-hidden="true">
          ${dayEvents.slice(0, 4).map((event) => buildEventDot(event, agendaState.categories)).join('')}
        </div>
      </button>
    `;
  }).join('');
}

function buildEventDot(event, categories) {
  const category = getCategoryById(categories, event.categoryId);
  return `<i style="background:${escapeHtml(category.color)}"></i>`;
}

function buildSelectedEventsMarkup(events, categories) {
  if (!events.length) {
    return '<p class="empty-agenda">No hay registros para esta fecha.</p>';
  }

  return `
    <ul class="agenda-event-list">
      ${events.map((event) => {
        const category = getCategoryById(categories, event.categoryId);

        return `
          <li style="border-left-color:${escapeHtml(category.color)}">
            <div>
              <strong>${escapeHtml(event.title)}</strong>
              <small>${escapeHtml(event.time || 'Sin hora')} - ${escapeHtml(category.label)} - ${escapeHtml(getPriorityLabel(event.priority))} - ${escapeHtml(getStatusLabel(event.status))}</small>
              ${event.location ? `<p><b>Lugar:</b> ${escapeHtml(event.location)}</p>` : ''}
              ${event.people ? `<p><b>Personas:</b> ${escapeHtml(event.people)}</p>` : ''}
              ${event.preparation ? `<p><b>Preparar:</b> ${escapeHtml(event.preparation)}</p>` : ''}
              ${event.followUp ? `<p><b>Seguimiento:</b> ${escapeHtml(event.followUp)}</p>` : ''}
              ${event.notes ? `<p>${escapeHtml(event.notes)}</p>` : ''}
            </div>
            <div class="event-actions">
              <button type="button" data-agenda-edit="${escapeHtml(event.id)}">Editar</button>
              <button type="button" data-agenda-delete="${escapeHtml(event.id)}">Eliminar</button>
            </div>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

function getPriorityLabel(priority) {
  const labels = {
    normal: 'Normal',
    alta: 'Alta',
    critica: 'Critica'
  };

  return labels[priority] || labels.normal;
}

function getStatusLabel(status) {
  const labels = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    realizado: 'Realizado',
    reprogramar: 'Reprogramar'
  };

  return labels[status] || labels.pendiente;
}

function getEventsForDate(events, dateValue) {
  return events
    .filter((event) => event.date === dateValue)
    .sort((first, second) => first.time.localeCompare(second.time));
}

function getCategoryById(categories, categoryId) {
  return categories.find((category) => category.id === categoryId) || categories[0];
}

function shiftMonth(monthKey, amount) {
  const monthDate = parseMonthKey(monthKey);
  monthDate.setMonth(monthDate.getMonth() + amount);
  return getMonthKey(monthDate);
}

function parseMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function getMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseDateValue(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createEventId() {
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
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

export { createAgendaModule };
