/* Control funcional de pestañas del planner.
   Cada pestaña abre una hoja editable con checklist y notas persistentes en LocalStorage. */

(function () {
  const WORKSPACE_STORAGE_KEY = 'lumen-planner:planner-tabs';
  const WORKSPACE_DATA_KEY = 'lumen-planner:planner-tab-data';
  const VIEW_BY_TAB = {
    dashboard: 'dashboard',
    agenda: 'agenda',
    alerts: 'alerts'
  };

  const PANEL_CONTENT = {
    capture: {
      title: 'Captura rapida',
      subtitle: 'Anota cualquier pendiente, nota, asunto o evento antes de que se pierda el detalle.',
      group: 'Entrada',
      checklist: ['Escribir el tema', 'Definir si es pendiente, nota, asunto, reunion o evento', 'Agregar fecha si aplica', 'Moverlo a Agenda si necesita recordatorio']
    },
    pending: {
      title: 'Pendientes',
      subtitle: 'Lista operativa para tareas abiertas, compromisos y acciones por cerrar.',
      group: 'Trabajo',
      checklist: ['Pendiente nuevo', 'Responsable o persona relacionada', 'Fecha limite', 'Siguiente accion', 'Estado revisado']
    },
    notes: {
      title: 'Notas',
      subtitle: 'Espacio libre para ideas, observaciones, datos sueltos y contexto importante.',
      group: 'Trabajo',
      checklist: ['Nota registrada', 'Contexto suficiente', 'Dato importante marcado', 'Revisar despues si requiere accion']
    },
    matters: {
      title: 'Asuntos importantes',
      subtitle: 'Temas delicados o relevantes que necesitan seguimiento claro.',
      group: 'Prioridad',
      checklist: ['Asunto descrito', 'Impacto identificado', 'Persona o area relacionada', 'Fecha de seguimiento', 'Accion definida']
    },
    meetings: {
      title: 'Reuniones',
      subtitle: 'Prepara juntas, llamadas y acuerdos para entrar con claridad y salir con acciones.',
      group: 'Reuniones',
      checklist: ['Objetivo de la reunion', 'Personas convocadas', 'Puntos a tratar', 'Acuerdos', 'Seguimiento posterior']
    },
    events: {
      title: 'Eventos',
      subtitle: 'Registra actividades programadas, fechas importantes y recordatorios.',
      group: 'Agenda',
      checklist: ['Evento identificado', 'Fecha y hora', 'Lugar o medio', 'Preparativos', 'Recordatorio en Agenda']
    },
    followup: {
      title: 'Seguimiento',
      subtitle: 'Controla lo que ya se hablo, lo que falta confirmar y lo que no debe olvidarse.',
      group: 'Cierre',
      checklist: ['Que se acordo', 'A quien avisar', 'Que enviar o revisar', 'Fecha de revision', 'Cierre registrado']
    },
    today: {
      title: 'Hoy',
      subtitle: 'Vista rapida para concentrar lo que debe resolverse durante la jornada.',
      group: 'Dia',
      checklist: ['Pendiente principal', 'Reunion o evento clave', 'Asunto importante', 'Nota relevante', 'Cierre del dia']
    },
    urgent: {
      title: 'Urgente',
      subtitle: 'Lugar para lo que requiere atencion inmediata o no puede esperar.',
      group: 'Prioridad',
      checklist: ['Urgencia clara', 'Hora limite', 'Persona involucrada', 'Riesgo si no se atiende', 'Accion inmediata']
    },
    waiting: {
      title: 'En espera',
      subtitle: 'Seguimiento de respuestas, documentos, llamadas o confirmaciones pendientes.',
      group: 'Seguimiento',
      checklist: ['Que espero', 'De quien', 'Desde cuando', 'Cuando insistir', 'Resultado recibido']
    },
    calls: {
      title: 'Llamadas y mensajes',
      subtitle: 'Control de personas por contactar y mensajes importantes por enviar.',
      group: 'Contacto',
      checklist: ['Persona', 'Tema', 'Medio de contacto', 'Mensaje enviado', 'Respuesta registrada']
    },
    archive: {
      title: 'Archivo',
      subtitle: 'Referencia rapida para datos, acuerdos o notas que conviene conservar.',
      group: 'Consulta',
      checklist: ['Dato guardado', 'Tema relacionado', 'Fecha', 'Donde encontrarlo', 'Revisado']
    },
    line: {
      title: 'Bitacora diaria',
      subtitle: 'Registro lineal para seguimiento de jornada escolar.',
      group: 'Herramientas',
      checklist: ['Entrada y apertura', 'Incidencias del dia', 'Acuerdos con docentes', 'Cierre de jornada']
    },
    grid: {
      title: 'Matriz de prioridades',
      subtitle: 'Organiza actividades por urgencia, impacto y responsable.',
      group: 'Herramientas',
      checklist: ['Alta prioridad', 'Seguimiento medio', 'Puede esperar', 'Delegado']
    },
    table: {
      title: 'Tabla de seguimiento',
      subtitle: 'Control de actividad, responsable, fecha y estado.',
      group: 'Herramientas',
      checklist: ['Actividad definida', 'Responsable asignado', 'Fecha limite clara', 'Estado actualizado']
    },
    graph: {
      title: 'Indicadores',
      subtitle: 'Espacio para observar tendencias de asistencia, entregas y eventos.',
      group: 'Herramientas',
      checklist: ['Asistencia revisada', 'Planeaciones verificadas', 'Eventos registrados', 'Alertas atendidas']
    },
    index: {
      title: 'Indice operativo',
      subtitle: 'Mapa de acceso a las secciones principales del planner.',
      group: 'Herramientas',
      checklist: ['Dashboard', 'Agenda mensual', 'Alertas', 'Docente', 'Coordinacion', 'Personal']
    },
    overview: {
      title: 'Overview general',
      subtitle: 'Vista global para iniciar el dia con claridad.',
      group: 'Herramientas',
      checklist: ['Revisar agenda', 'Confirmar prioridades', 'Detectar riesgos', 'Preparar cierre']
    },
    monthly: {
      title: 'Vista mensual',
      subtitle: 'Organiza pendientes, reuniones, eventos y asuntos importantes del mes.',
      group: 'Mes',
      checklist: ['Fechas importantes', 'Reuniones principales', 'Pendientes de cierre', 'Asuntos a vigilar']
    },
    custom: {
      title: 'Pagina personalizada',
      subtitle: 'Hoja libre para adaptar el planner a una necesidad inmediata.',
      group: 'Personalizable',
      checklist: ['Objetivo', 'Recursos', 'Pendientes', 'Siguiente accion']
    },
    'page-1': {
      title: 'Apertura escolar',
      subtitle: 'Rutina corta para comenzar el dia con orden.',
      group: 'Coordinacion',
      checklist: ['Revisar grupos', 'Confirmar docentes', 'Verificar incidencias', 'Comunicar avisos']
    },
    'page-2': {
      title: 'Seguimiento de temas',
      subtitle: 'Control de asuntos abiertos para no perder contexto entre reuniones.',
      group: 'Trabajo',
      checklist: ['Tema identificado', 'Contexto documentado', 'Accion definida', 'Seguimiento programado']
    },
    'page-3': {
      title: 'Reuniones y acuerdos',
      subtitle: 'Minuta breve para juntas con docentes, familias o direccion.',
      group: 'Coordinacion',
      checklist: ['Tema', 'Acuerdo', 'Responsable', 'Fecha de revision']
    },
    'page-4': {
      title: 'Cierre semanal',
      subtitle: 'Revision de avances, pendientes y ajustes.',
      group: 'Personal',
      checklist: ['Logros', 'Pendientes', 'Riesgos', 'Prioridad siguiente']
    },
    year: {
      title: 'Vista anual',
      subtitle: 'Mapa de fechas importantes, periodos de trabajo y eventos que no deben olvidarse.',
      group: 'Agenda',
      checklist: ['Fechas importantes', 'Eventos grandes', 'Periodos de trabajo', 'Recordatorios anuales']
    },
    teacher: {
      title: 'Docente',
      subtitle: 'Agenda docente para clases, materiales, evidencias, pendientes y recordatorios.',
      group: 'Rol docente',
      checklist: ['Clase o actividad preparada', 'Materiales listos', 'Evidencias o productos ubicados', 'Pendiente academico anotado', 'Recordatorio agregado', 'Cierre registrado']
    },
    coordination: {
      title: 'Coordinacion',
      subtitle: 'Agenda de coordinacion para reuniones, acuerdos, reportes, eventos y pendientes.',
      group: 'Rol coordinadora',
      checklist: ['Reunion preparada', 'Acuerdo registrado', 'Documento o reporte pendiente', 'Persona responsable definida', 'Fecha de seguimiento anotada', 'Riesgo importante marcado']
    },
    personal: {
      title: 'Personal',
      subtitle: 'Balance personal, habitos, salud, finanzas, metas y recordatorios.',
      group: 'Vida personal',
      checklist: ['Habito del dia', 'Cuidado personal', 'Pendiente familiar', 'Gasto importante', 'Meta semanal', 'Momento de descanso']
    },
    school: {
      title: 'Escolar',
      subtitle: 'Concentrado de actividades institucionales y comunicados.',
      group: 'Escuela',
      checklist: ['Comunicados', 'Actividades civicas', 'Necesidades de grupo', 'Recursos escolares', 'Pendientes administrativos']
    },
    agenda: {
      title: 'Agenda',
      subtitle: 'Usa el calendario para crear, editar y eliminar eventos.',
      group: 'Agenda',
      checklist: ['Evento creado', 'Categoria asignada', 'Hora definida', 'Alerta revisada']
    },
    alerts: {
      title: 'Alertas',
      subtitle: 'Configura avisos para no perder eventos importantes.',
      group: 'Agenda',
      checklist: ['Notificaciones activadas', 'Anticipacion definida', 'Eventos proximos revisados', 'Prueba realizada']
    },
    planning: {
      title: 'Planeacion',
      subtitle: 'Organiza clases, reuniones, prioridades, recursos y cierre de actividades.',
      group: 'Docente',
      checklist: ['Objetivo claro', 'Bloques de tiempo', 'Recursos necesarios', 'Personas involucradas', 'Resultado esperado', 'Cierre']
    },
    review: {
      title: 'Revision',
      subtitle: 'Evalua resultados y define ajustes para la siguiente jornada.',
      group: 'Coordinacion',
      checklist: ['Que funciono', 'Que falta', 'Que ajustar', 'A quien informar', 'Proxima fecha']
    }
  };

  const SECTION_TARGETS = {};

  document.addEventListener('DOMContentLoaded', () => {
    const workspace = document.querySelector('[data-planner-workspace]');

    if (!workspace) {
      return;
    }

    bindTabButtons(workspace);
    bindMonthButtons();
    bindRefreshButton();

    const savedTab = readSavedTab();
    activateTab(savedTab || 'dashboard', workspace);
  });

  function bindTabButtons(workspace) {
    document.querySelectorAll('[data-planner-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const tabId = button.dataset.plannerTab;
        activateTab(tabId, workspace);
        saveTab(tabId);
      });
    });
  }

  function bindMonthButtons() {
    document.querySelectorAll('[data-planner-month]').forEach((button) => {
      button.addEventListener('click', () => {
        const month = Number(button.dataset.plannerMonth);
        const year = new Date().getFullYear();

        setActiveView('agenda');
        setActiveButton(button);
        saveTab('agenda');
        window.dispatchEvent(new CustomEvent('lumen:agenda-jump-month', {
          detail: {
            month,
            year
          }
        }));
      });
    });
  }

  function bindRefreshButton() {
    const refreshButton = document.querySelector('[data-refresh-app]');

    if (!refreshButton) {
      return;
    }

    refreshButton.addEventListener('click', () => {
      refreshButton.disabled = true;
      refreshButton.textContent = 'Actualizando...';

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration()
          .then((registration) => registration?.update())
          .finally(() => {
            window.location.reload();
          });
        return;
      }

      window.location.reload();
    });
  }

  function activateTab(tabId, workspace) {
    const view = VIEW_BY_TAB[tabId] || 'workspace';

    setActiveView(view);
    setActiveButton(document.querySelector(`[data-planner-tab="${tabId}"]`));

    if (view === 'workspace') {
      showPanel(tabId, workspace);
    }

    if (SECTION_TARGETS[tabId]) {
      scrollToTarget(SECTION_TARGETS[tabId]);
    }
  }

  function setActiveView(viewName) {
    document.querySelectorAll('[data-planner-view]').forEach((view) => {
      view.hidden = view.dataset.plannerView !== viewName;
    });

    const plannerPages = document.querySelector('.planner-pages');

    if (plannerPages) {
      plannerPages.dataset.activeView = viewName;
    }
  }

  function showPanel(tabId, workspace) {
    const content = PANEL_CONTENT[tabId] || PANEL_CONTENT.overview;
    const tabData = readTabData(tabId, content);

    workspace.innerHTML = `
      <article class="planner-panel" aria-labelledby="planner-panel-title" data-active-panel="${escapeHtml(tabId)}">
        <div class="panel-header">
          <h3 id="planner-panel-title">${escapeHtml(content.title)}</h3>
          <span>${content.checklist.length}</span>
        </div>
        <p>${escapeHtml(content.subtitle)}</p>
        <div class="planner-panel-meta">
          <span>${escapeHtml(content.group)}</span>
          <span>${new Date().toLocaleDateString('es-MX')}</span>
        </div>
        <ul class="planner-panel-list">
          ${content.checklist.map((item, index) => `
            <li>
              <label>
                <input type="checkbox" data-panel-check="${index}" ${tabData.checked[index] ? 'checked' : ''}>
                <span>${escapeHtml(item)}</span>
              </label>
            </li>
          `).join('')}
        </ul>
        <label class="planner-notes">
          <span>Notas de esta seccion</span>
          <textarea data-panel-notes rows="5" placeholder="Escribe aqui observaciones, acuerdos o pendientes.">${escapeHtml(tabData.notes)}</textarea>
        </label>
      </article>
    `;

    bindPanelInputs(tabId, workspace, content);
  }

  function bindPanelInputs(tabId, workspace, content) {
    const checkboxes = workspace.querySelectorAll('[data-panel-check]');
    const notes = workspace.querySelector('[data-panel-notes]');

    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const tabData = readTabData(tabId, content);
        tabData.checked[Number(checkbox.dataset.panelCheck)] = checkbox.checked;
        writeTabData(tabId, tabData);
      });
    });

    if (notes) {
      notes.addEventListener('input', () => {
        const tabData = readTabData(tabId, content);
        tabData.notes = notes.value;
        writeTabData(tabId, tabData);
      });
    }
  }

  function setActiveButton(activeButton) {
    document.querySelectorAll('[data-planner-tab], [data-planner-month]').forEach((button) => {
      button.classList.remove('is-active');
    });

    if (activeButton) {
      activeButton.classList.add('is-active');
    }
  }

  function scrollToTarget(selector) {
    const target = document.querySelector(selector);

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  function readSavedTab() {
    try {
      return JSON.parse(window.localStorage.getItem(WORKSPACE_STORAGE_KEY) || '{}').activeTab;
    } catch (error) {
      return null;
    }
  }

  function saveTab(tabId) {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify({
      activeTab: tabId
    }));
  }

  function readAllPanelData() {
    try {
      return JSON.parse(window.localStorage.getItem(WORKSPACE_DATA_KEY) || '{}');
    } catch (error) {
      return {};
    }
  }

  function readTabData(tabId, content) {
    const allData = readAllPanelData();

    return {
      checked: Array.from({ length: content.checklist.length }, (_, index) => Boolean(allData[tabId]?.checked?.[index])),
      notes: allData[tabId]?.notes || ''
    };
  }

  function writeTabData(tabId, tabData) {
    const allData = readAllPanelData();

    allData[tabId] = tabData;
    window.localStorage.setItem(WORKSPACE_DATA_KEY, JSON.stringify(allData));
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
