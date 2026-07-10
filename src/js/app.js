/* Lumen Planner v2.
   Aplicacion modular sin librerias externas para agenda de coordinacion. */

import {
  readStore,
  writeStore,
  exportStore,
  importStore
} from './core/storage.js';
import {
  registerServiceWorker,
  refreshServiceWorker,
  requestNotificationPermission,
  showNotification
} from './core/pwa.js';
import {
  todayIso,
  toIsoDate,
  monthKey,
  parseIsoDate,
  parseMonthKey,
  shiftMonth,
  recordDate,
  formatDate,
  formatTime,
  formatMonth,
  weekdayLabels
} from './utils/date.js';

const TYPES = {
  evento: { label: 'Evento', color: '#159a5b' },
  llamada: { label: 'Llamada', color: '#2457d6' },
  caso: { label: 'Caso especial', color: '#c9352b' },
  nota: { label: 'Nota importante', color: '#7a4fd6' },
  sej: { label: 'Calendario SEJ', color: '#b66b00' },
  personal: { label: 'Personal', color: '#667085' }
};

const DEFAULT_STATE = {
  records: [],
  selectedDate: todayIso(),
  visibleMonth: monthKey(new Date()),
  activeFilter: 'todos',
  dismissedAlertIds: [],
  lastAlertCheck: null
};

const ROUTES = {
  inicio: { title: 'Inicio', type: null },
  agenda: { title: 'Agenda', type: null },
  eventos: { title: 'Eventos', type: 'evento' },
  llamadas: { title: 'Llamadas', type: 'llamada' },
  casos: { title: 'Casos especiales', type: 'caso' },
  notas: { title: 'Notas importantes', type: 'nota' },
  sej: { title: 'Calendario escolar SEJ', type: 'sej' },
  alertas: { title: 'Alertas', type: null },
  respaldo: { title: 'Respaldo', type: null }
};

const app = {
  state: readStore('state', DEFAULT_STATE),
  route: getRouteFromHash(),
  timers: []
};

document.addEventListener('DOMContentLoaded', () => {
  registerServiceWorker();
  bindGlobalControls();
  bindDialog();
  startClock();
  render();
  startAlertLoop();
});

function bindGlobalControls() {
  window.addEventListener('hashchange', () => {
    app.route = getRouteFromHash();
    render();
  });

  document.querySelector('[data-refresh-app]').addEventListener('click', refreshServiceWorker);
}

function bindDialog() {
  const dialog = document.querySelector('[data-record-dialog]');
  const form = document.querySelector('[data-record-form]');

  dialog.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveRecordFromForm(new FormData(form));
    dialog.close();
    render();
  });
}

function startClock() {
  const updateClock = () => {
    const now = new Date();
    document.querySelector('[data-current-date]').textContent = formatDate(now);
    document.querySelector('[data-current-time]').textContent = formatTime(now);
  };

  updateClock();
  app.timers.push(window.setInterval(updateClock, 30000));
}

function startAlertLoop() {
  checkDueAlerts();
  app.timers.push(window.setInterval(checkDueAlerts, 30000));
}

function render() {
  const root = document.querySelector('[data-view-root]');

  setActiveNav();

  if (app.route === 'agenda') {
    root.innerHTML = renderAgendaView();
  } else if (app.route === 'alertas') {
    root.innerHTML = renderAlertsView();
  } else if (app.route === 'respaldo') {
    root.innerHTML = renderBackupView();
  } else if (ROUTES[app.route]?.type) {
    root.innerHTML = renderTypeView(ROUTES[app.route]);
  } else {
    root.innerHTML = renderHomeView();
  }

  bindViewControls(root);
}

function renderHomeView() {
  const todayRecords = getRecordsForDate(app.state.records, todayIso());
  const openRecords = todayRecords.filter((record) => record.status !== 'cerrado');
  const upcoming = getUpcomingRecords(5);

  return `
    <section class="view" aria-labelledby="home-title">
      <article class="hero">
        <div>
          <p class="eyebrow">Inicio</p>
          <h1 id="home-title">${getGreeting()}, Alejandra</h1>
          <p>Agenda simple para registrar eventos, llamadas, casos especiales, notas importantes y fechas del calendario escolar sin perder seguimiento.</p>
        </div>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-new-record>Nuevo registro</button>
          <button class="secondary-button" type="button" data-export-month>Exportar mes</button>
        </div>
      </article>

      <section class="card-grid" aria-label="Resumen del dia">
        ${renderSummaryCards(todayRecords, openRecords)}
      </section>

      <section class="view-grid">
        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Captura rapida</h2>
              <p>Guarda lo importante en menos de un minuto.</p>
            </div>
          </div>
          ${renderQuickForm()}
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Proximo por atender</h2>
              <p>Registros abiertos ordenados por fecha y hora.</p>
            </div>
            <button class="secondary-button" type="button" data-route="agenda">Ver agenda</button>
          </div>
          ${renderRecordList(upcoming, { compact: true })}
        </article>
      </section>
    </section>
  `;
}

