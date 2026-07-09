/* Punto de entrada principal de Lumen Planner.
   En esta etapa solo inicializa el Dashboard y conserva intactos los demas modulos. */

import { APP_CONFIG } from './config/app-config.js';
import { registerServiceWorker } from './core/pwa.js';
import { createStorageAdapter } from './core/storage.js';
import { createRouter } from './core/router.js';
import { createAgendaModule } from './modules/agenda/index.js';
import { createAlertsModule } from './modules/alerts/index.js';
import { createDashboardModule } from './modules/dashboard/index.js';
import { createPlannerModule } from './modules/planner/index.js';
import { createSettingsModule } from './modules/settings/index.js';

const appContext = {
  /* Configuracion compartida de la aplicacion. */
  config: APP_CONFIG,

  /* Adaptador central de LocalStorage para datos persistentes. */
  storage: createStorageAdapter(APP_CONFIG.storageKey),

  /* Router reservado para navegacion futura entre modulos. */
  router: createRouter(),

  /* Registro de modulos disponibles en la arquitectura. */
  modules: {
    agenda: createAgendaModule(),
    alerts: createAlertsModule(),
    dashboard: createDashboardModule(),
    planner: createPlannerModule(),
    settings: createSettingsModule()
  }
};

/* Monta el Dashboard cuando el documento ya tiene disponible su raiz visual. */
const dashboardRoot = document.querySelector('[data-dashboard-root]');

if (dashboardRoot) {
  appContext.modules.dashboard.mount(dashboardRoot, appContext);
}

/* Monta el modulo Agenda cuando existe su contenedor en el documento. */
const agendaRoot = document.querySelector('[data-agenda-root]');

if (agendaRoot) {
  appContext.modules.agenda.mount(agendaRoot, appContext);
}

/* Monta el modulo Alertas para observar eventos proximos de la Agenda. */
const alertsRoot = document.querySelector('[data-alerts-root]');

if (alertsRoot) {
  appContext.modules.alerts.mount(alertsRoot, appContext);
}

/* Registra la PWA para GitHub Pages y navegadores compatibles. */
registerServiceWorker(APP_CONFIG.serviceWorkerPath);

export { appContext };
