# Lumen Planner

Progressive Web App construida con HTML5, CSS3 y JavaScript ES6, sin librerias externas.

## Uso

Lumen Planner es una agenda de trabajo para anotar pendientes, notas, asuntos importantes, reuniones, eventos y seguimientos. Guarda informacion en LocalStorage: registros de agenda, recordatorios, checklists y notas por seccion.

## Funciones principales

- Inicio con captura rapida para guardar pendientes, notas, asuntos, reuniones y eventos.
- Agenda mensual con filtros por tipo de registro.
- Alertas locales para eventos proximos.
- Paneles de notas y checklists por seccion de trabajo.
- Boton Actualizar para recargar la PWA y revisar nuevas versiones.

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
