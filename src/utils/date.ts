export const todayInputValue = () => new Date().toISOString().slice(0, 10);

export const formatTime = (date: Date) =>
  date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
