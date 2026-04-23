const pad = (value: number) => String(value).padStart(2, '0');

export const formatLocalDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayInputValue = () => formatLocalDate(new Date());

export const formatTime = (date: Date) =>
  date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export const normalizeTimeInput = (value: string) => {
  const trimmed = value.trim();

  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }

  return null;
};