function renderAgendaView() {
  const monthDate = parseMonthKey(app.state.visibleMonth);
  const selectedRecords = getFilteredRecords(getRecordsForDate(app.state.records, app.state.selectedDate));

  return `
    <section class="view" aria-labelledby="agenda-title">
      <article class="hero">
        <div>
          <p class="eyebrow">Calendario</p>
          <h1 id="agenda-title">Agenda mensual</h1>
          <p>Selecciona un dia, filtra por tipo y exporta tu agenda diaria o mensual para compartirla.</p>
        </div>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-new-record>Nuevo registro</button>
          <button class="secondary-button" type="button" data-export-day>Exportar dia</button>
          <button class="secondary-button" type="button" data-export-month>Exportar mes</button>
        </div>
      </article>

      <section class="two-column">
        <article class="calendar-panel">
          <div class="calendar-toolbar">
            <button class="icon-button" type="button" data-prev-month aria-label="Mes anterior">&lt;</button>
            <h2>${formatMonth(monthDate)}</h2>
            <button class="icon-button" type="button" data-next-month aria-label="Mes siguiente">&gt;</button>
          </div>
          <div class="toolbar">
            ${renderTypeFilter()}
            <button class="ghost-button" type="button" data-go-today>Hoy</button>
          </div>
          <div class="calendar-weekdays">${weekdayLabels().map((day) => `<span>${day}</span>`).join('')}</div>
          <div class="calendar-grid">${renderCalendarDays(monthDate)}</div>
        </article>

        <aside class="list-panel">
          <div class="panel-header">
            <div>
              <h2>${formatDate(parseIsoDate(app.state.selectedDate))}</h2>
              <p>${selectedRecords.length} registro(s) para este dia.</p>
            </div>
          </div>
          ${renderRecordList(selectedRecords)}
        </aside>
      </section>
    </section>
  `;
}

function renderTypeView(route) {
  const records = app.state.records
    .filter((record) => record.type === route.type)
    .sort(sortRecords);

  return `
    <section class="view" aria-labelledby="type-title">
      <article class="hero">
        <div>
          <p class="eyebrow">${escapeHtml(route.title)}</p>
          <h1 id="type-title">${escapeHtml(route.title)}</h1>
          <p>${getRouteDescription(route.type)}</p>
        </div>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-new-record="${escapeHtml(route.type)}">Agregar</button>
          <button class="secondary-button" type="button" data-export-type="${escapeHtml(route.type)}">Exportar</button>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <div>
            <h2>Registros</h2>
            <p>Ordenados por fecha. Usa editar para actualizar estado o seguimiento.</p>
          </div>
        </div>
        ${renderRecordList(records)}
      </article>
    </section>
  `;
}

function renderAlertsView() {
  const upcoming = getUpcomingRecords(12)
    .filter((record) => Number(record.reminderMinutes || 0) > 0);

  return `
    <section class="view" aria-labelledby="alerts-title">
      <article class="hero">
        <div>
          <p class="eyebrow">Alertas</p>
          <h1 id="alerts-title">Recordatorios</h1>
          <p>Las alertas se basan en los registros con fecha, hora y anticipacion configurada.</p>
        </div>
        <div class="hero-actions">
          <button class="primary-button" type="button" data-enable-alerts>Activar alertas</button>
          <button class="secondary-button" type="button" data-test-alert>Probar</button>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <div>
            <h2>Proximas alertas</h2>
            <p>Si el navegador o el ahorro de bateria bloquean notificaciones, revisa esta pantalla.</p>
          </div>
        </div>
        ${renderRecordList(upcoming, { compact: true })}
        <p class="feedback" data-alert-feedback></p>
      </article>
    </section>
  `;
}

