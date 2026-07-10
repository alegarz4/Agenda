# Lumen Planner

Progressive Web App construida con HTML5, CSS3 y JavaScript ES6, sin librerias externas.

## Uso

Lumen Planner es una agenda de coordinacion para anotar eventos, llamadas, casos especiales, notas importantes, fechas del calendario escolar y seguimientos. Guarda informacion en LocalStorage: registros de agenda, recordatorios, checklists y notas por seccion.

## Funciones principales

- Inicio con captura rapida para guardar eventos, llamadas, casos especiales, notas importantes, calendario SEJ y asuntos personales.
- Agenda mensual con filtros por tipo de registro y categorias por color.
- Exportacion de la vista diaria o mensual en archivo `.xls`; en celulares compatibles abre el dialogo de compartir para enviarlo por WhatsApp.
- Alertas locales para eventos proximos, emitidas por Service Worker cuando el navegador lo permite.
- Aviso al reabrir la app si hubo recordatorios que debieron iniciar mientras no estaba abierta.
- Descarga y restauracion manual de respaldos en formato JSON desde el Dashboard.
- Paneles de notas y checklists para eventos, llamadas, casos especiales, notas importantes, calendario escolar SEJ y seguimiento.
- Boton Actualizar para recargar la PWA y revisar nuevas versiones.

## Calendario escolar SEJ

La app no consulta servidores externos para no depender de credenciales ni APIs. Usa la pestaña `Calendario SEJ` y la categoria `Calendario SEJ` para registrar fechas publicadas por la Secretaria de Educacion Jalisco; cuando exista una actualizacion oficial, capturala ahi y quedara guardada en el dispositivo.

## Respaldo de informacion

La informacion vive en LocalStorage del navegador. Usa `Descargar respaldo` para guardar un archivo `.json` con tus registros, alertas, notas y configuraciones. Usa `Restaurar respaldo` para recuperar ese archivo si cambias de equipo, reinstalas el navegador o se borran datos locales.

Recomendacion: descarga un respaldo una vez por semana y guardalo en tu correo o nube.

## Limitaciones de notificaciones

Lumen Planner no usa servidor externo. Las alertas dependen de los permisos del navegador, del sistema operativo y de que el navegador permita ejecutar la PWA en segundo plano. El Service Worker mejora la entrega, pero algunos telefonos pueden pausar notificaciones si la app fue cerrada por completo, si el ahorro de bateria la restringe o si el permiso fue bloqueado.

## GitHub Pages

1. Sube todo el contenido de esta carpeta a un repositorio.
2. En GitHub, activa Pages desde la rama principal y la raiz del proyecto.
3. Abre la URL publicada.
4. En Android o Chrome, usa "Instalar app" cuando el navegador lo ofrezca.

## PWA

- `manifest.webmanifest`: metadatos, iconos y accesos directos.
- `service-worker.js`: cache offline para abrir la app sin conexion.
- `assets/icons/`: iconos SVG y PNG requeridos para instalacion.

## Estructura

- `index.html`: documento principal compatible con GitHub Pages.
- `src/css/`: estilos separados por responsabilidad.
- `src/js/`: modulos de Dashboard, Agenda, Alertas y pestañas funcionales.
- `src/data/`: espacio reservado para esquemas futuros.
