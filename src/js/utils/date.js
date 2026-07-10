/* Utilidades de fecha centralizadas para evitar inconsistencias en formularios y calendario. */
const DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const TIME_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit'
});

const MONTH_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  month: 'long',
  year: 'numeric'
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short'
});

function todayIso() {
  return toIsoDate(new Date());
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function monthKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function parseIsoDate(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

function parseMonthKey(value) {
  const [year, month] = String(value).split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function shiftMonth(value, amount) {
  const date = parseMonthKey(value);
  date.setMonth(date.getMonth() + amount);
  return monthKey(date);
}

function recordDate(record) {
  const [year, month, day] = String(record.date).split('-').map(Number);
  const [hour = 9, minute = 0] = String(record.time || '09:00').split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function formatDate(date) {
  return capitalize(DATE_FORMATTER.format(date));
}

function formatTime(date) {
  return TIME_FORMATTER.format(date);
}

function formatMonth(date) {
  return capitalize(MONTH_FORMATTER.format(date));
}

function weekdayLabels() {
  const baseSunday = new Date(2026, 0, 4);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(baseSunday);
    day.setDate(baseSunday.getDate() + index);
    return capitalize(WEEKDAY_FORMATTER.format(day));
  });
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
}

export {
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
};