function renderBackupView() {
  return `
    <section class="view" aria-labelledby="backup-title">
      <article class="hero">
        <div>
          <p class="eyebrow">Respaldo</p>
          <h1 id="backup-title">Tus datos viven en este navegador</h1>
          <p>Descarga un respaldo JSON con tus registros y restauralo si cambias de celular, borras datos o reinstalas la app.</p>
        </div>
      </article>

      <article class="panel">
        <div class="button-row">
          <button class="primary-button" type="button" data-download-backup>Descargar respaldo</button>
          <button class="secondary-button" type="button" data-restore-backup>Restaurar respaldo</button>
          <input type="file" accept="application/json,.json" data-restore-file hidden>
        </div>
        <p class="feedback" data-backup-feedback></p>
        <p class="warning-text">Recomendacion: guarda un respaldo semanal en tu nube o correo.</p>
      </article>
    </section>
  `;
}

function renderSummaryCards(todayRecords, openRecords) {
  const counts = [
    { label: 'Abiertos hoy', value: openRecords.length },
    { label: 'Eventos', value: todayRecords.filter((record) => record.type === 'evento').length },
    { label: 'Llamadas', value: todayRecords.filter((record) => record.type === 'llamada').length },
    { label: 'Casos criticos', value: todayRecords.filter((record) => record.type === 'caso' && record.priority === 'critica').length }
  ];

  return counts.map((item) => `
    <article class="summary-card">
      <strong>${item.value}</strong>
      <span>${escapeHtml(item.label)}</span>
    </article>
  `).join('');
}

function renderQuickForm() {
  return `
    <form class="quick-form" data-quick-form>
      <label>
        <span>Tipo</span>
        <select name="type">
          ${Object.entries(TYPES).map(([type, config]) => `<option value="${type}">${escapeHtml(config.label)}</option>`).join('')}
        </select>
      </label>
      <label>
        <span>Titulo</span>
        <input name="title" type="text" placeholder="Que necesitas recordar" required>
      </label>
      <div class="form-grid">
        <label>
          <span>Fecha</span>
          <input name="date" type="date" value="${todayIso()}" required>
        </label>
        <label>
          <span>Hora</span>
          <input name="time" type="time">
        </label>
      </div>
      <label>
        <span>Notas</span>
        <textarea name="notes" rows="3" placeholder="Dato clave, acuerdo o seguimiento"></textarea>
      </label>
      <button class="primary-button" type="submit">Guardar</button>
      <p class="feedback" data-quick-feedback></p>
    </form>
  `;
}

function renderTypeFilter() {
  return `
    <label class="filter-form">
      <span>Filtro</span>
      <select data-type-filter>
        <option value="todos" ${app.state.activeFilter === 'todos' ? 'selected' : ''}>Todos</option>
        ${Object.entries(TYPES).map(([type, config]) => `
          <option value="${type}" ${app.state.activeFilter === type ? 'selected' : ''}>${escapeHtml(config.label)}</option>
        `).join('')}
      </select>
    </label>
  `;
}

function renderCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);

    const value = toIsoDate(day);
    const records = getFilteredRecords(getRecordsForDate(app.state.records, value));

    return `
      <button
        class="calendar-day ${day.getMonth() === month ? '' : 'is-muted'} ${value === app.state.selectedDate ? 'is-selected' : ''}"
        type="button"
        data-select-date="${value}"
        aria-label="${value}"
      >
        <strong>${day.getDate()}</strong>
        <span class="calendar-dots">
          ${records.slice(0, 5).map((record) => `<i style="--type-color:${getType(record.type).color}"></i>`).join('')}
        </span>
      </button>
    `;
  }).join('');
}

function renderRecordList(records, options = {}) {
  if (!records.length) {
    return '<p class="empty-state">No hay registros todavia.</p>';
  }

  return `
    <ul class="record-list">
      ${records.map((record) => renderRecordItem(record, options)).join('')}
    </ul>
  `;
}

function renderRecordItem(record, options = {}) {
  const type = getType(record.type);

  return `
    <li class="record-item" style="--type-color:${type.color}">
      <div>
        <span class="pill"><i class="type-dot"></i>${escapeHtml(type.label)}</span>
        <strong>${escapeHtml(record.title)}</strong>
        <small>${escapeHtml(record.date)} ${record.time ? escapeHtml(record.time) : 'Sin hora'} · ${escapeHtml(getStatusLabel(record.status))} · ${escapeHtml(getPriorityLabel(record.priority))}</small>
        ${record.person ? `<p><b>Persona/area:</b> ${escapeHtml(record.person)}</p>` : ''}
        ${record.place ? `<p><b>Lugar/medio:</b> ${escapeHtml(record.place)}</p>` : ''}
        ${record.followUp && !options.compact ? `<p><b>Seguimiento:</b> ${escapeHtml(record.followUp)}</p>` : ''}
        ${record.notes && !options.compact ? `<p>${escapeHtml(record.notes)}</p>` : ''}
      </div>
      <div class="record-actions">
        <button class="secondary-button" type="button" data-edit-record="${escapeHtml(record.id)}">Editar</button>
        <button class="danger-button" type="button" data-delete-record="${escapeHtml(record.id)}">Eliminar</button>
      </div>
    </li>
  `;
}

