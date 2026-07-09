# Lumen Planner

Progressive Web App construida con HTML5, CSS3 y JavaScript ES6, sin librerias externas.

## Uso

Lumen Planner es una agenda de trabajo para coordinar actividades docentes, de coordinacion y personales. Guarda informacion en LocalStorage: eventos, contexto, recordatorios, checklists y notas por seccion.

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
