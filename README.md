# Lumen Planner

Progressive Web App construida desde cero con HTML5, CSS3 y JavaScript ES6, sin librerias externas.

## Proposito

Lumen Planner es una agenda de coordinacion para registrar y consultar:

- Eventos
- Llamadas
- Casos especiales
- Notas importantes
- Fechas del calendario escolar SEJ
- Asuntos personales
- Alertas y recordatorios

## Funciones

- Navegacion por pestanas reales: Inicio, Agenda, Eventos, Llamadas, Casos, Notas, SEJ, Alertas y Respaldo.
- Formulario unico para crear, editar y eliminar registros.
- Calendario mensual con filtros por tipo.
- Listas especificas por categoria.
- Alertas locales con permisos del navegador.
- Exportacion diaria, mensual o por categoria en archivo `.xls`; en celulares compatibles se puede compartir desde el dialogo nativo, incluido WhatsApp.
- Respaldo y restauracion en JSON.
- Persistencia completa en LocalStorage.
- Service Worker para uso offline e instalacion como PWA.

## Calendario escolar SEJ

La app no consulta servidores externos. Las fechas oficiales deben capturarse manualmente en la categoria `Calendario SEJ` cuando la Secretaria de Educacion Jalisco publique o actualice informacion.

## Publicacion en GitHub Pages

La app es estatica y funciona desde la raiz del repositorio:

- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `assets/`
- `src/css/`
- `src/js/`

## Datos

Los datos se guardan en LocalStorage con el espacio de nombres `lumen-planner-v2`. Si se borran los datos del navegador, se pierde la informacion local; por eso se recomienda descargar respaldos periodicamente desde la pestana Respaldo.