function bindViewControls(root) {
  root.querySelectorAll('[data-new-record]').forEach((button) => {
    button.addEventListener('click', () => openRecordDialog(null, button.dataset.newRecord || null));
  });

  root.querySelectorAll('[data-edit-record]').forEach((button) => {
    button.addEventListener('click', () => openRecordDialog(button.dataset.editRecord));
  });

  root.querySelectorAll('[data-delete-record]').forEach((button) => {
    button.addEventListener('click', () => deleteRecord(button.dataset.deleteRecord));
  });

  root.querySelector('[data-quick-form]')?.addEventListener('submit', handleQuickSubmit);
  root.querySelector('[data-prev-month]')?.addEventListener('click', () => updateMonth(-1));
  root.querySelector('[data-next-month]')?.addEventListener('click', () => updateMonth(1));
  root.querySelector('[data-go-today]')?.addEventListener('click', goToday);
  root.querySelector('[data-type-filter]')?.addEventListener('change', updateTypeFilter);
  root.querySelector('[data-export-day]')?.addEventListener('click', () => exportRecords(getRecordsForDate(app.state.records, app.state.selectedDate), `lumen-dia-${app.state.selectedDate}.xls`));
  root.querySelector('[data-export-month]')?.addEventListener('click', () => exportRecords(getRecordsForMonth(app.state.records, app.state.visibleMonth), `lumen-mes-${app.state.visibleMonth}.xls`));

  root.querySelectorAll('[data-export-type]').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.exportType;
      exportRecords(app.state.records.filter((record) => record.type === type), `lumen-${type}.xls`);
    });
  });

  root.querySelectorAll('[data-select-date]').forEach((button) => {
    button.addEventListener('click', () => {
      app.state.selectedDate = button.dataset.selectDate;
      app.state.visibleMonth = monthKey(parseIsoDate(app.state.selectedDate));
      persistAndRender();
    });
  });

  root.querySelector('[data-route]')?.addEventListener('click', (event) => {
    window.location.hash = event.currentTarget.dataset.route;
  });

  root.querySelector('[data-enable-alerts]')?.addEventListener('click', enableAlerts);
  root.querySelector('[data-test-alert]')?.addEventListener('click', testAlert);
  root.querySelector('[data-download-backup]')?.addEventListener('click', downloadBackup);
  root.querySelector('[data-restore-backup]')?.addEventListener('click', () => root.querySelector('[data-restore-file]').click());
  root.querySelector('[data-restore-file]')?.addEventListener('change', restoreBackup);
}

function handleQuickSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const data = new FormData(form);

  addRecord({
    type: String(data.get('type') || 'evento'),
    title: String(data.get('title') || '').trim(),
    date: String(data.get('date') || todayIso()),
    time: String(data.get('time') || ''),
    notes: String(data.get('notes') || '').trim()
  });

  form.reset();
  form.querySelector('[name="date"]').value = todayIso();
  form.querySelector('[data-quick-feedback]').textContent = 'Registro guardado.';
  render();
}

function openRecordDialog(recordId, preferredType = null) {
  const dialog = document.querySelector('[data-record-dialog]');
  const form = document.querySelector('[data-record-form]');
  const record = recordId ? app.state.records.find((item) => item.id === recordId) : null;
  const values = record || createEmptyRecord(preferredType);

  form.reset();
  form.elements.id.value = values.id || '';
  form.elements.type.value = values.type;
  form.elements.title.value = values.title;
  form.elements.date.value = values.date;
  form.elements.time.value = values.time;
  form.elements.priority.value = values.priority;
  form.elements.status.value = values.status;
  form.elements.person.value = values.person;
  form.elements.place.value = values.place;
  form.elements.reminderMinutes.value = String(values.reminderMinutes);
  form.elements.followUp.value = values.followUp;
  form.elements.notes.value = values.notes;
  document.querySelector('[data-dialog-title]').textContent = record ? 'Editar registro' : 'Nuevo registro';
  dialog.showModal();
}

