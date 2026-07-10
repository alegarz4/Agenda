/* Respaldo local de Lumen Planner.
   Solo se activa cuando el navegador no ejecuto los modulos ES6, normalmente al abrir index.html con doble clic. */

(function () {
  const STORAGE_PREFIX = 'lumen-planner';
  const DASHBOARD_KEY = `${STORAGE_PREFIX}:dashboard`;
  const AGENDA_KEY = `${STORAGE_PREFIX}:agenda`;
  const ALERTS_KEY = `${STORAGE_PREFIX}:alerts`;

  const categories = [
    { id: 'pendiente', label: 'Pendiente', color: '#1f5eff' },
    { id: 'nota', label: 'Nota', color: '#667085' },
    { id: 'asunto', label: 'Asunto importante', color: '#d92d20' },
    { id: 'reunion', label: 'Reunion', color: '#f79009' },
    { id: 'evento', label: 'Evento', color: '#17b26a' },
    { id: 'personal', label: 'Personal', color: '#7a5af8' }
  ];

  const defaultDashboard = {
    userName: 'Alejandra',
    summary: {
      title: 'Resumen de trabajo',
      completed: 0,
      pending: 3,
      nextBlock: 'Revisar agenda'
    },
    priorityTasks: [
      { id: 'task-pending', label: 'Revisar pendientes del dia', meta: 'Prioridad alta' },
      { id: 'task-meetings', label: 'Confirmar reuniones y llamadas', meta: 'Antes de iniciar' },
      { id: 'task-important', label: 'Marcar asuntos importantes', meta: 'Seguimiento' }
    ],
    upcomingEvents: [
      { id: 'event-review', time: '09:00', title: 'Revision de agenda' },
      { id: 'event-follow', time: '11:30', title: 'Seguimiento de pendientes' },
      { id: 'event-notes', time: '14:00', title: 'Captura de notas importantes' }
    ]
  };

  const monthFormatter = new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric'
  });

  const weekdayFormatter = new Intl.DateTimeFormat('es-MX', {
    weekday: 'short'
  });

  const dateFormatter = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const timeFormatter = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  document.addEventListener('DOMContentLoaded', () => {
    window.setTimeout(() => {
      const dashboardRoot = document.querySelector('[data-dashboard-root]');
      const agendaRoot = document.querySelector('[data-agenda-root]');
      const alertsRoot = document.querySelector('[data-alerts-root]');

      if (!dashboardRoot || !agendaRoot || !alertsRoot || dashboardRoot.innerHTML.trim() || agendaRoot.innerHTML.trim()) {
        return;
      }

      mountDashboard(dashboardRoot);
      mountAgenda(agendaRoot);
      mountAlerts(alertsRoot);
    }, 350);
  });

  function mountDashboard(root) {
    const state = readState(DASHBOARD_KEY, defaultDashboard);

    root.innerHTML = `
      <article class="dashboard" aria-labelledby="dashboard-title">
        <section class="dashboard-hero">
          <div class="dashboard-hero-copy">
            <p class="eyebrow">Dashboard</p>
            <h2 id="dashboard-title">${getGreeting()}, ${escapeHtml(state.userName)}</h2>
            <p class="dashboard-subtitle">Este es tu panorama operativo para mantener el dia ordenado.</p>
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
              <div><strong>${state.summary.pending}</strong><span>Pendientes</span></div>
              <div><strong>${state.summary.completed}</strong><span>Completadas</span></div>
            </div>
            <p class="summary-note">Siguiente bloque: ${escapeHtml(state.summary.nextBlock)}</p>
          </article>
          <article class="dashboard-panel">
            <div class="panel-header"><h3>Tareas prioritarias</h3><span>${state.priorityTasks.length}</span></div>
            <ul class="priority-list">
              ${state.priorityTasks.map((task) => `
                <li>
                  <span class="item-indicator" aria-hidden="true"></span>
                  <div><strong>${escapeHtml(task.label)}</strong><small>${escapeHtml(task.meta)}</small></div>
                </li>
              `).join('')}
            </ul>
          </article>
          <article class="dashboard-panel">
            <div class="panel-header"><h3>Proximos eventos</h3><span>${state.upcomingEvents.length}</span></div>
            <ol class="event-list">
              ${state.upcomingEvents.map((event) => `
                <li><time>${escapeHtml(event.time)}</time><span>${escapeHtml(event.title)}</span></li>
              `).join('')}
            </ol>
          </article>
        </section>
        <section class="dashboard-actions" aria-label="Acciones del Dashboard">
          <button class="primary-action" type="button" data-organize-day>Organiza mi dia</button>
          <button class="secondary-action" type="button" data-download-backup>Descargar respaldo</button>
          <button class="secondary-action" type="button" data-restore-backup>Restaurar respaldo</button>
          <input data-restore-backup-file type="file" accept="application/json,.json" hidden>
          <p data-dashboard-feedback role="status"></p>
        </section>
      </article>
    `;

    updateClock(root);
    window.setInterval(() => updateClock(root), 1000);

    root.querySelector('[data-organize-day]').addEventListener('click', () => {
      writeState(DASHBOARD_KEY, { ...state, lastOrganizedAt: new Date().toISOString() });
      root.querySelector('[data-dashboard-feedback]').textContent = 'Dia marcado para organizar. Agrega pendientes, notas, reuniones o eventos en Agenda.';
    });

    bindFallbackBackupActions(root);
  }

  function bindFallbackBackupActions(root) {
    const downloadButton = root.querySelector('[data-download-backup]');
    const restoreButton = root.querySelector('[data-restore-backup]');
    const restoreInput = root.querySelector('[data-restore-backup-file]');
    const feedbackElement = root.querySelector('[data-dashboard-feedback]');

    if (downloadButton) {
      downloadButton.addEventListener('click', () => {
        const backup = buildFallbackBackupPayload();
        const blob = new Blob([JSON.stringify(backup, null, 2)], {
          type: 'application/json'
        });
        const link = document.createElement('a');

        link.href = URL.createObjectURL(blob);
        link.download = `lumen-planner-respaldo-${dateInputValue(new Date())}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
        feedbackElement.textContent = 'Respaldo descargado. Guarda ese archivo en tu nube o correo.';
      });
    }

    if (restoreButton && restoreInput) {
      restoreButton.addEventListener('click', () => {
        restoreInput.click();
      });

      restoreInput.addEventListener('change', () => {
        const file = restoreInput.files?.[0];

        if (!file) {
          return;
        }

        const reader = new FileReader();

        reader.addEventListener('load', () => {
          try {
            restoreFallbackBackupPayload(String(reader.result || ''));
            feedbackElement.textContent = 'Respaldo restaurado. Actualizando la agenda...';
            window.setTimeout(() => window.location.reload(), 600);
          } catch (error) {
            feedbackElement.textContent = 'No se pudo restaurar el respaldo. Revisa que sea el archivo JSON correcto.';
          }
        });

        reader.readAsText(file);
        restoreInput.value = '';
      });
    }
  }

  function mountAgenda(root) {
    let state = readState(AGENDA_KEY, {
      selectedDate: dateInputValue(new Date()),
      visibleMonth: monthKey(new Date()),
      editingEventId: null,
      categories,
      events: []
    });

    renderAgenda();

    window.addEventListener('lumen:agenda-jump-month', (event) => {
      const targetDate = new Date(Number(event.detail.year), Number(event.detail.month), 1);

      state.selectedDate = dateInputValue(targetDate);
      state.visibleMonth = monthKey(targetDate);
      state.editingEventId = null;
      persistAgenda();
    });

    function renderAgenda() {
      const monthDate = parseMonthKey(state.visibleMonth);
      const selectedEvents = eventsForDate(state.events, state.selectedDate);
      const editingEvent = state.editingEventId
        ? state.events.find((event) => event.id === state.editingEventId)
        : null;

      root.innerHTML = `
        <article class="agenda" aria-labelledby="agenda-title">
          <header class="agenda-header">
            <div>
              <p class="eyebrow">Agenda</p>
              <h2 id="agenda-title">Calendario mensual</h2>
              <p>Organiza eventos escolares con categorias por color.</p>
            </div>
            <div class="agenda-header-actions">
              <div class="category-legend" aria-label="Categorias disponibles">
                ${state.categories.map((category) => `
                  <span><i style="background:${escapeHtml(category.color)}"></i>${escapeHtml(category.label)}</span>
                `).join('')}
              </div>
              <button class="secondary-action" type="button" data-agenda-today>Hoy</button>
            </div>
          </header>
          <section class="agenda-layout">
            <div class="calendar-card" aria-label="Calendario mensual">
              <div class="calendar-toolbar">
                <button class="icon-button" type="button" data-agenda-prev aria-label="Mes anterior">&lsaquo;</button>
                <h3>${capitalize(monthFormatter.format(monthDate))}</h3>
                <button class="icon-button" type="button" data-agenda-next aria-label="Mes siguiente">&rsaquo;</button>
              </div>
              <div class="calendar-weekdays">${weekdayMarkup()}</div>
              <div class="calendar-grid">${calendarMarkup(monthDate)}</div>
            </div>
            <aside class="agenda-panel" aria-label="Formulario de eventos">
              <form class="event-form" data-agenda-form>
                <div class="panel-header"><h3>${editingEvent ? 'Editar evento' : 'Crear evento'}</h3><span>${selectedEvents.length}</span></div>
                ${formMarkup(editingEvent)}
                <div class="form-actions">
                  <button class="primary-action" type="submit">${editingEvent ? 'Guardar cambios' : 'Crear evento'}</button>
                  <button class="secondary-action" type="button" data-agenda-cancel-edit>Cancelar</button>
                </div>
              </form>
              <section class="selected-events" aria-label="Eventos del dia seleccionado">
                <h3>Eventos del dia</h3>
                ${selectedEventsMarkup(selectedEvents)}
              </section>
            </aside>
          </section>
        </article>
      `;

      bindAgenda();
    }

    function bindAgenda() {
      root.querySelector('[data-agenda-prev]').addEventListener('click', () => {
        state.visibleMonth = shiftMonth(state.visibleMonth, -1);
        persistAgenda();
      });

      root.querySelector('[data-agenda-next]').addEventListener('click', () => {
        state.visibleMonth = shiftMonth(state.visibleMonth, 1);
        persistAgenda();
      });

      root.querySelector('[data-agenda-today]').addEventListener('click', () => {
        const today = new Date();
        state.selectedDate = dateInputValue(today);
        state.visibleMonth = monthKey(today);
        state.editingEventId = null;
        persistAgenda();
      });

      root.querySelector('[data-agenda-cancel-edit]').addEventListener('click', () => {
        state.editingEventId = null;
        persistAgenda();
      });

      root.querySelector('[data-agenda-form]').addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);
        const eventData = {
          id: state.editingEventId || `event-${Date.now()}-${Math.random().toString(16).slice(2)}`,
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

        state.events = state.editingEventId
          ? state.events.map((item) => item.id === state.editingEventId ? eventData : item)
          : [...state.events, eventData];
        state.selectedDate = eventData.date;
        state.visibleMonth = monthKey(parseDateValue(eventData.date));
        state.editingEventId = null;
        persistAgenda();
      });

      root.querySelectorAll('[data-agenda-day]').forEach((button) => {
        button.addEventListener('click', () => {
          state.selectedDate = button.dataset.agendaDay;
          state.visibleMonth = monthKey(parseDateValue(state.selectedDate));
          state.editingEventId = null;
          persistAgenda();
        });
      });

      root.querySelectorAll('[data-agenda-edit]').forEach((button) => {
        button.addEventListener('click', () => {
          const eventToEdit = state.events.find((event) => event.id === button.dataset.agendaEdit);

          if (eventToEdit) {
            state.editingEventId = eventToEdit.id;
            state.selectedDate = eventToEdit.date;
            state.visibleMonth = monthKey(parseDateValue(eventToEdit.date));
            persistAgenda();
          }
        });
      });

      root.querySelectorAll('[data-agenda-delete]').forEach((button) => {
        button.addEventListener('click', () => {
          state.events = state.events.filter((event) => event.id !== button.dataset.agendaDelete);
          state.editingEventId = null;
          persistAgenda();
        });
      });
    }

    function persistAgenda() {
      writeState(AGENDA_KEY, state);
      renderAgenda();
      window.dispatchEvent(new CustomEvent('lumen:agenda-updated'));
    }

    function formMarkup(editingEvent) {
      const eventDate = editingEvent?.date || state.selectedDate;
      const eventTitle = editingEvent?.title || '';
      const eventTime = editingEvent?.time || '';
      const eventNotes = editingEvent?.notes || '';
      const eventCategory = editingEvent?.categoryId || state.categories[0].id;
      const eventPriority = editingEvent?.priority || 'normal';
      const eventStatus = editingEvent?.status || 'pendiente';
      const eventReminder = editingEvent?.reminderMinutes || 60;
      const eventLocation = editingEvent?.location || '';
      const eventPeople = editingEvent?.people || '';
      const eventPreparation = editingEvent?.preparation || '';
      const eventFollowUp = editingEvent?.followUp || '';

      return `
        <label><span>Titulo</span><input name="title" type="text" value="${escapeHtml(eventTitle)}" placeholder="Nombre del evento" required></label>
        <label><span>Fecha</span><input name="date" type="date" value="${escapeHtml(eventDate)}" required></label>
        <label><span>Hora</span><input name="time" type="time" value="${escapeHtml(eventTime)}"></label>
        <label>
          <span>Categoria</span>
          <select name="categoryId">
            ${state.categories.map((category) => `
              <option value="${escapeHtml(category.id)}" ${category.id === eventCategory ? 'selected' : ''}>${escapeHtml(category.label)}</option>
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
        <label><span>Lugar / medio</span><input name="location" type="text" value="${escapeHtml(eventLocation)}" placeholder="Direccion, aula, Meet, llamada, oficina"></label>
        <label><span>Personas involucradas</span><input name="people" type="text" value="${escapeHtml(eventPeople)}" placeholder="Nombre, equipo, area o contacto"></label>
        <label><span>Preparar antes</span><textarea name="preparation" rows="3" placeholder="Documentos, materiales, datos o acuerdos que debo llevar">${escapeHtml(eventPreparation)}</textarea></label>
        <label><span>Seguimiento despues</span><textarea name="followUp" rows="3" placeholder="A quien avisar, que enviar, que confirmar o que revisar">${escapeHtml(eventFollowUp)}</textarea></label>
        <label><span>Notas</span><textarea name="notes" rows="4" placeholder="Detalles importantes, acuerdos, contexto o decisiones">${escapeHtml(eventNotes)}</textarea></label>
      `;
    }

    function calendarMarkup(monthDate) {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const calendarStart = new Date(firstDay);
      calendarStart.setDate(firstDay.getDate() - firstDay.getDay());

      return Array.from({ length: 42 }, (_, index) => {
        const day = new Date(calendarStart);
        day.setDate(calendarStart.getDate() + index);

        const value = dateInputValue(day);
        const dayEvents = eventsForDate(state.events, value);
        const isCurrentMonth = day.getMonth() === month;
        const isSelected = value === state.selectedDate;

        return `
          <button class="calendar-day ${isCurrentMonth ? '' : 'is-muted'} ${isSelected ? 'is-selected' : ''}" type="button" data-agenda-day="${value}" aria-label="${value}">
            <span>${day.getDate()}</span>
            <div class="event-dots" aria-hidden="true">
              ${dayEvents.slice(0, 4).map((event) => {
                const category = categoryById(event.categoryId);
                return `<i style="background:${escapeHtml(category.color)}"></i>`;
              }).join('')}
            </div>
          </button>
        `;
      }).join('');
    }

    function selectedEventsMarkup(events) {
      if (!events.length) {
        return '<p class="empty-agenda">No hay eventos para esta fecha.</p>';
      }

      return `
        <ul class="agenda-event-list">
          ${events.map((event) => {
            const category = categoryById(event.categoryId);

            return `
              <li style="border-left-color:${escapeHtml(category.color)}">
                <div>
                  <strong>${escapeHtml(event.title)}</strong>
                  <small>${escapeHtml(event.time || 'Sin hora')} - ${escapeHtml(category.label)} - ${escapeHtml(priorityLabel(event.priority))} - ${escapeHtml(statusLabel(event.status))}</small>
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

    function categoryById(categoryId) {
      return state.categories.find((category) => category.id === categoryId) || state.categories[0];
    }
  }

  function mountAlerts(root) {
    let state = readState(ALERTS_KEY, {
      permission: notificationPermission(),
      windowMinutes: 60,
      dismissedEventIds: []
    });

    renderAlerts();
    window.addEventListener('lumen:agenda-updated', renderAlerts);
    window.setInterval(checkDueAlerts, 30000);

    function renderAlerts() {
      const agendaState = readState(AGENDA_KEY, {
        selectedDate: dateInputValue(new Date()),
        visibleMonth: monthKey(new Date()),
        editingEventId: null,
        categories,
        events: []
      });
      const upcomingAlerts = upcomingEvents(agendaState.events, state.windowMinutes);

      root.innerHTML = `
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
                  ${alertWindowOptions(state.windowMinutes)}
                </select>
              </label>
              <button class="secondary-action" type="button" data-alerts-enable>Activar alertas</button>
              <button class="secondary-action" type="button" data-alerts-test>Probar alerta</button>
            </div>
          </header>
          <section class="alerts-panel" aria-label="Eventos con alerta proxima">
            <div class="panel-header"><h3>Proximas alertas</h3><span>${upcomingAlerts.length}</span></div>
            ${alertsListMarkup(upcomingAlerts)}
            <p class="alerts-feedback" data-alerts-feedback role="status"></p>
          </section>
        </article>
      `;

      bindAlerts();
      checkDueAlerts();
    }

    function bindAlerts() {
      root.querySelector('[data-alerts-window]').addEventListener('change', (event) => {
        state.windowMinutes = Number(event.currentTarget.value);
        persistAlerts();
      });

      root.querySelector('[data-alerts-enable]').addEventListener('click', () => {
        if (!('Notification' in window)) {
          updateAlertFeedback('Este navegador no soporta notificaciones.');
          return;
        }

        Notification.requestPermission().then((permission) => {
          state.permission = permission;
          writeState(ALERTS_KEY, state);

          if (permission === 'granted') {
            notify('Lumen Planner', 'Recibiras alertas de tus eventos proximos.');
          } else {
            updateAlertFeedback('Las notificaciones no fueron activadas.');
          }
        });
      });

      root.querySelector('[data-alerts-test]').addEventListener('click', () => {
        if ('Notification' in window && Notification.permission === 'granted') {
          notify('Lumen Planner', 'Las alertas estan listas para tus eventos de Agenda.');
          updateAlertFeedback('Alerta de prueba enviada.');
          return;
        }

        updateAlertFeedback('Activa las alertas para recibir notificaciones del navegador.');
      });
    }

    function checkDueAlerts() {
      const agendaState = readState(AGENDA_KEY, {
        selectedDate: dateInputValue(new Date()),
        visibleMonth: monthKey(new Date()),
        editingEventId: null,
        categories,
        events: []
      });
      const dueEvents = agendaState.events.filter((event) => {
        const minutesUntil = Math.round((eventDate(event).getTime() - Date.now()) / 60000);
        return minutesUntil >= 0 && minutesUntil <= 1 && !state.dismissedEventIds.includes(event.id);
      });

      dueEvents.forEach((event) => {
        notify('Evento proximo', `${event.title} inicia ${event.time || 'hoy'}.`);
        state.dismissedEventIds = [...state.dismissedEventIds, event.id];
      });

      writeState(ALERTS_KEY, state);
    }

    function persistAlerts() {
      writeState(ALERTS_KEY, state);
      renderAlerts();
    }

    function notify(title, body) {
      if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((registration) => {
              if (registration.active) {
                registration.active.postMessage({
                  type: 'LUMEN_SHOW_NOTIFICATION',
                  title,
                  body,
                  tag: `fallback-${Date.now()}`
                });
                return;
              }

              registration.showNotification(title, {
                body,
                icon: './assets/icons/icon-192.png',
                badge: './assets/icons/icon-192.png',
                tag: `fallback-${Date.now()}`
              });
            })
            .catch(() => {
              new Notification(title, {
                body,
                icon: './assets/icons/icon.svg'
              });
            });
          return;
        }

        new Notification(title, {
          body,
          icon: './assets/icons/icon.svg'
        });
        return;
      }

      updateAlertFeedback(body);
    }

    function updateAlertFeedback(message) {
      const feedbackElement = root.querySelector('[data-alerts-feedback]');

      if (feedbackElement) {
        feedbackElement.textContent = message;
      }
    }
  }

  function readState(key, fallback) {
    const storedValue = window.localStorage.getItem(key);

    if (!storedValue) {
      writeState(key, fallback);
      return clone(fallback);
    }

    try {
      return JSON.parse(storedValue);
    } catch (error) {
      writeState(key, fallback);
      return clone(fallback);
    }
  }

  function writeState(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function buildFallbackBackupPayload() {
    const data = {};
    const prefix = `${STORAGE_PREFIX}:`;

    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(prefix))
      .sort()
      .forEach((key) => {
        data[key] = window.localStorage.getItem(key);
      });

    return {
      app: 'Lumen Planner',
      version: 1,
      exportedAt: new Date().toISOString(),
      data
    };
  }

  function restoreFallbackBackupPayload(rawContent) {
    const payload = JSON.parse(rawContent);
    const prefix = `${STORAGE_PREFIX}:`;

    if (!payload || payload.app !== 'Lumen Planner' || !payload.data || typeof payload.data !== 'object') {
      throw new Error('Invalid backup payload');
    }

    Object.entries(payload.data).forEach(([key, value]) => {
      if (!key.startsWith(prefix) || typeof value !== 'string') {
        return;
      }

      JSON.parse(value);
      window.localStorage.setItem(key, value);
    });
  }

  function updateClock(root) {
    const now = new Date();
    const dateElement = root.querySelector('[data-dashboard-date]');
    const timeElement = root.querySelector('[data-dashboard-time]');

    if (dateElement) {
      dateElement.textContent = capitalize(dateFormatter.format(now));
    }

    if (timeElement) {
      timeElement.textContent = timeFormatter.format(now);
    }
  }

  function weekdayMarkup() {
    const baseSunday = new Date(2026, 0, 4);

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(baseSunday);
      day.setDate(baseSunday.getDate() + index);
      return `<span>${capitalize(weekdayFormatter.format(day))}</span>`;
    }).join('');
  }

  function eventsForDate(events, dateValue) {
    return events
      .filter((event) => event.date === dateValue)
      .sort((first, second) => first.time.localeCompare(second.time));
  }

  function upcomingEvents(events, windowMinutes) {
    return events
      .map((event) => ({
        ...event,
        startsAt: eventDate(event),
        minutesUntil: Math.round((eventDate(event).getTime() - Date.now()) / 60000)
      }))
      .filter((event) => event.startsAt >= new Date() && event.minutesUntil <= windowMinutes)
      .sort((first, second) => first.startsAt - second.startsAt);
  }

  function alertsListMarkup(events) {
    if (!events.length) {
      return '<p class="empty-alerts">No hay eventos proximos dentro del periodo seleccionado.</p>';
    }

    return `
      <ul class="alerts-list">
        ${events.map((event) => `
          <li>
            <div><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(event.date)} ${escapeHtml(event.time || 'Sin hora')}</small></div>
            <span>${event.minutesUntil <= 0 ? 'Ahora' : `En ${event.minutesUntil} min`}</span>
          </li>
        `).join('')}
      </ul>
    `;
  }

  function alertWindowOptions(selectedValue) {
    return [
      { value: 15, label: '15 min' },
      { value: 30, label: '30 min' },
      { value: 60, label: '1 hora' },
      { value: 120, label: '2 horas' },
      { value: 1440, label: '1 dia' }
    ].map((option) => `
      <option value="${option.value}" ${option.value === selectedValue ? 'selected' : ''}>${option.label}</option>
    `).join('');
  }

  function eventDate(event) {
    const eventTime = event.time || '09:00';
    const dateParts = event.date.split('-').map(Number);
    const timeParts = eventTime.split(':').map(Number);
    return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0] || 0, timeParts[1] || 0);
  }

  function priorityLabel(priority) {
    const labels = {
      normal: 'Normal',
      alta: 'Alta',
      critica: 'Critica'
    };

    return labels[priority] || labels.normal;
  }

  function statusLabel(status) {
    const labels = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      realizado: 'Realizado',
      reprogramar: 'Reprogramar'
    };

    return labels[status] || labels.pendiente;
  }

  function shiftMonth(value, amount) {
    const date = parseMonthKey(value);
    date.setMonth(date.getMonth() + amount);
    return monthKey(date);
  }

  function parseMonthKey(value) {
    const parts = value.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, 1);
  }

  function parseDateValue(value) {
    const parts = value.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function dateInputValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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

  function notificationPermission() {
    if (!('Notification' in window)) {
      return 'unsupported';
    }

    return Notification.permission;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function capitalize(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}());