function saveRecordFromForm(data) {
  const record = {
    id: String(data.get('id') || createId()),
    type: String(data.get('type') || 'evento'),
    title: String(data.get('title') || '').trim(),
    date: String(data.get('date') || todayIso()),
    time: String(data.get('time') || ''),
    priority: String(data.get('priority') || 'normal'),
    status: String(data.get('status') || 'pendiente'),
    person: String(data.get('person') || '').trim(),
    place: String(data.get('place') || '').trim(),
    reminderMinutes: Number(data.get('reminderMinutes') || 0),
    followUp: String(data.get('followUp') || '').trim(),
    notes: String(data.get('notes') || '').trim(),
    updatedAt: new Date().toISOString()
  };

  if (!record.title) {
    return;
  }

  const exists = app.state.records.some((item) => item.id === record.id);

  app.state.records = exists
    ? app.state.records.map((item) => item.id === record.id ? { ...item, ...record } : item)
    : [...app.state.records, { ...record, createdAt: new Date().toISOString() }];

  app.state.selectedDate = record.date;
  app.state.visibleMonth = monthKey(parseIsoDate(record.date));
  persist();
}

function addRecord(partialRecord) {
  const record = {
    ...createEmptyRecord(partialRecord.type),
    ...partialRecord,
    id: createId(),
    priority: partialRecord.type === 'caso' ? 'alta' : 'normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  app.state.records = [...app.state.records, record];
  app.state.selectedDate = record.date;
  app.state.visibleMonth = monthKey(parseIsoDate(record.date));
  persist();
}

function deleteRecord(recordId) {
  app.state.records = app.state.records.filter((record) => record.id !== recordId);
  persistAndRender();
}

function createEmptyRecord(preferredType = null) {
  return {
    id: '',
    type: preferredType || 'evento',
    title: '',
    date: app.state.selectedDate || todayIso(),
    time: '',
    priority: 'normal',
    status: 'pendiente',
    person: '',
    place: '',
    reminderMinutes: 60,
    followUp: '',
    notes: ''
  };
}

function updateMonth(amount) {
  app.state.visibleMonth = shiftMonth(app.state.visibleMonth, amount);
  app.state.selectedDate = `${app.state.visibleMonth}-01`;
  persistAndRender();
}

function goToday() {
  app.state.selectedDate = todayIso();
  app.state.visibleMonth = monthKey(new Date());
  persistAndRender();
}

function updateTypeFilter(event) {
  app.state.activeFilter = event.currentTarget.value;
  persistAndRender();
}

function persistAndRender() {
  persist();
  render();
}

function persist() {
  writeStore('state', app.state);
}

async function enableAlerts(event) {
  const permission = await requestNotificationPermission();
  const feedback = event.currentTarget.closest('.view').querySelector('[data-alert-feedback]');

  feedback.textContent = permission === 'granted'
    ? 'Alertas activadas.'
    : 'No se activaron las alertas. Revisa permisos del navegador.';
}

async function testAlert(event) {
  const feedback = event.currentTarget.closest('.view').querySelector('[data-alert-feedback]');
  const sent = await showNotification('Lumen Planner', 'Alerta de prueba lista.', 'lumen-test');

  feedback.textContent = sent ? 'Alerta enviada.' : 'Activa permisos de notificacion primero.';
}

async function checkDueAlerts() {
  const now = Date.now();
  const dueRecords = app.state.records.filter((record) => {
    const reminder = Number(record.reminderMinutes || 0);

    if (!reminder || !record.time || app.state.dismissedAlertIds.includes(record.id)) {
      return false;
    }

    const startsAt = recordDate(record).getTime();
    const alertAt = startsAt - reminder * 60000;

    return now >= alertAt && now <= startsAt + 10 * 60000;
  });

  for (const record of dueRecords) {
    const sent = await showNotification('Lumen Planner', `${record.title} · ${record.time || 'sin hora'}`, record.id);

    if (sent) {
      app.state.dismissedAlertIds.push(record.id);
    }
  }

  app.state.lastAlertCheck = new Date().toISOString();
  app.state.dismissedAlertIds = cleanDismissedIds(app.state.dismissedAlertIds);
  persist();
}

function cleanDismissedIds(ids) {
  const activeIds = new Set(app.state.records
    .filter((record) => recordDate(record).getTime() > Date.now() - 7 * 24 * 60 * 60000)
    .map((record) => record.id));

  return ids.filter((id) => activeIds.has(id));
}

function downloadBackup(event) {
  const payload = exportStore();
  const file = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json'
  });

  downloadBlob(file, `lumen-respaldo-${todayIso()}.json`);
  event.currentTarget.closest('.view').querySelector('[data-backup-feedback]').textContent = 'Respaldo descargado.';
}

function restoreBackup(event) {
  const file = event.currentTarget.files?.[0];
  const feedback = event.currentTarget.closest('.view').querySelector('[data-backup-feedback]');

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.addEventListener('load', () => {
    try {
      importStore(String(reader.result || ''));
      feedback.textContent = 'Respaldo restaurado. Recargando...';
      window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      feedback.textContent = 'No se pudo restaurar. Revisa que sea un respaldo valido.';
    }
  });

  reader.readAsText(file);
  event.currentTarget.value = '';
}

async function exportRecords(records, fileName) {
  if (!records.length) {
    window.alert('No hay registros para exportar.');
    return;
  }

  const file = new File([buildExcelHtml(records)], fileName, {
    type: 'application/vnd.ms-excel'
  });

  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({
        title: 'Lumen Planner',
        text: 'Agenda exportada desde Lumen Planner.',
        files: [file]
      });
      return;
    } catch (error) {
      downloadBlob(file, fileName);
      return;
    }
  }

  downloadBlob(file, fileName);
}

function buildExcelHtml(records) {
  const rows = records.sort(sortRecords).map((record) => `
    <tr>
      <td>${escapeHtml(record.date)}</td>
      <td>${escapeHtml(record.time || '')}</td>
      <td>${escapeHtml(getType(record.type).label)}</td>
      <td>${escapeHtml(record.title)}</td>
      <td>${escapeHtml(getPriorityLabel(record.priority))}</td>
      <td>${escapeHtml(getStatusLabel(record.status))}</td>
      <td>${escapeHtml(record.person || '')}</td>
      <td>${escapeHtml(record.place || '')}</td>
      <td>${escapeHtml(record.followUp || '')}</td>
      <td>${escapeHtml(record.notes || '')}</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #d9e1ef; padding: 8px; vertical-align: top; }
          th { background: #eaf0ff; color: #183f9d; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Tipo</th>
              <th>Titulo</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Persona o area</th>
              <th>Lugar o medio</th>
              <th>Seguimiento</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
}

function downloadBlob(blob, fileName) {
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function setActiveNav() {
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.navLink === app.route);
  });
}

function getFilteredRecords(records) {
  if (app.state.activeFilter === 'todos') {
    return records.sort(sortRecords);
  }

  return records.filter((record) => record.type === app.state.activeFilter).sort(sortRecords);
}

function getRecordsForDate(records, date) {
  return records.filter((record) => record.date === date).sort(sortRecords);
}

function getRecordsForMonth(records, month) {
  return records.filter((record) => record.date?.startsWith(month)).sort(sortRecords);
}

function getUpcomingRecords(limit) {
  return app.state.records
    .filter((record) => record.status !== 'cerrado' && recordDate(record).getTime() >= Date.now() - 60 * 60000)
    .sort(sortRecords)
    .slice(0, limit);
}

function sortRecords(first, second) {
  return `${first.date} ${first.time || '23:59'}`.localeCompare(`${second.date} ${second.time || '23:59'}`);
}

function getRouteFromHash() {
  const route = window.location.hash.replace('#', '') || 'inicio';
  return ROUTES[route] ? route : 'inicio';
}

function getRouteDescription(type) {
  const descriptions = {
    evento: 'Actividades programadas, reuniones amplias, entregas y fechas que tienen hora o preparacion.',
    llamada: 'Personas por contactar, mensajes por enviar y respuestas que necesitas registrar.',
    caso: 'Situaciones especiales o delicadas que requieren contexto, cuidado y seguimiento.',
    nota: 'Datos criticos, acuerdos, instrucciones y recordatorios que no deben perderse.',
    sej: 'Fechas oficiales del calendario escolar que captures cuando la SEJ publique o actualice informacion.',
    personal: 'Pendientes personales que conviene mantener separados del trabajo.'
  };

  return descriptions[type] || 'Registros de agenda.';
}

function getType(type) {
  return TYPES[type] || TYPES.evento;
}

function getPriorityLabel(priority) {
  return {
    normal: 'Normal',
    alta: 'Alta',
    critica: 'Critica'
  }[priority] || 'Normal';
}

function getStatusLabel(status) {
  return {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    espera: 'En espera',
    cerrado: 'Cerrado'
  }[status] || 'Pendiente';
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

function createId() {
  return `record-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
